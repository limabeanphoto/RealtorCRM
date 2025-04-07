import { useState } from 'react'

export default function CallForm({ onSubmit, contact, onCancel }) {
  const [formData, setFormData] = useState({
    contactId: contact?.id || '',
    duration: 0,
    notes: '',
    outcome: 'Interested' // Default value
  })
  
  const handleChange = (e) => {
    const value = e.target.name === 'duration' ? parseInt(e.target.value) || 0 : e.target.value
    
    setFormData({
      ...formData,
      [e.target.name]: value
    })
  }
  
  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
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
        </select>
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
          Log Call
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