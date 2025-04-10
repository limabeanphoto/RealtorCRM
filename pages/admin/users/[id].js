// pages/admin/users/[id].js
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../../components/Layout'
import ProtectedRoute from '../../../components/auth/ProtectedRoute'

export default function EditUser() {
  const router = useRouter()
  const { id } = router.query
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    cellPhone: '',
    assignedCallNumber: '',
    role: ''
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saveLoading, setSaveLoading] = useState(false)
  
  useEffect(() => {
    // Fetch user data
    const fetchUser = async () => {
      if (!id) return
      
      try {
        const token = localStorage.getItem('token')
        
        const response = await fetch(`/api/users/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        const data = await response.json()
        
        if (data.success) {
          setFormData({
            email: data.data.email || '',
            password: '', // Don't populate password
            firstName: data.data.firstName || '',
            lastName: data.data.lastName || '',
            cellPhone: data.data.cellPhone || '',
            assignedCallNumber: data.data.assignedCallNumber || '',
            role: data.data.role || 'member'
          })
        } else {
          setError(data.message || 'Error fetching user data')
        }
        
        setLoading(false)
      } catch (error) {
        console.error('Error fetching user:', error)
        setError('An error occurred while fetching user data')
        setLoading(false)
      }
    }
    
    fetchUser()
  }, [id])
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaveLoading(true)
    setError('')
    
    try {
      const token = localStorage.getItem('token')
      
      // Create update data object (exclude empty password)
      const updateData = { ...formData }
      if (!updateData.password) {
        delete updateData.password
      }
      
      const response = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Redirect to user management page
        router.push('/admin/users')
      } else {
        setError(data.message || 'Error updating user')
      }
    } catch (error) {
      console.error('Error updating user:', error)
      setError('An error occurred while updating the user')
    } finally {
      setSaveLoading(false)
    }
  }
  
  return (
    <ProtectedRoute adminOnly={true}>
      <Layout>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h1>Edit User</h1>
            <button
              onClick={() => router.push('/admin/users')}
              style={{
                backgroundColor: '#6c757d',
                color: 'white',
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Back to Users
            </button>
          </div>
          
          {loading ? (
            <p>Loading user data...</p>
          ) : (
            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.12)', padding: '2rem' }}>
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
              
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                      First Name*
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                      Last Name*
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                  </div>
                </div>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                    Email* (used for login)
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ddd' }}
                  />
                </div>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                    Password (leave blank to keep current password)
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ddd' }}
                  />
                  <small style={{ color: '#6c757d', display: 'block', marginTop: '0.25rem' }}>
                    Password must be at least 8 characters
                  </small>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                      Cell Phone
                    </label>
                    <input
                      type="tel"
                      name="cellPhone"
                      value={formData.cellPhone}
                      onChange={handleChange}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                      Assigned Call Number
                    </label>
                    <input
                      type="tel"
                      name="assignedCallNumber"
                      value={formData.assignedCallNumber}
                      onChange={handleChange}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                  </div>
                </div>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                    Role*
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ddd' }}
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                
                <div>
                  <button
                    type="submit"
                    disabled={saveLoading}
                    style={{
                      backgroundColor: '#4a69bd',
                      color: 'white',
                      padding: '0.75rem 1.5rem',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '1rem',
                      cursor: saveLoading ? 'not-allowed' : 'pointer',
                      opacity: saveLoading ? 0.7 : 1
                    }}
                  >
                    {saveLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  )
}