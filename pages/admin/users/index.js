// pages/admin/users/index.js
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../../components/Layout'
import ProtectedRoute from '../../../components/auth/ProtectedRoute'

export default function UserManagement() {
  const router = useRouter()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // Fetch users
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token')
        
        const response = await fetch('/api/users', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        const data = await response.json()
        
        if (data.success) {
          setUsers(data.data)
        } else {
          console.error('Error fetching users:', data.message)
        }
        
        setLoading(false)
      } catch (error) {
        console.error('Error fetching users:', error)
        setLoading(false)
      }
    }
    
    fetchUsers()
  }, [])
  
  const handleDeleteUser = async (userId) => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        const token = localStorage.getItem('token')
        
        const response = await fetch(`/api/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        const data = await response.json()
        
        if (data.success) {
          // Remove user from list
          setUsers(users.filter(user => user.id !== userId))
          alert('User deleted successfully')
        } else {
          alert(`Error deleting user: ${data.message}`)
        }
      } catch (error) {
        console.error('Error deleting user:', error)
        alert('Error deleting user')
      }
    }
  }
  
  return (
    <ProtectedRoute adminOnly={true}>
      <Layout>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h1>User Management</h1>
            <button
              onClick={() => router.push('/admin/users/new')}
              style={{
                backgroundColor: '#4a69bd',
                color: 'white',
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Add New User
            </button>
          </div>
          
          {loading ? (
            <p>Loading users...</p>
          ) : (
            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '1rem', borderBottom: '1px solid #ddd' }}>Name</th>
                    <th style={{ textAlign: 'left', padding: '1rem', borderBottom: '1px solid #ddd' }}>Email</th>
                    <th style={{ textAlign: 'left', padding: '1rem', borderBottom: '1px solid #ddd' }}>Role</th>
                    <th style={{ textAlign: 'left', padding: '1rem', borderBottom: '1px solid #ddd' }}>Assigned Call Number</th>
                    <th style={{ textAlign: 'left', padding: '1rem', borderBottom: '1px solid #ddd' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td style={{ padding: '1rem', borderBottom: '1px solid #ddd' }}>
                        {user.firstName} {user.lastName}
                      </td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid #ddd' }}>
                        {user.email}
                      </td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid #ddd' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          backgroundColor: user.role === 'admin' ? '#4a69bd' : '#78e08f',
                          color: 'white'
                        }}>
                          {user.role}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid #ddd' }}>
                        {user.assignedCallNumber || '-'}
                      </td>
                      <td style={{ padding: '1rem', borderBottom: '1px solid #ddd' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => router.push(`/admin/users/${user.id}`)}
                            style={{
                              backgroundColor: '#4a69bd',
                              color: 'white',
                              padding: '0.25rem 0.5rem',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '0.8rem',
                              cursor: 'pointer'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            style={{
                              backgroundColor: '#e74c3c',
                              color: 'white',
                              padding: '0.25rem 0.5rem',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '0.8rem',
                              cursor: 'pointer'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {users.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ padding: '1rem', textAlign: 'center' }}>
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  )
}