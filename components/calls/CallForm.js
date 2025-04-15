import { useState, useEffect } from 'react'

export default function CallForm({ onSubmit, contact, onCancel, initialData = {} }) {
  const [formData, setFormData] = useState({
    contactId: contact?.id || '',
    duration: 0,
    notes: '',
    outcome: 'Interested', // Default value
    isDeal: false,
    dealValue: '',
    ...initialData
  })
  
  const [createFollowUp, setCreateFollowUp] = useState(initialData?.outcome === 'Follow Up')
  const [followUpData, setFollowUpData] = useState({
    title: `Follow up with ${contact?.name || ''}`,
    priority: 'Medium',
    dueDate: new Date(new Date().setHours(17, 0, 0, 0) + 86400000).toISOString().slice(0, 16), // Tomorrow at 5 PM
  })
  
  const handleChange = (e) => {
    const value = e.target.name === 'duration' 
      ? parseInt(e.target.value) || 0 
      : e.target.name === 'dealValue'
        ? parseFloat(e.target.value) || ''
        : e.target.value
    
    setFormData({
      ...formData,
      [e.target.name]: value
    })
    
    // Auto-set follow up checkbox if outcome is 'Follow Up'
    if (e.target.name === 'outcome' && e.target.value === 'Follow Up') {
      setCreateFollowUp(true)
    }
    
    // Auto-set isDeal if outcome is 'Deal Closed' or 'Interested'
    if (e.target.name === 'outcome') {
      setFormData(prev => ({
        ...prev,
        isDeal: ['Deal Closed', 'Interested'].includes(e.target.value)
      }))
    }
  }
  
  const handleFollowUpChange = (e) => {
    setFollowUpData({
      ...followUpData,
      [e.target.name]: e.target.value
    })
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
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
            contactId: contact.id,
            callId: callResult.data.id,
            status: 'Open'
          })
        })
        
        const taskData = await taskResponse.json()
        
        if (!taskData.success) {
          console.error('Failed to create follow-up task:', taskData.message)
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
          borderRadius: '4px'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>{contact.name}</h3>
          {contact.company && <p style={{ margin: '0 0 0.5rem 0' }}>Company: {contact.company}</p>}
          <p style={{ margin: '0' }}>Phone: {contact.phone}</p>
        </div>
      )}
      
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
          Call Duration (minutes)
        </label>
        <input
          type="number"
          name="duration"
          value={formData.duration}
          onChange={handleChange}
          min="0"
          style={{ width: '100%', padding: '0.5rem' }}
        />
      </div>
      
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
          Outcome*
        </label>
        <select
          name="outcome"
          value={formData.outcome}
          onChange={handleChange}
          required
          style={{ width: '100%', padding: '0.5rem' }}
        >
          <option value="Interested">Interested</option>
          <option value="Not Interested">Not Interested</option>
          <option value="Follow Up">Follow Up</option>
          <option value="No Answer">No Answer</option>
          <option value="Left Message">Left Message</option>
          <option value="Wrong Number">Wrong Number</option>
          <option value="Deal Closed">Deal Closed</option>
        </select>
      </div>
      
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
          <input
            type="checkbox"
            id="isDeal"
            name="isDeal"
            checked={formData.isDeal}
            onChange={(e) => setFormData({...formData, isDeal: e.target.checked})}
            style={{ marginRight: '0.5rem' }}
          />
          <label htmlFor="isDeal">Mark as Deal</label>
        </div>
        
        {formData.isDeal && (
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Deal Value ($)
            </label>
            <input
              type="number"
              name="dealValue"
              value={formData.dealValue}
              onChange={handleChange}
              placeholder="0.00"
              min="0"
              step="0.01"
              style={{ width: '100%', padding: '0.5rem' }}
            />
          </div>
        )}
      </div>
      
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
          Notes
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          style={{ width: '100%', padding: '0.5rem' }}
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
            marginBottom: '1rem'
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
            <div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Task Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={followUpData.title}
                  onChange={handleFollowUpChange}
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Priority
                </label>
                <select
                  name="priority"
                  value={followUpData.priority}
                  onChange={handleFollowUpChange}
                  style={{ width: '100%', padding: '0.5rem' }}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Due Date/Time
                </label>
                <input
                  type="datetime-local"
                  name="dueDate"
                  value={followUpData.dueDate}
                  onChange={handleFollowUpChange}
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </div>
            </div>
          )}
        </div>
      )}
      
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          type="submit"
          style={{
            backgroundColor: '#4a69bd',
            color: 'white',
            padding: '0.5rem 1rem',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {initialData.id ? 'Update Call' : 'Log Call'}
        </button>
        
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{
              backgroundColor: '#e74c3c',
              color: 'white',
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}