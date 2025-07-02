// components/calls/CallForm.js with fixes for updating metrics
import { useEffect } from 'react';
import { useForm } from '../../utils/useForm';
import Button from '../common/Button';

export default function CallForm({ onSubmit, contact, onCancel, initialData = {}, onMetricsUpdate }) {
  // Use our custom form hook with initial values and auto-detected isDeal
  const { values, handleChange, setFieldValue, createSubmitHandler } = useForm({
    contactId: contact?.id || '',
    duration: 0,
    notes: '',
    outcome: 'No Answer', // Default value
    isDeal: initialData.outcome === 'Deal Closed', // Auto-detect
    ...initialData
  });
  
  // For follow-up task creation (only relevant for new calls)
  const { values: followUpValues, handleChange: handleFollowUpChange } = useForm({
    title: `Follow up with ${contact?.name || ''}`,
    priority: 'Medium',
    dueDate: new Date(new Date().setHours(17, 0, 0, 0) + 86400000).toISOString().slice(0, 16), // Default: Tomorrow at 5 PM
  });
  
  // State for follow-up creation - handled separately since it's a checkbox
  const { values: formOptions, handleChange: handleOptionsChange } = useForm({
    createFollowUp: initialData?.outcome === 'Follow Up'
  });

  // Update follow-up defaults if contact changes (for new calls)
  useEffect(() => {
    if (!initialData.id && contact) { // Only for new calls when contact is present
      setFieldValue('title', `Follow up with ${contact.name}`);
    }
  }, [contact, initialData.id]);
  
  // Auto-set isDeal if outcome is 'Deal Closed'
  useEffect(() => {
    if (values.outcome === 'Deal Closed') {
      setFieldValue('isDeal', true);
    }
  }, [values.outcome]);
  
  // Auto-set follow up checkbox if outcome is 'Follow Up'
  useEffect(() => {
    if (values.outcome === 'Follow Up') {
      setFieldValue('createFollowUp', true);
    }
  }, [values.outcome]);
  
  // Create a custom submit handler that will handle both the call and follow-up task
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Ensure contactId is set before submitting
    if (!values.contactId) {
      alert("Please select a contact before logging the call.");
      return;
    }

    // Submit call data first
    const callResult = await onSubmit(values);
    
    // If call was successful and follow-up is requested, create a task
    // Only do this for new calls (no id in initialData)
    if (callResult && callResult.success && formOptions.createFollowUp && !initialData.id) {
      try {
        // Create follow-up task
        const taskResponse = await fetch('/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            title: followUpValues.title,
            description: `Follow-up from call on ${new Date().toLocaleDateString()}${values.notes ? `: ${values.notes}` : ''}`,
            priority: followUpValues.priority,
            dueDate: followUpValues.dueDate,
            contactId: values.contactId,
            callId: callResult.data.id,
            status: 'Open' // Tasks are always 'Open' initially
          })
        });
        
        const taskData = await taskResponse.json();
        
        if (!taskData.success) {
          console.error('Failed to create follow-up task:', taskData.message);
          // Don't alert here, as the main call was successful
        }
      } catch (error) {
        console.error('Error creating follow-up task:', error);
      }
    }
    
    // Trigger dashboard metrics update if the call was successful
    if (callResult && callResult.success && onMetricsUpdate) {
      onMetricsUpdate();
    }
  };
  
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
          value={values.duration}
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
          value={values.outcome}
          onChange={handleChange}
          required
          style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
        >
          <option value="No Answer">No Answer</option>
          <option value="Follow Up">Follow Up</option>
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
          value={values.notes}
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
            marginBottom: formOptions.createFollowUp ? '1rem' : '0' // Remove bottom margin if details are hidden
          }}>
            <input
              type="checkbox"
              id="createFollowUp"
              name="createFollowUp"
              checked={formOptions.createFollowUp}
              onChange={handleOptionsChange}
              style={{ marginRight: '0.5rem' }}
            />
            <label htmlFor="createFollowUp" style={{ fontWeight: 'bold' }}>
              Create Follow-up Task
            </label>
          </div>
          
          {formOptions.createFollowUp && (
            <div style={{ marginTop: '1rem' }}> {/* Added margin top for spacing */}
              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="followUpTitle" style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Task Title
                </label>
                <input
                  id="followUpTitle"
                  type="text"
                  name="title"
                  value={followUpValues.title}
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
                  value={followUpValues.priority}
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
                  value={followUpValues.dueDate}
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
          disabled={!values.contactId} // Disable if no contact is selected
        >
          {initialData.id ? 'Update Call' : 'Log Call'}
        </Button>
      </div>
    </form>
  );
}