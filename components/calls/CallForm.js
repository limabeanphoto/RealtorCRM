import { useState, useEffect } from 'react'
import Button from '../common/Button';

export default function CallForm({ onSubmit, contact, onCancel, initialData = {} }) {
  const [formData, setFormData] = useState({
    contactId: contact?.id || '',
    duration: 0,
    notes: '',
    outcome: 'Follow Up', // Default value
    ...initialData
  })
  
  // State for follow-up task creation (only relevant for new calls)
  const [createFollowUp, setCreateFollowUp] = useState(initialData?.outcome === 'Follow Up');
  const [followUpData, setFollowUpData] = useState({
    title: `Follow up with ${contact?.name || ''}`,
    priority: 'Medium',
    dueDate: new Date(new Date().setHours(17, 0, 0, 0) + 86400000).toISOString().slice(0, 16), // Default: Tomorrow at 5 PM
  });

  // Update follow-up defaults if contact changes (for new calls)
  useEffect(() => {
    if (!initialData.id && contact) { // Only for new calls when contact is present
      setFollowUpData(prev => ({ ...prev, title: `Follow up with ${contact.name}` }));
    }
  }, [contact, initialData.id]);
  
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    let processedValue;

    if (type === 'checkbox') {
      processedValue = checked;
    } else if (name === 'duration') {
      processedValue = parseInt(value) || 0;
    } else {
      processedValue = value;
    }

    setFormData(prev => {
      const newState = {
        ...prev,
        [name]: processedValue
      };

      // Auto-set follow up checkbox if outcome is 'Follow Up'
      if (name === 'outcome' && value === 'Follow Up') {
        setCreateFollowUp(true);
      }
      
      // Auto-set isDeal if outcome is 'Deal Closed'
      if (name === 'outcome') {
        newState.isDeal = value === 'Deal Closed';
      }

      return newState;
    });
  };
  
  const handleFollowUpChange = (e) => {
    setFollowUpData({
      ...followUpData,
      [e.target.name]: e.target.value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Ensure contactId is set before submitting
    if (!formData.contactId) {
        alert("Please select a contact before logging the call.");
        return;
    }

    // Submit call data first
    const callResult = await onSubmit(formData)
    
    // If call was successful and follow-up is requested, create a task
    // Only do this for new calls (no id in initialData)
    if (callResult && callResult.success && createFollowUp && !initialData.id) {
      try {
        // Create follow-up task
        const taskResponse = await fetch('/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            title: followUpData.title,
            description: `Follow-up from call on ${new Date().toLocaleDateString()}${formData.notes ? `: ${formData.notes}` : ''}`,
            priority: followUpData.priority,
            dueDate: followUpData.dueDate,
            contactId: formData.contactId,
            callId: callResult.data.id,
            status: 'Open' // Tasks are always 'Open' initially
          })
        })
        
        const taskData = await taskResponse.json()
        
        if (!taskData.success) {
          console.error('Failed to create follow-up task:', taskData.message)
          // Don't alert here, as the main call was successful
        }
      } catch (error) {
        console.error('Error creating follow-up task:', error)
      }
    }
  }
  
  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '500px', margin: '0 auto' }}>
      {contact && (
        <div style={{ 
          padding: '1rem', 
          marginBottom: '1rem', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '4px',
          border: '1px solid #ddd'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>{contact.name}</h3>
          {contact.company && <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#555' }}>{contact.company}</p>}
          <p style={{ margin: '0', fontSize: '0.9rem', color: '#555' }}>{contact.phone}</p>
        </div>
      )}
      
      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="duration" style={{ display: 'block', marginBottom: '0.5rem' }}>
          Call Duration (minutes)*
        </label>
        <input
          id="duration"
          type="number"
          name="duration"
          value={formData.duration}
          onChange={handleChange}
          min="0"
          required
          style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
        />
      </div>
      
      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="outcome" style={{ display: 'block', marginBottom: '0.5rem' }}>
          Outcome*
        </label>
        <select
          id="outcome"
          name="outcome"
          value={formData.outcome}
          onChange={handleChange}
          required
          style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
        >
          <option value="Follow Up">Follow Up</option>
          <option value="No Answer">No Answer</option>
          <option value="Deal Closed">Deal Closed</option>
          <option value="Not Interested">Not Interested</option>
        </select>
      </div>
      
      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="notes" style={{ display: 'block', marginBottom: '0.5rem' }}>
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
          rows="4"
        />
      </div>
      
      {/* Follow-up Task Section - Only show for new calls */}
      {!initialData.id && (
        <div style={{ 
          marginBottom: '1.5rem', 
          padding: '1rem',
          border: '1px solid #ddd',
          borderRadius: '4px',
          backgroundColor: '#f8f9fa'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: createFollowUp ? '1rem' : '0' // Remove bottom margin if details are hidden
          }}>
            <input
              type="checkbox"
              id="createFollowUp"
              checked={createFollowUp}
              onChange={(e) => setCreateFollowUp(e.target.checked)}
              style={{ marginRight: '0.5rem' }}
            />
            <label htmlFor="createFollowUp" style={{ fontWeight: 'bold' }}>
              Create Follow-up Task
            </label>
          </div>
          
          {createFollowUp && (
            <div style={{ marginTop: '1rem' }}> {/* Added margin top for spacing */}
              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="followUpTitle" style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Task Title
                </label>
                <input
                  id="followUpTitle"
                  type="text"
                  name="title"
                  value={followUpData.title}
                  onChange={handleFollowUpChange}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="followUpPriority" style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Priority
                </label>
                <select
                  id="followUpPriority"
                  name="priority"
                  value={followUpData.priority}
                  onChange={handleFollowUpChange}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="followUpDueDate" style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Due Date/Time
                </label>
                <input
                  id="followUpDueDate"
                  type="datetime-local"
                  name="dueDate"
                  value={followUpData.dueDate}
                  onChange={handleFollowUpChange}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                  min={new Date().toISOString().slice(0, 16)} // Prevent setting past due dates
                />
              </div>
            </div>
          )}
        </div>
      )}
      
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
        {onCancel && (
          <Button
            type="button"
            onClick={onCancel}
            variant="outline"
            tooltip="Cancel logging this call and close window"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          tooltip={initialData.id ? 'Save changes to this call record' : 'Save this call record'}
          disabled={!formData.contactId} // Disable if no contact is selected
        >
          {initialData.id ? 'Update Call' : 'Log Call'}
        </Button>
      </div>
    </form>
  );
}