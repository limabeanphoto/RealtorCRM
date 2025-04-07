import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Home() {
  const [dashboardData, setDashboardData] = useState({
    contactCount: 0,
    callCount: 0,
    upcomingTasks: [],
    recentCalls: [],
    loading: true
  })
  
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Fetch contacts count
        const contactsResponse = await fetch('/api/contacts')
        const contactsData = await contactsResponse.json()
        const contactCount = contactsData.success ? contactsData.data.length : 0
        
        // Fetch calls count and recent calls
        const callsResponse = await fetch('/api/calls')
        const callsData = await callsResponse.json()
        const callCount = callsData.success ? callsData.data.length : 0
        const recentCalls = callsData.success ? callsData.data.slice(0, 5) : []
        
        // Fetch upcoming tasks
        const tasksResponse = await fetch('/api/tasks')
        const tasksData = await tasksResponse.json()
        const allTasks = tasksData.success ? tasksData.data : []
        
        // Filter for incomplete tasks and sort by due date
        const upcomingTasks = allTasks
          .filter(task => task.status !== 'Completed')
          .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
          .slice(0, 5)
        
        setDashboardData({
          contactCount,
          callCount,
          upcomingTasks,
          recentCalls,
          loading: false
        })
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        setDashboardData(prev => ({ ...prev, loading: false }))
      }
    }
    
    fetchDashboardData()
  }, [])
  
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
  
  // Get color based on call outcome
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
  
  // Get color based on task priority
  const getPriorityStyle = (priority) => {
    const styles = {
      'High': { backgroundColor: '#f8d7da', color: '#721c24' },
      'Medium': { backgroundColor: '#fff3cd', color: '#856404' },
      'Low': { backgroundColor: '#d1ecf1', color: '#0c5460' }
    }
    
    return styles[priority] || {}
  }
  
  // Calculate time remaining
  const getTimeRemaining = (dueDate) => {
    const now = new Date()
    const due = new Date(dueDate)
    const diffTime = due - now
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (diffTime < 0) {
      return { text: 'Overdue', style: { color: '#dc3545' } }
    } else if (diffDays === 0 && diffHours < 3) {
      return { text: 'Due soon', style: { color: '#dc3545' } }
    } else if (diffDays === 0) {
      return { text: 'Today', style: { color: '#ffc107' } }
    } else if (diffDays === 1) {
      return { text: 'Tomorrow', style: { color: '#17a2b8' } }
    } else {
      return { text: `${diffDays} days`, style: { color: '#6c757d' } }
    }
  }
  
  const { loading, contactCount, callCount, upcomingTasks, recentCalls } = dashboardData
  
  return (
    <div>
      <h1>Realtor CRM - Dashboard</h1>
      
      {loading ? (
        <p>Loading dashboard data...</p>
      ) : (
        <div>
          {/* Stats Summary */}
          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            flexWrap: 'wrap',
            marginBottom: '2rem'
          }}>
            <div style={{ 
              flex: '1',
              minWidth: '200px',
              padding: '1.5rem',
              borderRadius: '8px',
              backgroundColor: '#e3f2fd',
              textAlign: 'center'
            }}>
              <h3 style={{ marginTop: 0 }}>Contacts</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0' }}>{contactCount}</p>
              <Link href="/contacts" style={{ color: '#0d6efd', textDecoration: 'none' }}>
                View all contacts
              </Link>
            </div>
            
            <div style={{ 
              flex: '1',
              minWidth: '200px',
              padding: '1.5rem',
              borderRadius: '8px',
              backgroundColor: '#e8f5e9',
              textAlign: 'center'
            }}>
              <h3 style={{ marginTop: 0 }}>Calls</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0' }}>{callCount}</p>
              <Link href="/calls" style={{ color: '#388e3c', textDecoration: 'none' }}>
                View all calls
              </Link>
            </div>
            
            <div style={{ 
              flex: '1',
              minWidth: '200px',
              padding: '1.5rem',
              borderRadius: '8px',
              backgroundColor: '#fff8e1',
              textAlign: 'center'
            }}>
              <h3 style={{ marginTop: 0 }}>Open Tasks</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0' }}>{upcomingTasks.length}</p>
              <Link href="/tasks" style={{ color: '#ff8f00', textDecoration: 'none' }}>
                View all tasks
              </Link>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            {/* Upcoming Tasks */}
            <div style={{ flex: '1', minWidth: '300px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0 }}>Upcoming Tasks</h2>
                <Link href="/tasks" style={{ textDecoration: 'none' }}>
                  View all
                </Link>
              </div>
              
              {upcomingTasks.length > 0 ? (
                <div>
                  {upcomingTasks.map(task => {
                    const timeRemaining = getTimeRemaining(task.dueDate)
                    
                    return (
                      <div 
                        key={task.id}
                        style={{
                          padding: '1rem',
                          marginBottom: '1rem',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          backgroundColor: 'white'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <h3 style={{ margin: 0, fontSize: '1rem' }}>{task.title}</h3>
                          <span style={{ 
                            display: 'inline-block',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            ...getPriorityStyle(task.priority)
                          }}>
                            {task.priority}
                          </span>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#4a5568' }}>
                          <div>
                            {task.contact && `For: ${task.contact.name}`}
                          </div>
                          <div style={{ ...timeRemaining.style }}>
                            Due: {timeRemaining.text}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p>No upcoming tasks.</p>
              )}
            </div>
            
            {/* Recent Calls */}
            <div style={{ flex: '1', minWidth: '300px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0 }}>Recent Calls</h2>
                <Link href="/calls" style={{ textDecoration: 'none' }}>
                  View all
                </Link>
              </div>
              
              {recentCalls.length > 0 ? (
                <div>
                  {recentCalls.map(call => (
                    <div 
                      key={call.id}
                      style={{
                        padding: '1rem',
                        marginBottom: '1rem',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        backgroundColor: 'white'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1rem' }}>{call.contact.name}</h3>
                        <span style={{ 
                          display: 'inline-block',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          ...getOutcomeStyle(call.outcome)
                        }}>
                          {call.outcome}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#4a5568' }}>
                        <div>
                          {call.duration} minutes
                        </div>
                        <div>
                          {formatDate(call.date)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No recent calls.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}