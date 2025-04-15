// pages/contacts.js
import { useState, useEffect } from 'react'
import ContactForm from '../components/contacts/ContactForm'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import Layout from '../components/Layout'

export default function Contacts() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [user, setUser] = useState(null)
  
  // Get user from localStorage
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}')
    setUser(userData)
  }, [])
  
  // Fetch contacts
  useEffect(() => {
    async function fetchContacts() {
      try {
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
    
    fetchContacts()
  }, [])
  
  // Handle form submission
  const handleSubmit = async (formData) => {
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
        setShowForm(false)
      } else {
        alert('Error creating contact: ' + data.message)
      }
    } catch (error) {
      console.error('Error creating contact:', error)
      alert('Error creating contact')
    }
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
              {showForm ? 'Cancel' : 'Add Contact'}
            </button>
          </div>
          
          {showForm && (
            <div style={{ marginBottom: '2rem' }}>
              <h2>Add New Contact</h2>
              <ContactForm onSubmit={handleSubmit} />
            </div>
          )}
          
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No contacts found. Add your first contact to get started.</p>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  )
}// pages/contacts.js
import { useState, useEffect } from 'react'
import ContactForm from '../components/contacts/ContactForm'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import Layout from '../components/Layout'

export default function Contacts() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [user, setUser] = useState(null)
  
  // Get user from localStorage
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}')
    setUser(userData)
  }, [])
  
  // Fetch contacts
  useEffect(() => {
    async function fetchContacts() {
      try {
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
    
    fetchContacts()
  }, [])
  
  // Handle form submission
  const handleSubmit = async (formData) => {
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
        setShowForm(false)
      } else {
        alert('Error creating contact: ' + data.message)
      }
    } catch (error) {
      console.error('Error creating contact:', error)
      alert('Error creating contact')
    }
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
              {showForm ? 'Cancel' : 'Add Contact'}
            </button>
          </div>
          
          {showForm && (
            <div style={{ marginBottom: '2rem' }}>
              <h2>Add New Contact</h2>
              <ContactForm onSubmit={handleSubmit} />
            </div>
          )}
          
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No contacts found. Add your first contact to get started.</p>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  )
}