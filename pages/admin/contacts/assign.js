// pages/admin/contacts/assign.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';
import Button from '../../../components/common/Button';
import theme from '../../../styles/theme';

export default function BulkAssignContacts() {
  const router = useRouter();
  const [contacts, setContacts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('Open'); // Default to Open contacts
  
  useEffect(() => {
    // Fetch contacts and users
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Fetch contacts based on status filter
        const contactsResponse = await fetch(`/api/contacts?status=${statusFilter}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const contactsData = await contactsResponse.json();
        
        // Fetch users (members only)
        const usersResponse = await fetch('/api/users', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const usersData = await usersResponse.json();
        
        if (contactsData.success) {
          setContacts(contactsData.data);
        } else {
          setError('Error fetching contacts: ' + (contactsData.message || 'Unknown error'));
        }
        
        if (usersData.success) {
          // Filter for member users
          const memberUsers = usersData.data.filter(user => user.role === 'member');
          setUsers(memberUsers);
        } else {
          setError('Error fetching users: ' + (usersData.message || 'Unknown error'));
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('An error occurred while fetching data: ' + (error.message || 'Unknown error'));
        setLoading(false);
      }
    };
    
    fetchData();
  }, [statusFilter]); // Re-fetch when status filter changes
  
  const handleSelectAllContacts = (e) => {
    if (e.target.checked) {
      setSelectedContacts(contacts.map(contact => contact.id));
    } else {
      setSelectedContacts([]);
    }
  };
  
  const handleSelectContact = (contactId) => {
    if (selectedContacts.includes(contactId)) {
      setSelectedContacts(selectedContacts.filter(id => id !== contactId));
    } else {
      setSelectedContacts([...selectedContacts, contactId]);
    }
  };
  
  const handleAssignContacts = async () => {
    if (!selectedUser) {
      alert('Please select a user to assign contacts to');
      return;
    }
    
    if (selectedContacts.length === 0) {
      alert('Please select at least one contact to assign');
      return;
    }
    
    setAssignLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      
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
            userId: selectedUser,
            newStatus: 'Active' // Ensure status is set to Active
          })
        })
      );
      
      // Wait for all assignments to complete
      const responses = await Promise.all(assignPromises);
      
      // Check for errors
      const errorResponses = responses.filter(response => !response.ok);
      
      if (errorResponses.length > 0) {
        setError(`Failed to assign ${errorResponses.length} contacts`);
      } else {
        // Update the UI to remove assigned contacts
        setContacts(contacts.filter(contact => !selectedContacts.includes(contact.id)));
        setSelectedContacts([]);
        
        // Show success message
        alert(`Successfully assigned ${selectedContacts.length} contacts`);
      }
    } catch (error) {
      console.error('Error assigning contacts:', error);
      setError('An error occurred while assigning contacts: ' + (error.message || 'Unknown error'));
    } finally {
      setAssignLoading(false);
    }
  };
  
  return (
    <ProtectedRoute adminOnly={true}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1>Assign Contacts</h1>
          <Button
            onClick={() => router.push('/admin/contacts')}
            variant="outline"
          >
            Back to Contacts
          </Button>
        </div>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>Loading data...</p>
          </div>
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
            
            {/* Status Filter */}
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '8px', 
              boxShadow: theme.shadows.sm, 
              padding: '1.5rem', 
              marginBottom: '1.5rem' 
            }}>
              <h2 style={{ marginTop: 0 }}>1. Select Contact Status</h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button
                  onClick={() => setStatusFilter('Open')}
                  variant={statusFilter === 'Open' ? 'primary' : 'outline'}
                >
                  Open Contacts
                </Button>
                <Button
                  onClick={() => setStatusFilter('Active')}
                  variant={statusFilter === 'Active' ? 'primary' : 'outline'}
                >
                  Active Contacts
                </Button>
                <Button
                  onClick={() => setStatusFilter('Closed')}
                  variant={statusFilter === 'Closed' ? 'primary' : 'outline'}
                >
                  Closed Contacts
                </Button>
              </div>
            </div>
            
            {/* User Selection */}
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '8px', 
              boxShadow: theme.shadows.sm, 
              padding: '1.5rem', 
              marginBottom: '1.5rem' 
            }}>
              <h2 style={{ marginTop: 0 }}>2. Select Team Member to Assign</h2>
              
              {users.length === 0 ? (
                <p>No team members available for assignment</p>
              ) : (
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    borderRadius: '4px', 
                    border: '1px solid #ddd' 
                  }}
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
            
            {/* Contact Selection */}
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '8px', 
              boxShadow: theme.shadows.sm, 
              padding: '1.5rem', 
              marginBottom: '1.5rem' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0 }}>3. Select Contacts to Assign</h2>
                
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectedContacts.length === contacts.length && contacts.length > 0}
                      onChange={handleSelectAllContacts}
                      style={{ marginRight: '0.5rem' }}
                      disabled={contacts.length === 0}
                    />
                    Select All ({contacts.length})
                  </label>
                </div>
              </div>
              
              {contacts.length === 0 ? (
                <p>No {statusFilter.toLowerCase()} contacts available to assign</p>
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
                        <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '1px solid #ddd' }}>Status</th>
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
                          <td style={{ padding: '0.75rem', borderBottom: '1px solid #ddd' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.8rem',
                              backgroundColor: contact.status === 'Open' ? '#78e08f' : 
                                              contact.status === 'Active' ? '#4a69bd' : 
                                              contact.status === 'Closed' ? '#e74c3c' : '#e2e3e5',
                              color: 'white'
                            }}>
                              {contact.status}
                            </span>
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
            
            {/* Assignment Action */}
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '8px', 
              boxShadow: theme.shadows.sm, 
              padding: '1.5rem' 
            }}>
              <h2 style={{ marginTop: 0 }}>4. Assign Contacts</h2>
              
              <div style={{ marginTop: '1rem' }}>
                <Button
                  onClick={handleAssignContacts}
                  variant="primary"
                  disabled={!selectedUser || selectedContacts.length === 0 || assignLoading}
                  style={{ minWidth: '200px' }}
                >
                  {assignLoading ? 'Assigning...' : `Assign ${selectedContacts.length} Contacts`}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}