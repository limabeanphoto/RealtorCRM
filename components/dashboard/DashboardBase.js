// components/dashboard/DashboardBase.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AnimatedGreeting from './AnimatedGreeting';
import MetricCard from './MetricCard';
import GoalTracker from './GoalTracker';
import TasksSummary from './TasksSummary';
import FollowUpContacts from './FollowUpContacts';
import AdminActions from './AdminActions';
import TeamLeaderboard from './TeamLeaderboard';
import Spinner from '../common/Spinner';

export default function DashboardBase() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [metrics, setMetrics] = useState({
    callsToday: 0,
    callsThisMonth: 0,
    callsThisYear: 0,
    loading: true
  });
  const [goals, setGoals] = useState({
    callGoal: { current: 0, target: 10 },
    dealGoal: { current: 0, target: 5 },
    loading: true
  });
  
  // Load user data and check if admin
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
    
    // Fetch metrics data
    fetchMetricsData();
    
    // Fetch goals data
    fetchGoalsData();
  }, []);
  
  // [Fetch methods remain unchanged]
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
          loading: false
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
  
  const fetchGoalsData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No authentication token found');
        return;
      }
      
      // Fetch all goals
      const response = await fetch('/api/goals', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      
      if (data.success && data.data.length > 0) {
        // Find call and deal goals if they exist
        const callGoal = data.data.find(goal => goal.goalType === 'calls') || { targetValue: 10, current: 0 };
        const dealGoal = data.data.find(goal => goal.goalType === 'deals') || { targetValue: 5, current: 0 };
        
        // Fetch progress for each goal
        const callProgress = await fetchGoalProgress(callGoal.id);
        const dealProgress = await fetchGoalProgress(dealGoal.id);
        
        setGoals({
          callGoal: { 
            current: callProgress?.currentValue || 0, 
            target: callGoal.targetValue || 10 
          },
          dealGoal: { 
            current: dealProgress?.currentValue || 0, 
            target: dealGoal.targetValue || 5 
          },
          loading: false
        });
      } else {
        // Default goals if none found
        setGoals({
          callGoal: { current: 0, target: 10 },
          dealGoal: { current: 0, target: 5 },
          loading: false
        });
      }
    } catch (error) {
      console.error('Error fetching goals data:', error);
      setGoals(prev => ({ ...prev, loading: false }));
    }
  };
  
  const fetchGoalProgress = async (goalId) => {
    if (!goalId) return null;
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/stats/goal-progress?goalId=${goalId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      
      if (data.success) {
        return data.progress;
      } else {
        console.error('Error fetching goal progress:', data.message);
        return null;
      }
    } catch (error) {
      console.error('Error fetching goal progress:', error);
      return null;
    }
  };
  
  // Show loading state
  if (!user || metrics.loading || goals.loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '30vh' }}>
        <Spinner size="large" />
      </div>
    );
  }
  
  const isAdmin = user && user.role === 'admin';

  return (
    <div className="page-transition">
      {/* Animated Welcome Message */}
      <AnimatedGreeting firstName={user.firstName} />
      
      {/* Metrics Cards Section */}
      <div style={{ 
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        <MetricCard
          title="Calls Today"
          value={metrics.callsToday}
          icon="📞"
          color="#4a69bd"
          animationDelay={0.2}
        />
        <MetricCard
          title="Calls This Month"
          value={metrics.callsThisMonth}
          icon="📅"
          color="#60a3bc"
          animationDelay={0.4}
        />
        <MetricCard
          title="Calls This Year"
          value={metrics.callsThisYear}
          icon="📈"
          color="#78e08f"
          animationDelay={0.6}
        />
      </div>
      
      {/* Goals Section */}
      <div style={{ 
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        <GoalTracker
          title="Daily Call Goal"
          current={goals.callGoal.current}
          target={goals.callGoal.target}
          icon="calls"
          animationDelay={0.8}
        />
        <GoalTracker
          title="Deal Conversion Goal"
          current={goals.dealGoal.current}
          target={goals.dealGoal.target}
          icon="trophy"
          animationDelay={1.0}
        />
      </div>
      
      {/* Tasks and Follow-Up Contacts */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        <TasksSummary animationDelay={1.2} />
        <FollowUpContacts animationDelay={1.4} />
      </div>
      
      {/* Admin-Only Sections */}
      {isAdmin && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          marginBottom: '2rem',
        }}>
          <TeamLeaderboard animationDelay={1.6} />
          <AdminActions animationDelay={1.8} />
        </div>
      )}
      
      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}