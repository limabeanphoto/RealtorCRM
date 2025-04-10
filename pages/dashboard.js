// pages/dashboard.js
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import ProtectedRoute from '../components/auth/ProtectedRoute'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [metrics, setMetrics] = useState({
    callsToday: 0,
    tasksToday: 0,
    conversionRate: 0,
    openContacts: 0,
    myContacts: 0
  })
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // Get user data from localStorage
    const userData = JSON.parse(localStorage.getItem('user') || '{}')
    setUser(userData)
    
    // Fetch dashboard data
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token')
        
        // Fetch today's calls
        const callsResponse = await fetch('/api/stats/metrics?startDate=today&endDate=today', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const callsData = await callsResponse.json()
        
        // Fetch today's tasks
        const tasksResponse = await fetch('/api/tasks?dueDate=today', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const tasksData = await tasksResponse.json()
        
        // Fetch open contacts count
        const openContactsResponse = await fetch('/api/contacts?status=Open', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const openContactsData = await openContactsResponse.json()
        
        // Fetch assigned contacts count
        const myContactsResponse = await fetch(`/api/contacts?assignedTo=${userData.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const myContactsData = await myContactsResponse.json()
        
        // Update metrics
        setMetrics({
          callsToday: callsData.success ? callsData.callsMetrics.total : 0,
          tasksToday: tasksData.success ? tasksData.data.length : 0,
          conversionRate: callsData.success ? callsData.conversionRates.rate : 0,
          openContacts: openContactsData.success ? openContactsData.data.length : 0,
          myContacts: myContactsData.success ? myContactsData.data.length : 0
        })
        
        setLoading(false)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        setLoading(false)
      }
    }
    
    fetchDashboardData()
  }, [])
  
  const handleLogout = () => {
    // Clear localStorage and redirect to login
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }
  
  return (
    <ProtectedRoute>
      <Layout>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h1>Dashboard</h1>
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
              {/* Metrics Overview Cards */}
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
                  <h3>Today's Calls</h3>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0' }}>
                    {metrics.callsToday}
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
                  <h3>Tasks Due Today</h3>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0' }}>
                    {metrics.tasksToday}
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
                  <h3>Conversion Rate</h3>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0' }}>
                    {metrics.conversionRate}%
                  </p>
                </div>
              </div>
              
              {/* Contact Status Cards */}
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
                    {metrics.openContacts} contacts available
                  </p>
                  <button
                    onClick={() => router.push('/contacts?status=Open')}
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
                    View Open Contacts
                  </button>
                </div>
                
                <div style={{ 
                  flex: '1',
                  padding: '1.5rem',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
                }}>
                  <h2>My Contacts</h2>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                    {metrics.myContacts} contacts assigned
                  </p>
                  <button
                    onClick={() => router.push(`/contacts?assignedTo=${user?.id}`)}
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
                    View My Contacts
                  </button>
                </div>
              </div>
              
              {/* Quick Links */}
              <div style={{
                padding: '1.5rem',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
              }}>
                <h2>Quick Actions</h2>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => router.push('/calls/new')}
                    style={{
                      backgroundColor: '#4a69bd',
                      color: 'white',
                      padding: '0.75rem 1.5rem',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Log New Call
                  </button>
                  
                  <button
                    onClick={() => router.push('/tasks/new')}
                    style={{
                      backgroundColor: '#4a69bd',
                      color: 'white',
                      padding: '0.75rem 1.5rem',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Create Task
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
                    View My Stats
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