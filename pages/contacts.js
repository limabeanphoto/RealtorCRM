// pages/contacts.js
import { useState, useEffect } from 'react'
import ContactForm from '../components/contacts/ContactForm'
import ContactModal from '../components/contacts/ContactModal'
import CallModal from '../components/calls/CallModal'
import ProtectedRoute from '../components/auth/ProtectedRoute'

export default function Contacts() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  
  // State for modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isCallModalOpen, setIsCallModalOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState(null)
  
  // Get user from localStorage
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}')
    setUser(userData)
  }, [])
  
  // Fetch contacts
  useEffect(() => {
    fetchContacts()
  }, [])

  const fetchContacts = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch('/api/contacts', {
         headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      
      if (data.success) {
        setContacts(data.data)
      } else {
        console.error('Error fetching contacts:', data.message)
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Error fetching contacts:', error)
      setLoading(false)
    }
  }
  
  // Handle adding a new contact
  const handleAddContact = async (formData) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Add the new contact to the list
        setContacts([data.data, ...contacts])
        return { success: true, data: data.data }
      } else {
        alert('Error creating contact: ' + data.message)
        return { success: false, message: data.message }
      }
    } catch (error) {
      console.error('Error creating contact:', error)
      alert('Error creating contact')
      return { success: false, message: error.message }
    }
  }

  // Handle editing a contact
  const handleEditContact = async (formData) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/contacts/${formData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Update the contact in the list
        setContacts(contacts.map(contact => 
          contact.id === data.data.id ? data.data : contact
        ))
        return { success: true, data: data.data }
      } else {
        alert('Error updating contact: ' + data.message)
        return { success: false, message: data.message }
      }
    } catch (error) {
      console.error('Error updating contact:', error)
      alert('Error updating contact')
      return { success: false, message: error.message }
    }
  }

  // Handle opening the edit modal
  const handleOpenEditModal = (contact) => {
    setSelectedContact(contact)
    setIsEditModalOpen(true)
  }

  // Handle logging a call
  const handleLogCall = (contact) => {
    setSelectedContact(contact)
    setIsCallModalOpen(true)
  }

  // Handle call form submission
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
        alert('Call logged successfully')
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
  
  return (
    <ProtectedRoute>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1>Contacts</h1>
          <button
            onClick={() => setIsAddModalOpen(true)}
            style={{
              backgroundColor: '#4a69bd',
              color: 'white',
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Add Contact
          </button>
        </div>
        
        {loading ? (
          <p>Loading contacts...</p>
        ) : contacts.length > 0 ? (
          <div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #ddd' }}>Name</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #ddd' }}>Company</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #ddd' }}>Phone</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #ddd' }}>Email</th>
                  {user?.role === 'admin' && (
                    <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #ddd' }}>Status</th>
                  )}
                  <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #ddd' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact) => (
                  <tr key={contact.id}>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #ddd' }}>{contact.name}</td>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #ddd' }}>{contact.company || '-'}</td>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #ddd' }}>{contact.phone}</td>
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #ddd' }}>{contact.email || '-'}</td>
                    {user?.role === 'admin' && (
                      <td style={{ padding: '0.5rem', borderBottom: '1px solid #ddd' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          backgroundColor: contact.status === 'Open' ? '#78e08f' : '#4a69bd',
                          color: 'white'
                        }}>
                          {contact.status || 'Open'}
                          {contact.assignedToUser && ` (${contact.assignedToUser.firstName})`}
                        </span>
                      </td>
                    )}
                    <td style={{ padding: '0.5rem', borderBottom: '1px solid #ddd' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleOpenEditModal(contact)}
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
                        <button
                          onClick={() => handleLogCall(contact)}
                          style={{
                            backgroundColor: '#78e08f',
                            color: 'white',
                            padding: '0.25rem 0.5rem',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                          }}
                        >
                          Log Call
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No contacts found. Add your first contact to get started.</p>
        )}

        {/* Add Contact Modal */}
        <ContactModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          contact={{}}
          onSubmit={handleAddContact}
          mode="add"
        />

        {/* Edit Contact Modal */}
        <ContactModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          contact={selectedContact || {}}
          onSubmit={handleEditContact}
          mode="edit"
        />

        {/* Call Modal */}
        <CallModal
          isOpen={isCallModalOpen}
          onClose={() => setIsCallModalOpen(false)}
          contact={selectedContact}
          onSubmit={handleCallSubmit}
        />
      </div>
    </ProtectedRoute>
  )
}