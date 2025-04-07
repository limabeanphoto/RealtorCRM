import { useState, useEffect } from 'react'

export default function TaskForm({ onSubmit, initialData = {}, onCancel, contacts = [] }) {
  // Initialize formData with defaults or provided initialData
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'Open',
    priority: 'Medium',
    dueDate: new Date(new Date().setHours(17, 0, 0, 0) + 86400000).toISOString().slice(0, 16), // Tomorrow at 5 PM
    contactId: '',
    callId: '',
    ...initialData
  })
  
  const [selectedContact, setSelectedContact] = useState(null)
  
  // Find contact details if contactId is provided
  useEffect(() => {
    if (formData.contactId && contacts.length > 0) {
      const contact = contacts.find(c => c.id === formData.contactId)
      setSelectedContact(contact || null)
    }
  }, [formData.contactId, contacts])
  
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }
  
  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }
  
  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '500px', margin: '0 auto' }}>
      {/* Contact Selection */}
      {contacts.length > 0 && !selectedContact && (
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>
            Associated Contact (Optional)
          </label>
          <select
            name="contactId"
            value={formData.contactId}
            onChange={handleChange}
            style={{ width: '100%', padding: '0.5rem' }}
          >
            <option value="">-- No Associated Contact --</option>
            {contacts.map(contact => (
              <option key={contact.id} value={contact.id}>
                {contact.name} {contact.company ? `(${contact.company})` : ''}
              </option>
            ))}
          </select>
        </div>
      )}
      
      {/* Display selected contact info */}
      {selectedContact && (
        <div style={{ 
          padding: '1rem', 
          marginBottom: '1rem', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '4px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: '0 0 0.5rem 0' }}>{selectedContact.name}</h3>
            <button
              type="button"
              onClick={() => {
                setFormData({
                  ...formData,
                  contactId: ''
                })
                setSelectedContact(null)
              }}
              style={{
                backgroundColor: '#6c757d',
                color: 'white',
                padding: '0.25rem 0.5rem',
                border: 'none',
                borderRadius: '4px',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              Change
            </button>
          </div>
          {selectedContact.company && <p style={{ margin: '0 0 0.5rem 0' }}>Company: {selectedContact.company}</p>}
          <p style={{ margin: '0' }}>Phone: {selectedContact.phone}</p>
        </div>
      )}
      
      {/* Title */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
          Task Title*
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          style={{ width: '100%', padding: '0.5rem' }}
          placeholder="e.g., Follow up about property listing"
        />
      </div>
      
      {/* Description */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          style={{ width: '100%', padding: '0.5rem' }}
          rows="3"
          placeholder="Add any additional details about the task"
        />
      </div>
      
      {/* Due Date */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
          Due Date/Time*
        </label>
        <input
          type="datetime-local"
          name="dueDate"
          value={formData.dueDate}
          onChange={handleChange}
          required
          style={{ width: '100%', padding: '0.5rem' }}
        />
      </div>
      
      {/* Status */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
          Status
        </label>
        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          style={{ width: '100%', padding: '0.5rem' }}
        >
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
      </div>
      
      {/* Priority */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
          Priority
        </label>
        <select
          name="priority"
          value={formData.priority}
          onChange={handleChange}
          style={{ width: '100%', padding: '0.5rem' }}
        >
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
      </div>
      
      {/* Buttons */}
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
          {initialData.id ? 'Update Task' : 'Create Task'}
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