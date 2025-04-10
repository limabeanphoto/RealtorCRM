import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import theme from '../styles/theme';
import Button from '../components/common/Button';
import Greeting from '../components/dashboard/Greeting';
import Card from '../components/common/Card';
import StatsCard from '../components/dashboard/StatsCard';
import GoalTracker from '../components/dashboard/GoalTracker';
import Spinner from '../components/common/Spinner';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import Layout from '../components/Layout';

export default function Home() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState({
    contactCount: 0,
    callCount: 0,
    dealCount: 0,
    upcomingTasks: [],
    recentCalls: [],
    callOutcomes: [],
    weeklyActivity: {
      calls: [],
      contacts: []
    },
    loading: true
  });
  
  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token) {
      // Redirect to login if not authenticated
      router.push('/login');
      return;
    }
    
    // Redirect based on role
    if (user.role === 'admin') {
      router.push('/admin/dashboard');
      return;
    }
    
    // Continue loading the dashboard for members
    async function fetchDashboardData() {
      try {
        const token = localStorage.getItem('token');
        
        // Fetch contacts count
        const contactsResponse = await fetch('/api/contacts', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const contactsData = await contactsResponse.json();
        const contactCount = contactsData.success ? contactsData.data.length : 0;
        
        // Fetch calls count and recent calls
        const callsResponse = await fetch('/api/calls', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const callsData = await callsResponse.json();
        const callCount = callsData.success ? callsData.data.length : 0;
        const recentCalls = callsData.success ? callsData.data.slice(0, 5) : [];
        
        // Calculate deals count (calls with 'Deal Closed' or 'Interested' outcome)
        const dealCount = callsData.success 
          ? callsData.data.filter(call => 
              ['Deal Closed', 'Interested'].includes(call.outcome)
            ).length 
          : 0;
        
        // Fetch upcoming tasks
        const tasksResponse = await fetch('/api/tasks', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const tasksData = await tasksResponse.json();
        const allTasks = tasksData.success ? tasksData.data : [];
        
        // Filter for incomplete tasks and sort by due date
        const upcomingTasks = allTasks
          .filter(task => task.status !== 'Completed')
          .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
          .slice(0, 5);
        
        // Get call outcomes distribution
        const callOutcomes = callsData.success ? getCallOutcomesDistribution(callsData.data) : [];
        
        // Get weekly activity data
        const weeklyActivity = callsData.success
          ? {
              calls: getWeeklyActivity(callsData.data, 'date'),
              contacts: getWeeklyActivity(contactsData.data, 'createdAt')
            }
          : { calls: [], contacts: [] };
        
        setDashboardData({
          contactCount,
          callCount,
          dealCount,
          upcomingTasks,
          recentCalls,
          callOutcomes,
          weeklyActivity,
          loading: false
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setDashboardData(prev => ({ ...prev, loading: false }));
      }
    }
    
    fetchDashboardData();
  }, [router]);
  
  // Get call outcomes distribution
  const getCallOutcomesDistribution = (calls) => {
    const outcomes = {};
    
    calls.forEach(call => {
      if (!outcomes[call.outcome]) {
        outcomes[call.outcome] = 0;
      }
      outcomes[call.outcome]++;
    });
    
    return Object.keys(outcomes).map(key => ({
      name: key,
      value: outcomes[key]
    }));
  };
  
  // Get weekly activity data
  const getWeeklyActivity = (data, dateField) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekActivity = Array(7).fill(0).map((_, i) => ({
      name: days[i],
      count: 0
    }));
    
    // Only count activity from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    data.forEach(item => {
      const date = new Date(item[dateField]);
      
      if (date >= thirtyDaysAgo) {
        const dayOfWeek = date.getDay();
        weekActivity[dayOfWeek].count++;
      }
    });
    
    return weekActivity;
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Get color based on call outcome
  const getOutcomeStyle = (outcome) => {
    const styles = {
      'Interested': { backgroundColor: theme.colors.brand.secondary, color: 'white' },
      'Not Interested': { backgroundColor: '#e74c3c', color: 'white' },
      'Follow Up': { backgroundColor: theme.colors.brand.highlight, color: theme.colors.brand.text },
      'No Answer': { backgroundColor: '#e2e3e5', color: '#383d41' },
      'Left Message': { backgroundColor: theme.colors.brand.accent, color: 'white' },
      'Wrong Number': { backgroundColor: '#f8d7da', color: '#721c24' },
      'Deal Closed': { backgroundColor: theme.colors.brand.primary, color: 'white' }
    };
    
    return styles[outcome] || { backgroundColor: '#e2e3e5', color: '#383d41' };
  };
  
  // Get color based on task priority
  const getPriorityStyle = (priority) => {
    const styles = {
      'High': { backgroundColor: '#f8d7da', color: '#721c24' },
      'Medium': { backgroundColor: theme.colors.brand.highlight, color: theme.colors.brand.text },
      'Low': { backgroundColor: theme.colors.brand.secondary, color: 'white' }
    };
    
    return styles[priority] || {};
  };
  
  // Calculate time remaining
  const getTimeRemaining = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due - now;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffTime < 0) {
      return { text: 'Overdue', style: { color: '#dc3545' } };
    } else if (diffDays === 0 && diffHours < 3) {
      return { text: 'Due soon', style: { color: '#dc3545' } };
    } else if (diffDays === 0) {
      return { text: 'Today', style: { color: '#ffc107' } };
    } else if (diffDays === 1) {
      return { text: 'Tomorrow', style: { color: theme.colors.brand.accent } };
    } else {
      return { text: `${diffDays} days`, style: { color: theme.colors.brand.text } };
    }
  };
  
  // COLORS for charts
  const COLORS = [
    theme.colors.brand.primary,
    theme.colors.brand.secondary,
    theme.colors.brand.accent,
    theme.colors.brand.highlight,
    '#e74c3c',
    '#3498db'
  ];
  
  const { loading, contactCount, callCount, dealCount, upcomingTasks, recentCalls, callOutcomes, weeklyActivity } = dashboardData;
  
  // Calculate conversion rate
  const conversionRate = callCount > 0 ? Math.round((dealCount / callCount) * 100) : 0;
  
  // Show loading during authentication check
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <p>Loading...</p>
      </div>
    );
  }
  
  return (
    <ProtectedRoute>
      <Layout>
        <div className="page-transition">
          <Greeting />
          
          <div>
            {/* Call Goal Tracker */}
            <div style={{ marginBottom: '2rem' }}>
              <GoalTracker current={callCount > 10 ? 10 : callCount} target={10} />
            </div>
            
            {/* Stats Summary */}
            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              flexWrap: 'wrap',
              marginBottom: '2rem'
            }}>
              <StatsCard
                title="Contacts"
                value={contactCount}
                iconType="contacts"
                color={theme.colors.brand.accent}
                link="/contacts"
                linkText="View all contacts"
              />
              
              <StatsCard
                title="Calls"
                value={callCount}
                iconType="calls"
                color={theme.colors.brand.primary}
                link="/calls"
                linkText="View all calls"
              />
              
              <StatsCard
                title="Conversion Rate"
                value={`${conversionRate}%`}
                iconType="conversion"
                color={theme.colors.brand.secondary}
                link="/stats"
                linkText="View analytics"
              />
              
              <StatsCard
                title="Open Tasks"
                value={upcomingTasks.length}
                iconType="tasks"
                color={theme.colors.brand.highlight}
                link="/tasks"
                linkText="View all tasks"
              />
            </div>
            
            {/* Charts Section */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0, color: theme.colors.brand.primary }}>Performance Metrics</h2>
                <Link href="/stats">
                  <Button variant="accent">View Detailed Analytics</Button>
                </Link>
              </div>
              
              <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                {/* Weekly Activity Chart */}
                <Card 
                  title="Weekly Activity" 
                  accentColor={theme.colors.brand.primary}
                  style={{ flex: 1, minWidth: '300px' }}
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={weeklyActivity.calls} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="Calls" fill={theme.colors.brand.primary} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
                
                {/* Call Outcomes Chart */}
                <Card 
                  title="Call Outcomes" 
                  accentColor={theme.colors.brand.primary}
                  style={{ flex: 1, minWidth: '300px' }}
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={callOutcomes}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {callOutcomes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value} calls`, name]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
              {/* Upcoming Tasks */}
              <div style={{ flex: '1', minWidth: '300px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h2 style={{ margin: 0, color: theme.colors.brand.primary }}>Upcoming Tasks</h2>
                  <Link href="/tasks">
                    <Button variant="outline" size="small">View all</Button>
                  </Link>
                </div>
                
                {upcomingTasks.length > 0 ? (
                  <div>
                    {upcomingTasks.map(task => {
                      const timeRemaining = getTimeRemaining(task.dueDate);
                      
                      return (
                        <Card
                          key={task.id}
                          style={{ marginBottom: '1rem' }}
                          onClick={() => router.push(`/tasks?id=${task.id}`)}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1rem', color: theme.colors.brand.primary }}>{task.title}</h3>
                            <span style={{ 
                              display: 'inline-block',
                              padding: '0.2rem 0.5rem',
                              borderRadius: theme.borderRadius.sm,
                              fontSize: '0.7rem',
                              ...getPriorityStyle(task.priority)
                            }}>
                              {task.priority}
                            </span>
                          </div>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: theme.colors.brand.text }}>
                            <div>
                              {task.contact && `For: ${task.contact.name}`}
                            </div>
                            <div style={{ ...timeRemaining.style }}>
                              Due: {timeRemaining.text}
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <Card>
                    <p style={{ textAlign: 'center', color: theme.colors.brand.text }}>No upcoming tasks.</p>
                  </Card>
                )}
              </div>
              
              {/* Recent Calls */}
              <div style={{ flex: '1', minWidth: '300px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h2 style={{ margin: 0, color: theme.colors.brand.primary }}>Recent Calls</h2>
                  <Link href="/calls">
                    <Button variant="outline" size="small">View all</Button>
                  </Link>
                </div>
                
                {recentCalls.length > 0 ? (
                  <div>
                    {recentCalls.map(call => (
                      <Card
                        key={call.id}
                        style={{ marginBottom: '1rem' }}
                        onClick={() => router.push(`/calls?id=${call.id}`)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <h3 style={{ margin: 0, fontSize: '1rem', color: theme.colors.brand.primary }}>{call.contact.name}</h3>
                          <span style={{ 
                            display: 'inline-block',
                            padding: '0.2rem 0.5rem',
                            borderRadius: theme.borderRadius.sm,
                            fontSize: '0.7rem',
                            ...getOutcomeStyle(call.outcome)
                          }}>
                            {call.outcome}
                          </span>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: theme.colors.brand.text }}>
                          <div>
                            {call.duration} minutes
                          </div>
                          <div>
                            {formatDate(call.date)}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <p style={{ textAlign: 'center', color: theme.colors.brand.text }}>No recent calls.</p>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}