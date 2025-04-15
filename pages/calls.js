// pages/calls.js
import { useState, useEffect } from 'react'
import CallModal from '../components/calls/CallModal'
import ProtectedRoute from '../components/auth/ProtectedRoute'

export default function Calls() {
  const [calls, setCalls] = useState([])
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isCallModalOpen, setIsCallModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState(null)
  const [selectedCall, setSelectedCall] = useState(null)
  
  // Fetch calls and contacts
  useEffect(() => {
    async function fetchData() {
      try {
        const token = localStorage.getItem('token')
        
        // Fetch calls
        const callsResponse = await fetch('/api/calls', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const callsData = await callsResponse.json()
        
        if (callsData.success) {
          setCalls(callsData.data)
        } else {
          console.error('Error fetching calls:', callsData.message)
        }
        
        // Fetch contacts for the dropdown
        const contactsResponse = await fetch('/api/contacts', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const contactsData = await contactsResponse.json()
        
        if (contactsData.success) {
          setContacts(contactsData.data)
        } else {
          console.error('Error fetching contacts:', contactsData.message)
        }
        
        setLoading(false)
      } catch (error) {
        console.error('Error fetching data:', error)
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])
  
  // Handle creating a new call
  const handleCallSubmit = async (formData) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/calls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Add the new call to the list
        setCalls([data.data, ...calls])
        return { success: true, data: data.data }
      } else {
        alert('Error logging call: ' + data.message)
        return { success: false, message: data.message }
      }
    } catch (error) {
      console.error('Error logging call:', error)
      alert('Error logging call')
      return { success: false, message: error.message }
    }
  }

  // Handle editing a call
  const handleEditCall = async (formData) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/calls/${formData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Update the call in the list
        setCalls(calls.map(call => 
          call.id === data.data.id ? data.data : call
        ))
        return { success: true, data: data.data }
      } else {
        alert('Error updating call: ' + data.message)
        return { success: false, message: data.message }
      }
    } catch (error) {
      console.error('Error updating call:', error)
      alert('Error updating call')
      return { success: false, message: error.message }
    }
  }

  // Open modal to select a contact
  const handleNewCall = () => {
    setSelectedContact(null)
    setIsCallModalOpen(true)
  }

  // Handle opening the edit modal
  const handleOpenEditModal = (call) => {
    setSelectedCall(call)
    setIsEditModalOpen(true)
  }

  // Handle contact selection for new call
  const handleContactSelect = (e) => {
    const contactId = e.target.value
    
    if (contactId) {
      const contact = contacts.find(c => c.id === contactId)
      setSelectedContact(contact)
    } else {
      setSelectedContact(null)
    }
  }
  
  // Format date for display
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }
  
  // Get style based on outcome
  const getOutcomeStyle = (outcome) => {
    const styles = {
      'Interested': { backgroundColor: '#d4edda', color: '#155724' },
      'Not Interested': { backgroundColor: '#f8d7da', color: '#721c24' },
      'Follow Up': { backgroundColor: '#fff3cd', color: '#856404' },
      'No Answer': { backgroundColor: '#e2e3e5', color: '#383d41' },
      'Left Message': { backgroundColor: '#cce5ff', color: '#004085' },
      'Wrong Number': { backgroundColor: '#f8d7da', color: '#721c24' },
      'Deal Closed': { backgroundColor: '#d4edda', color: '#155724' }
    }
    
    return styles[outcome] || {}
  }
  
  return (
    <ProtectedRoute>
      <div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '2rem', 
          flexWrap: 'wrap', 
          gap: '1rem' 
        }}>
          <h1>Calls</h1>
          <button
            onClick={handleNewCall}
            style={{
              backgroundColor: '#4a69bd',
              color: 'white',
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Log New Call
          </button>
        </div>
        
        {loading ? (
          <p>Loading calls...</p>
        ) : calls.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #ddd' }}>Date/Time</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #ddd' }}>Contact</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #ddd' }}>Duration</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #ddd' }}>Outcome</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #ddd' }}>Notes</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #ddd' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {calls.map((call) => (
                  <tr key={call.id}>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #ddd' }}>
                      {formatDate(call.date)}
                    </td>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #ddd' }}>
                      <div>{call.contact.name}</div>
                      {call.contact.company && <div style={{ fontSize: '0.8rem', color: '#666' }}>{call.contact.company}</div>}
                    </td>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #ddd' }}>
                      {call.duration} min
                    </td>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #ddd' }}>
                      <span style={{ 
                        display: 'inline-block',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        ...getOutcomeStyle(call.outcome)
                      }}>
                        {call.outcome}
                      </span>
                    </td>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #ddd' }}>
                      {call.notes || '-'}
                    </td>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #ddd' }}>
                      <button
                        onClick={() => handleOpenEditModal(call)}
                        style={{
                          backgroundColor: '#4a69bd',
                          color: 'white',
                          padding: '0.25rem 0.5rem',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No calls recorded yet. Log your first call to get started.</p>
        )}

        {/* New Call Modal */}
        <CallModal
          isOpen={isCallModalOpen}
          onClose={() => setIsCallModalOpen(false)}
          contact={selectedContact}
          onSubmit={handleCallSubmit}
          mode="new"
        />

        {/* Edit Call Modal */}
        <CallModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          call={selectedCall}
          onSubmit={handleEditCall}
          mode="edit"
        />

        {/* Contact Selection Modal (when no contact is selected) */}
        {isCallModalOpen && !selectedContact && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => setIsCallModalOpen(false)}
          >
            <div
              style={{
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '8px',
                maxWidth: '600px',
                width: '100%',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0 }}>Select Contact</h2>
                <button
                  onClick={() => setIsCallModalOpen(false)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                  }}
                >
                  &times;
                </button>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Select Contact for Call
                </label>
                <select
                  onChange={handleContactSelect}
                  style={{ width: '100%', padding: '0.5rem' }}
                >
                  <option value="">-- Select a contact --</option>
                  {contacts.map(contact => (
                    <option key={contact.id} value={contact.id}>
                      {contact.name} {contact.company ? `(${contact.company})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}