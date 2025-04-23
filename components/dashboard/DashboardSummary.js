// Modified components/dashboard/DashboardSummary.js with fixes for goal metrics
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import StatCard from './StatCard';
import GoalProgress from './GoalProgress';
import ActionPanel from './ActionPanel';
import theme from '../../styles/theme';

export default function DashboardSummary() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [metrics, setMetrics] = useState({
    callsToday: 0,
    callsThisMonth: 0,
    callsThisYear: 0,
    dealsToday: 0, // Added to track deals today
    loading: true
  });
  const [goals, setGoals] = useState({
    callGoal: { current: 0, target: 10 },
    dealGoal: { current: 0, target: 5 },
    loading: true
  });
  const [tasks, setTasks] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  
  // Load user data and check if admin
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
    
    // Fetch all data in parallel
    Promise.all([
      fetchMetricsData(),
      fetchTasksData(),
      fetchFollowUpsData()
    ]).then(() => {
      setDataLoading(false);
    }).catch(error => {
      console.error('Error loading dashboard data:', error);
      setDataLoading(false);
    });
  }, []);
  
  // Effect to update goals when metrics change
  useEffect(() => {
    if (!metrics.loading) {
      updateGoalsData();
    }
  }, [metrics]);
  
  const fetchMetricsData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No authentication token found');
        return;
      }
      
      // Get today's date range
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(new Date().setHours(23, 59, 59, 999)).toISOString();
      
      // Get month's date range
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
      const endOfMonth = new Date(new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999)).toISOString();
      
      // Get year's date range
      const startOfYear = new Date(today.getFullYear(), 0, 1).toISOString();
      const endOfYear = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999).toISOString();
      
      // Fetch calls for today
      const todayResponse = await fetch(`/api/stats/metrics?startDate=${encodeURIComponent(startOfDay)}&endDate=${encodeURIComponent(endOfDay)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Fetch calls for this month
      const monthResponse = await fetch(`/api/stats/metrics?startDate=${encodeURIComponent(startOfMonth)}&endDate=${encodeURIComponent(endOfMonth)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Fetch calls for this year
      const yearResponse = await fetch(`/api/stats/metrics?startDate=${encodeURIComponent(startOfYear)}&endDate=${encodeURIComponent(endOfYear)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const todayData = await todayResponse.json();
      const monthData = await monthResponse.json();
      const yearData = await yearResponse.json();
      
      if (todayData.success && monthData.success && yearData.success) {
        setMetrics({
          callsToday: todayData.callsMetrics.total || 0,
          callsThisMonth: monthData.callsMetrics.total || 0,
          callsThisYear: yearData.callsMetrics.total || 0,
          dealsToday: todayData.dealsMetrics.total || 0, // Store deals today
          loading: false,
          conversionRate: todayData.conversionRates?.rate || 0
        });
      } else {
        console.error('Error fetching metrics');
        setMetrics(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Error fetching metrics data:', error);
      setMetrics(prev => ({ ...prev, loading: false }));
    }
  };
  
  // Update goals based on metrics
  const updateGoalsData = () => {
    // Update goals with the current metrics
    setGoals({
      callGoal: { 
        current: metrics.callsToday || 0, 
        target: 10 
      },
      dealGoal: { 
        current: metrics.dealsToday || 0, 
        target: 5 
      },
      loading: false
    });
  };
  
  const fetchTasksData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No authentication token found');
        return;
      }
      
      // Get today's date
      const today = new Date();
      
      // Fetch tasks due today or overdue and not yet completed
      const response = await fetch('/api/tasks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Filter for incomplete tasks that are due today or overdue
        const now = new Date();
        
        const filteredTasks = data.data
          .filter(task => {
            // Check if task is not completed
            if (task.status === 'Completed') return false;
            
            // Parse task due date
            const dueDate = new Date(task.dueDate);
            
            // Check if due date is today or in the past
            return dueDate <= now;
          })
          .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
          .slice(0, 3); // Get only top 3 most urgent tasks
        
        setTasks(filteredTasks);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };
  
  const fetchFollowUpsData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No authentication token found');
        return;
      }
      
      // Fetch contacts with Follow Up status
      const response = await fetch('/api/contacts?lastCallOutcome=Follow%20Up', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Get only top 3 follow-up contacts
        setFollowUps(data.data.slice(0, 3));
      }
    } catch (error) {
      console.error('Error fetching follow-ups:', error);
    }
  };
  
  // Function to manually refresh metrics and goals
  // This can be called after logging a call or deal
  const refreshMetrics = () => {
    fetchMetricsData();
  };
  
  if (dataLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading dashboard data...</p>
      </div>
    );
  }
  
  const isAdmin = user && user.role === 'admin';

  return (
    <div className="dashboard-container">
      {/* Welcome Message */}
      <div className="dashboard-card welcome-card">
        <h1>
          {getGreeting()}, {user?.firstName || 'Team'}!
        </h1>
        <p>Welcome to your Realtor CRM dashboard. Here's your activity for today.</p>
      </div>
      
      {/* Stats Section */}
      <div className="dashboard-grid">
        <StatCard
          title="Calls Today"
          value={metrics.callsToday}
          icon="phone"
          color={theme.colors.brand.primary}
        />
        <StatCard
          title="Calls This Month"
          value={metrics.callsThisMonth}
          icon="calendar"
          color={theme.colors.brand.secondary}
        />
        <StatCard
          title="Calls This Year"
          value={metrics.callsThisYear}
          icon="chart"
          color={theme.colors.brand.accent}
        />
      </div>
      
      {/* Goals Section */}
      <div className="dashboard-grid">
        <GoalProgress
          title="Daily Call Goal"
          current={goals.callGoal.current}
          target={goals.callGoal.target}
          color={theme.colors.brand.primary}
        />
        <GoalProgress
          title="Deal Conversion Goal"
          current={goals.dealGoal.current}
          target={goals.dealGoal.target}
          color={theme.colors.brand.secondary}
        />
      </div>
      
      {/* Activity Panels */}
      <div className="dashboard-grid">
        <ActionPanel
          type="tasks"
          title="Tasks Due"
          items={tasks}
          viewAllLink="/tasks"
          color={theme.colors.brand.primary}
        />
        <ActionPanel
          type="contacts"
          title="Follow Up Contacts"
          items={followUps}
          viewAllLink="/contacts?filter=followUp"
          color={theme.colors.brand.secondary}
        />
      </div>
      
      {/* Admin Section */}
      {isAdmin && (
      <div className="dashboard-card admin-actions">
        <h2>Admin Actions</h2>
        <div className="admin-buttons">
          <button 
            className="admin-button" 
            onClick={() => router.push('/admin/users')}
          >
            Manage Users
          </button>
          <button 
            className="admin-button" 
            onClick={() => router.push('/admin/contacts/assign')}
          >
            Assign Contacts
          </button>
          <button 
            className="admin-button" 
            onClick={() => router.push('/admin/contacts/import')}
          >
            Import Contacts
          </button>
          <button 
          className="admin-button" 
          onClick={() => router.push('/admin/team-analytics')}
          style={{ 
            backgroundColor: theme.colors.brand.accent,
            color: 'white' 
          }}
          >
            Team Analytics
          </button> 
        </div>
      </div>
      )}
    </div>
  );
}

// Helper function to generate appropriate greeting based on time of day
function getGreeting() {
  const hour = new Date().getHours();
  
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}