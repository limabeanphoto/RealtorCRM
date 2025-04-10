// pages/admin/dashboard.js
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import ProtectedRoute from '../../components/auth/ProtectedRoute'

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [teamMetrics, setTeamMetrics] = useState({
    totalCalls: 0,
    totalDeals: 0,
    openContacts: 0,
    assignedContacts: 0,
    teamMembers: []
  })
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // Get user data from localStorage
    const userData = JSON.parse(localStorage.getItem('user') || '{}')
    setUser(userData)
    
    // Fetch dashboard data
    const fetchAdminDashboardData = async () => {
      try {
        const token = localStorage.getItem('token')
        
        // Fetch team calls (weekly)
        const callsResponse = await fetch('/api/stats/metrics?startDate=week&endDate=today', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const callsData = await callsResponse.json()
        
        // Fetch open contacts count
        const openContactsResponse = await fetch('/api/contacts?status=Open', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const openContactsData = await openContactsResponse.json()
        
        // Fetch assigned contacts count
        const assignedContactsResponse = await fetch('/api/contacts?status=Assigned', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const assignedContactsData = await assignedContactsResponse.json()
        
        // Fetch team members
        const usersResponse = await fetch('/api/users', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const usersData = await usersResponse.json()
        
        // Fetch performance metrics for each user
        let teamMembers = []
        if (usersData.success) {
          const members = usersData.data.filter(user => user.role === 'member')
          
          // For each member, get their metrics
          teamMembers = await Promise.all(
            members.map(async (member) => {
              // Get user's calls
              const userCallsResponse = await fetch(`/api/stats/metrics?startDate=week&endDate=today&userId=${member.id}`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              })
              const userCallsData = await userCallsResponse.json()
              
              // Get user's assigned contacts
              const userContactsResponse = await fetch(`/api/contacts?assignedTo=${member.id}`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              })
              const userContactsData = await userContactsResponse.json()
              
              return {
                ...member,
                metrics: {
                  calls: userCallsData.success ? userCallsData.callsMetrics.total : 0,
                  deals: userCallsData.success ? userCallsData.dealsMetrics.total : 0,
                  conversionRate: userCallsData.success ? userCallsData.conversionRates.rate : 0,
                  assignedContacts: userContactsData.success ? userContactsData.data.length : 0
                }
              }
            })
          )
        }
        
        // Update metrics
        setTeamMetrics({
          totalCalls: callsData.success ? callsData.callsMetrics.total : 0,
          totalDeals: callsData.success ? callsData.dealsMetrics.total : 0,
          openContacts: openContactsData.success ? openContactsData.data.length : 0,
          assignedContacts: assignedContactsData.success ? assignedContactsData.data.length : 0,
          teamMembers
        })
        
        setLoading(false)
      } catch (error) {
        console.error('Error fetching admin dashboard data:', error)
        setLoading(false)
      }
    }
    
    fetchAdminDashboardData()
  }, [])
  
  const handleLogout = () => {
    // Clear localStorage and redirect to login
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }
  
  return (
    <ProtectedRoute adminOnly={true}>
      <Layout>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h1>Admin Dashboard</h1>
            <div>
              <span style={{ marginRight: '1rem' }}>
                Welcome, {user?.firstName} {user?.lastName}
              </span>
              <button
                onClick={handleLogout}
                style={{
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Logout
              </button>
            </div>
          </div>
          
          {loading ? (
            <p>Loading dashboard data...</p>
          ) : (
            <>
              {/* Team Metrics Overview Cards */}
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '1rem', 
                marginBottom: '2rem'
              }}>
                <div style={{ 
                  flex: '1', 
                  minWidth: '200px',
                  padding: '1.5rem',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                  textAlign: 'center'
                }}>
                  <h3>Weekly Team Calls</h3>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0' }}>
                    {teamMetrics.totalCalls}
                  </p>
                </div>
                
                <div style={{ 
                  flex: '1', 
                  minWidth: '200px',
                  padding: '1.5rem',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                  textAlign: 'center'
                }}>
                  <h3>Weekly Team Deals</h3>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0' }}>
                    {teamMetrics.totalDeals}
                  </p>
                </div>
                
                <div style={{ 
                  flex: '1', 
                  minWidth: '200px',
                  padding: '1.5rem',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                  textAlign: 'center'
                }}>
                  <h3>Team Conversion Rate</h3>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0' }}>
                    {teamMetrics.totalCalls > 0 ? Math.round((teamMetrics.totalDeals / teamMetrics.totalCalls) * 100) : 0}%
                  </p>
                </div>
              </div>
              
              {/* Contact Pool Management */}
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '1rem', 
                marginBottom: '2rem'
              }}>
                <div style={{ 
                  flex: '1',
                  padding: '1.5rem',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
                }}>
                  <h2>Open Contacts</h2>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                    {teamMetrics.openContacts} contacts available
                  </p>
                  <button
                    onClick={() => router.push('/admin/contacts?status=Open')}
                    style={{
                      backgroundColor: '#4a69bd',
                      color: 'white',
                      padding: '0.5rem 1rem',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      marginTop: '1rem'
                    }}
                  >
                    Manage Open Contacts
                  </button>
                </div>
                
                <div style={{ 
                  flex: '1',
                  padding: '1.5rem',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
                }}>
                  <h2>Assigned Contacts</h2>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                    {teamMetrics.assignedContacts} contacts assigned
                  </p>
                  <button
                    onClick={() => router.push('/admin/contacts?status=Assigned')}
                    style={{
                      backgroundColor: '#4a69bd',
                      color: 'white',
                      padding: '0.5rem 1rem',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      marginTop: '1rem'
                    }}
                  >
                    Manage Assigned Contacts
                  </button>
                </div>
              </div>
              
              {/* Team Member Performance */}
              <div style={{
                padding: '1.5rem',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                marginBottom: '2rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h2>Team Performance</h2>
                  <button
                    onClick={() => router.push('/admin/users')}
                    style={{
                      backgroundColor: '#4a69bd',
                      color: 'white',
                      padding: '0.5rem 1rem',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Manage Users
                  </button>
                </div>
                
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #ddd' }}>Name</th>
                      <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #ddd' }}>Weekly Calls</th>
                      <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #ddd' }}>Weekly Deals</th>
                      <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #ddd' }}>Conversion Rate</th>
                      <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #ddd' }}>Assigned Contacts</th>
                      <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #ddd' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamMetrics.teamMembers.map((member) => (
                      <tr key={member.id}>
                        <td style={{ padding: '0.5rem', borderBottom: '1px solid #ddd' }}>
                          {member.firstName} {member.lastName}
                        </td>
                        <td style={{ padding: '0.5rem', borderBottom: '1px solid #ddd' }}>
                          {member.metrics.calls}
                        </td>
                        <td style={{ padding: '0.5rem', borderBottom: '1px solid #ddd' }}>
                          {member.metrics.deals}
                        </td>
                        <td style={{ padding: '0.5rem', borderBottom: '1px solid #ddd' }}>
                          {member.metrics.conversionRate}%
                        </td>
                        <td style={{ padding: '0.5rem', borderBottom: '1px solid #ddd' }}>
                          {member.metrics.assignedContacts}
                        </td>
                        <td style={{ padding: '0.5rem', borderBottom: '1px solid #ddd' }}>
                          <button
                            onClick={() => router.push(`/admin/users/${member.id}`)}
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
                            View Profile
                          </button>
                        </td>
                      </tr>
                    ))}
                    
                    {teamMetrics.teamMembers.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ padding: '1rem', textAlign: 'center' }}>
                          No team members found. 
                          <button
                            onClick={() => router.push('/admin/users/new')}
                            style={{
                              backgroundColor: '#4a69bd',
                              color: 'white',
                              padding: '0.25rem 0.5rem',
                              border: 'none',
                              borderRadius: '4px',
                              marginLeft: '0.5rem',
                              cursor: 'pointer'
                            }}
                          >
                            Add User
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Quick Links */}
              <div style={{
                padding: '1.5rem',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
              }}>
                <h2>Admin Actions</h2>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => router.push('/admin/users/new')}
                    style={{
                      backgroundColor: '#4a69bd',
                      color: 'white',
                      padding: '0.75rem 1.5rem',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Add New User
                  </button>
                  
                  <button
                    onClick={() => router.push('/admin/contacts/import')}
                    style={{
                      backgroundColor: '#4a69bd',
                      color: 'white',
                      padding: '0.75rem 1.5rem',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Import Contacts
                  </button>
                  
                  <button
                    onClick={() => router.push('/admin/contacts/assign')}
                    style={{
                      backgroundColor: '#4a69bd',
                      color: 'white',
                      padding: '0.75rem 1.5rem',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Assign Contacts
                  </button>
                  
                  <button
                    onClick={() => router.push('/stats')}
                    style={{
                      backgroundColor: '#4a69bd',
                      color: 'white',
                      padding: '0.75rem 1.5rem',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Team Analytics
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  )
}