// pages/admin/contacts/assign.js
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../../components/Layout'
import ProtectedRoute from '../../../components/auth/ProtectedRoute'

export default function AssignContacts() {
  const router = useRouter()
  const [contacts, setContacts] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedUser, setSelectedUser] = useState('')
  const [selectedContacts, setSelectedContacts] = useState([])
  const [assignLoading, setAssignLoading] = useState(false)
  
  // Use an empty custom header to prevent the default header from being rendered
  const emptyHeader = <div></div>
  
  useEffect(() => {
    // Fetch contacts and users
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token')
        
        // Fetch open contacts
        const contactsResponse = await fetch('/api/contacts?status=Open', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const contactsData = await contactsResponse.json()
        
        // Fetch users (members only)
        const usersResponse = await fetch('/api/users', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const usersData = await usersResponse.json()
        
        if (contactsData.success) {
          setContacts(contactsData.data)
        } else {
          setError('Error fetching contacts: ' + (contactsData.message || 'Unknown error'))
        }
        
        if (usersData.success) {
          // Filter for member users
          const memberUsers = usersData.data.filter(user => user.role === 'member')
          setUsers(memberUsers)
        } else {
          setError('Error fetching users: ' + (usersData.message || 'Unknown error'))
        }
        
        setLoading(false)
      } catch (error) {
        console.error('Error fetching data:', error)
        setError('An error occurred while fetching data: ' + (error.message || 'Unknown error'))
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])
  
  const handleSelectAllContacts = (e) => {
    if (e.target.checked) {
      setSelectedContacts(contacts.map(contact => contact.id))
    } else {
      setSelectedContacts([])
    }
  }
  
  const handleSelectContact = (contactId) => {
    if (selectedContacts.includes(contactId)) {
      setSelectedContacts(selectedContacts.filter(id => id !== contactId))
    } else {
      setSelectedContacts([...selectedContacts, contactId])
    }
  }
  
  const handleAssignContacts = async () => {
    if (!selectedUser) {
      alert('Please select a user to assign contacts to')
      return
    }
    
    if (selectedContacts.length === 0) {
      alert('Please select at least one contact to assign')
      return
    }
    
    setAssignLoading(true)
    setError('')
    
    try {
      const token = localStorage.getItem('token')
      
      // Assign each selected contact to the selected user
      const assignPromises = selectedContacts.map(contactId => 
        fetch('/api/contacts/assign', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            contactId,
            userId: selectedUser
          })
        })
      )
      
      // Wait for all assignments to complete
      const responses = await Promise.all(assignPromises)
      
      // Check for errors
      const errorResponses = responses.filter(response => !response.ok)
      
      if (errorResponses.length > 0) {
        setError(`Failed to assign ${errorResponses.length} contacts`)
      } else {
        // Redirect to contacts page
        router.push('/admin/contacts?status=Assigned')
      }
    } catch (error) {
      console.error('Error assigning contacts:', error)
      setError('An error occurred while assigning contacts: ' + (error.message || 'Unknown error'))
    } finally {
      setAssignLoading(false)
    }
  }
  
  return (
    <ProtectedRoute adminOnly={true}>
      <Layout customHeader={emptyHeader}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h1>Assign Contacts</h1>
            <button
              onClick={() => router.push('/admin/contacts')}
              style={{
                backgroundColor: '#6c757d',
                color: 'white',
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Back to Contacts
            </button>
          </div>
          
          {loading ? (
            <p>Loading data...</p>
          ) : (
            <div>
              {error && (
                <div style={{ 
                  padding: '0.75rem', 
                  backgroundColor: '#f8d7da', 
                  color: '#721c24', 
                  borderRadius: '4px',
                  marginBottom: '1rem'
                }}>
                  {error}
                </div>
              )}
              
              {/* Added: User Selection Section */}
              <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.12)', padding: '1.5rem', marginBottom: '1.5rem' }}>
                <h2>1. Select User to Assign Contacts</h2>
                
                {users.length === 0 ? (
                  <p>No team members available for assignment</p>
                ) : (
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ddd' }}
                  >
                    <option value="">-- Select a team member --</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              
              <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.12)', padding: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h2>2. Select Contacts to Assign</h2>
                  
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={selectedContacts.length === contacts.length}
                        onChange={handleSelectAllContacts}
                        style={{ marginRight: '0.5rem' }}
                      />
                      Select All ({contacts.length})
                    </label>
                  </div>
                </div>
                
                {contacts.length === 0 ? (
                  <p>No open contacts available to assign</p>
                ) : (
                  <div style={{ marginBottom: '1rem' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ width: '50px', textAlign: 'center', padding: '0.75rem', borderBottom: '1px solid #ddd' }}></th>
                          <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '1px solid #ddd' }}>Name</th>
                          <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '1px solid #ddd' }}>Company</th>
                          <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '1px solid #ddd' }}>Phone</th>
                          <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '1px solid #ddd' }}>Email</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contacts.map((contact) => (
                          <tr key={contact.id}>
                            <td style={{ textAlign: 'center', padding: '0.75rem', borderBottom: '1px solid #ddd' }}>
                              <input
                                type="checkbox"
                                checked={selectedContacts.includes(contact.id)}
                                onChange={() => handleSelectContact(contact.id)}
                              />
                            </td>
                            <td style={{ padding: '0.75rem', borderBottom: '1px solid #ddd' }}>
                              {contact.name}
                            </td>
                            <td style={{ padding: '0.75rem', borderBottom: '1px solid #ddd' }}>
                              {contact.company || '-'}
                            </td>
                            <td style={{ padding: '0.75rem', borderBottom: '1px solid #ddd' }}>
                              {contact.phone}
                            </td>
                            <td style={{ padding: '0.75rem', borderBottom: '1px solid #ddd' }}>
                              {contact.email || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                
                <div style={{ textAlign: 'right' }}>
                  <span style={{ marginRight: '1rem' }}>
                    {selectedContacts.length} contacts selected
                  </span>
                </div>
              </div>
              
              <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.12)', padding: '1.5rem' }}>
                <h2>3. Assign Contacts</h2>
                
                <div style={{ marginTop: '1rem' }}>
                  <button
                    onClick={handleAssignContacts}
                    disabled={!selectedUser || selectedContacts.length === 0 || assignLoading}
                    style={{
                      backgroundColor: '#4a69bd',
                      color: 'white',
                      padding: '0.75rem 1.5rem',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '1rem',
                      cursor: (!selectedUser || selectedContacts.length === 0 || assignLoading) ? 'not-allowed' : 'pointer',
                      opacity: (!selectedUser || selectedContacts.length === 0 || assignLoading) ? 0.7 : 1
                    }}
                  >
                    {assignLoading ? 'Assigning...' : `Assign ${selectedContacts.length} Contacts to Selected User`}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  )
}