import { useState, useEffect } from 'react'
import ContactForm from '../components/contacts/ContactForm'

export default function Contacts() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  
  // Fetch contacts
  useEffect(() => {
    async function fetchContacts() {
      try {
        const response = await fetch('/api/contacts')
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
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
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
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Contacts</h1>
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
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr key={contact.id}>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #ddd' }}>{contact.name}</td>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #ddd' }}>{contact.company || '-'}</td>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #ddd' }}>{contact.phone}</td>
                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #ddd' }}>{contact.email || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No contacts found. Add your first contact to get started.</p>
      )}
    </div>
  )
}