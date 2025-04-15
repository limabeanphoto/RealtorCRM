// pages/calls.js
import { useState, useEffect } from 'react'
import CallForm from '../components/calls/CallForm'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import Layout from '../components/Layout'

export default function Calls() {
  const [calls, setCalls] = useState([])
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedContact, setSelectedContact] = useState(null)
  const [showForm, setShowForm] = useState(false)
  
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
  
  // Handle form submission
  const handleSubmit = async (formData) => {
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
        setShowForm(false)
        setSelectedContact(null)
      } else {
        alert('Error logging call: ' + data.message)
      }
    } catch (error) {
      console.error('Error logging call:', error)
      alert('Error logging call')
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
      'Wrong Number': { backgroundColor: '#f8d7da', color: '#721c24' }
    }
    
    return styles[outcome] || {}
  }
  
  return (
    <ProtectedRoute>
      <Layout>
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
            <button
              onClick={() => setShowForm(!showForm)}
              style={{
                backgroundColor: showForm ? '#e74c3c' : '#4a69bd',
                color: 'white',
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {showForm ? 'Cancel' : 'Log New Call'}
            </button>
          </div>
          
          {showForm && (
            <div style={{ marginBottom: '2rem' }}>
              <h2>Log New Call</h2>
              
              {!selectedContact && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                    Select Contact
                  </label>
                  <select
                    onChange={handleContactSelect}
                    style={{ width: '100%', maxWidth: '500px', padding: '0.5rem' }}
                  >
                    <option value="">-- Select a contact --</option>
                    {contacts.map(contact => (
                      <option key={contact.id} value={contact.id}>
                        {contact.name} {contact.company ? `(${contact.company})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {selectedContact && (
                <CallForm 
                  onSubmit={handleSubmit} 
                  contact={selectedContact} 
                  onCancel={() => setSelectedContact(null)}
                />
              )}
            </div>
          )}
          
          {loading ? (
            <p>Loading calls...</p>
          ) : calls.length > 0 ? (
            <div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #ddd' }}>Date/Time</th>
                    <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #ddd' }}>Contact</th>
                    <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #ddd' }}>Duration</th>
                    <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #ddd' }}>Outcome</th>
                    <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #ddd' }}>Notes</th>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No calls recorded yet. Log your first call to get started.</p>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  )
}