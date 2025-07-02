import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import DateRangeSelector from '../stats/DateRangeSelector';
import Button from '../common/Button';
import Card from '../common/Card';
import Spinner from '../common/Spinner';
import { useTheme } from 'next-themes';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

const TeamAnalytics = () => {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('all');
  const [dateRange, setDateRange] = useState('month');
  const [customDateRange, setCustomDateRange] = useState({ start: null, end: null });
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true); // Start loading initially
  const [error, setError] = useState(null);
  const { theme: nextTheme } = useTheme();

  const theme = {
      colors: {
          primary: nextTheme === 'dark' ? '#60a5fa' : '#3b82f6',
          secondary: nextTheme === 'dark' ? '#4ade80' : '#22c55e',
          background: nextTheme === 'dark' ? '#1f2937' : '#f9fafb',
          cardBackground: nextTheme === 'dark' ? '#374151' : '#ffffff',
          text: nextTheme === 'dark' ? '#d1d5db' : '#111827',
          muted: nextTheme === 'dark' ? '#6b7280' : '#6b7280',
          error: nextTheme === 'dark' ? '#f87171' : '#ef4444',
          success: nextTheme === 'dark' ? '#4ade80' : '#22c55e',
      },
      borderRadius: {
          sm: '0.25rem',
          md: '0.5rem',
          lg: '0.75rem',
      },
      spacing: (factor) => `${factor * 0.5}rem`,
  };

  // Fetch Users (Add Authorization Header, handle errors, no redirect)
  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates on unmounted component
    const fetchUsers = async () => {
      setLoading(true); // Set loading for user fetch
      setError(null); // Clear previous errors
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      if (!token) {
          // Don't redirect, just set error. Page guard should handle redirect.
          if (isMounted) {
            setError("Authentication token not found. Please ensure you are logged in.");
            setLoading(false);
          }
          return;
      }

      try {
        const response = await fetch('/api/users', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) {
            let errorMsg = `Failed to fetch users: ${response.status}`;
             if (response.status === 401) {
                 errorMsg += " (Unauthorized). Please ensure you are logged in.";
             }
             // Try to get more specific error from response body
             try {
                const errorData = await response.json();
                errorMsg = `${errorData.message || errorMsg}`;
             } catch {}
          throw new Error(errorMsg);
        }
        const data = await response.json();
        try {
            const response = await fetch('/api/users', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            if (!response.ok) {
              let errorMsg = `Failed to fetch users: ${response.status}`;
               if (response.status === 401) {
                   errorMsg += " (Unauthorized). Please ensure you are logged in.";
               }
               try {
                  const errorData = await response.json();
                  errorMsg = `${errorData.message || errorMsg}`;
               } catch {}
              throw new Error(errorMsg);
            }
            const data = await response.json();
            
            // Fix the issue - properly format user objects with correct properties
            const usersArray = data.success && Array.isArray(data.data) 
              ? data.data.map(user => ({
                  id: user.id,
                  name: `${user.firstName} ${user.lastName}`
                }))
              : [];
              
            if (isMounted) {
              setUsers([{ id: 'all', name: 'All Team Members' }, ...usersArray]);
            }
          } catch (err) {
            console.error("Failed to fetch users:", err);
            if (isMounted) {
               setError(err.message);
               setLoading(false);
            }
          }
      } catch (err) {
        console.error("Failed to fetch users:", err);
        if (isMounted) {
           setError(err.message);
           setLoading(false); // Stop loading on user fetch error
        }
      }
    };

    fetchUsers();

    return () => { isMounted = false; }; // Cleanup function
  }, []); // Fetch users only once on mount

  // Fetch Team Analytics Data (Add Authorization Header, handle errors, no redirect)
    const fetchData = useCallback(async (isInitial = false) => {
        // Only set loading if it's not the initial load triggered by useEffect below
        // or if users have loaded successfully and there is no error.
        if (!isInitial || (users.length > 0 && !error)) {
            setLoading(true);
        }

        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) {
            // No token found, error should have been set by user fetch effect.
            // Ensure error state persists if it was already set.
            if (!error && typeof window !== 'undefined') {
                setError("Authentication token not found.");
            }
            setLoading(false); // Stop loading if no token
            return;
        }

        // Calculate date range based on selected range type
        let startDate, endDate;
        const now = new Date();
        
        // Calculate start and end dates based on dateRange value
        switch(dateRange) {
            case 'today':
                startDate = new Date(now);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(now);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'week':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - now.getDay()); // Start of current week (Sunday)
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(now);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'quarter':
                startDate = new Date(now);
                startDate.setMonth(Math.floor(now.getMonth() / 3) * 3, 1);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(now);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'custom':
                // For custom range, use the stored dates if available
                if (customDateRange.start && customDateRange.end) {
                    startDate = new Date(customDateRange.start);
                    endDate = new Date(customDateRange.end);
                    // Set time to beginning and end of day
                    startDate.setHours(0, 0, 0, 0);
                    endDate.setHours(23, 59, 59, 999);
                } else {
                    // Fallback to last 30 days if custom dates aren't set
                    startDate = new Date(now);
                    startDate.setDate(now.getDate() - 30);
                    startDate.setHours(0, 0, 0, 0);
                    endDate = new Date(now);
                    endDate.setHours(23, 59, 59, 999);
                }
                break;
            default:
                // Default to last 30 days
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 30);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(now);
                endDate.setHours(23, 59, 59, 999);
        }

        // Build params including calculated dates
        const params = new URLSearchParams();
        params.append('userId', selectedUserId);
        params.append('range', dateRange);
        // Always include startDate and endDate parameters
        params.append('startDate', startDate.toISOString());
        params.append('endDate', endDate.toISOString());

        try {
        const response = await fetch(`/api/stats/team-performance?${params.toString()}`, {
            headers: {
            'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            let errorMsg = `HTTP error! status: ${response.status}`;
            if (response.status === 401) {
                errorMsg += ", message: Authentication required. Please log in again.";
            } else {
                try {
                    const errorData = await response.json();
                    errorMsg += `, message: ${errorData.message || response.statusText}`;
                } catch (parseError) {
                    errorMsg += `, message: ${response.statusText}`;
                }
            }
            throw new Error(errorMsg);
        }

        const data = await response.json();
        setTeamData(data); // Set data on success
        setError(null); // Clear error on success

        } catch (err) {
        console.error("Failed to fetch team data:", err);
        setError(`Failed to load team analytics data: ${err.message}`);
        setTeamData(null); // Clear data on error
        } finally {
        setLoading(false); // Always stop loading
        }
    }, [selectedUserId, dateRange, customDateRange, users, error]); // Added dependencies

  // Fetch initial data only after users have been fetched (or failed fetch)
  useEffect(() => {
      // Only run initial data fetch if users are loaded and there was no error fetching users
      if (users.length > 0 && !error) {
          fetchData(true); // Pass true for initial load
      }
      // If user fetch failed (error is set), ensure loading is false.
      else if (error) {
          setLoading(false);
      }
      // If users array is empty but no error (e.g., API returned empty list), stop loading.
      else if (users.length === 0 && !error && !loading) {
          // This case might indicate an issue or just no users - might need specific handling?
          // For now, just ensure loading stops if it hasn't already.
          setLoading(false)
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, error]); // Run when users state or error state changes


  // --- Handlers ---
  const handleUserChange = (event) => {
    setSelectedUserId(event.target.value);
    // Fetch data immediately when user changes
    fetchData(false);
  };

  const handleDateRangeChange = (range, customDates = null) => {
     setDateRange(range);
     if (range === 'custom' && customDates) {
       setCustomDateRange(customDates);
     } else if (range !== 'custom') {
       setCustomDateRange({ start: null, end: null });
     }
     // Fetch data immediately when date range changes
     // Note: State updates are batched, so fetchData will use the *new* range/dates
     fetchData(false);
   };

  // --- Rendering Logic ---

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: theme.colors.cardBackground,
          border: `1px solid ${theme.colors.muted}`,
          padding: theme.spacing(1),
          borderRadius: theme.borderRadius.sm,
          color: theme.colors.text,
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        }}>
          <p style={{ fontWeight: 'bold', marginBottom: theme.spacing(0.5) }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} style={{ color: entry.color || entry.fill }}>
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ padding: theme.spacing(3), backgroundColor: theme.colors.background, color: theme.colors.text, minHeight: '100vh' }}>
      <h1 style={{ marginBottom: theme.spacing(3), color: theme.colors.primary, fontWeight: 'bold', fontSize: '1.75rem' }}>Team Analytics Dashboard</h1>

      {/* Loading State (Covers both user and data loading) */}
      {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
              <Spinner />
          </div>
      )}

      {/* Error State - Display any error that occurred */}
       {error && !loading && (
         <Card style={{ marginBottom: theme.spacing(3), padding: theme.spacing(2), backgroundColor: '#ffebee', color: theme.colors.error, border: `1px solid ${theme.colors.error}` }}>
           <p><strong>Error:</strong> {error}</p>
           {/* Simple retry button for non-auth errors */} 
           {!error.toLowerCase().includes("authentication") && !error.toLowerCase().includes("unauthorized") && (
               <Button onClick={() => { 
                   setError(null); // Clear error
                   if(users.length === 0) { // If users never loaded, retry fetching them
                       // Re-trigger user fetch effect (might need a dedicated retry function)
                       // For simplicity here, we might reload or ask user to refresh.
                       // Or call a refetchUsers function if you extract it.
                       window.location.reload(); // Simplest way to retry everything
                   } else { 
                       fetchData(false); // Otherwise, just retry fetching data
                   }
               }} style={{ marginTop: theme.spacing(1) }}>Retry</Button> 
           )}
         </Card>
       )}

      {/* Dashboard Content Area - Render only if NOT loading and NO error */}
       {!loading && !error && (
          <>
              {/* Filter Section - Show only if users loaded */}
              {users.length > 0 && (
                  <Card style={{ marginBottom: theme.spacing(3), padding: theme.spacing(2), backgroundColor: theme.colors.cardBackground, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing(2), alignItems: 'center' }}>
                          <div>
                              <label htmlFor="teamMemberSelect" style={{ marginRight: theme.spacing(1), color: theme.colors.text, fontSize: '0.875rem' }}>Team Member:</label>
                              <select
                                id="teamMemberSelect"
                                value={selectedUserId}
                                onChange={handleUserChange}
                                style={{
                                    padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
                                    borderRadius: theme.borderRadius.sm,
                                    border: `1px solid ${theme.colors.muted}`,
                                    backgroundColor: theme.colors.background,
                                    color: theme.colors.text,
                                    minWidth: '150px'
                                }}
                                disabled={users.length <= 1}
                                >
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>
                                    {user.name}
                                    </option>
                                ))}
                              </select>
                          </div>
                          <DateRangeSelector
                              currentRange={dateRange}
                              onRangeChange={handleDateRangeChange}
                          />
                          <Button onClick={() => fetchData(false)} style={{ marginLeft: 'auto' }}>
                              Refresh Data
                          </Button>
                      </div>
                  </Card>
              )}

              {/* Data Display Area - Show only if teamData is available */}
              {teamData ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing(3) }}>
                      {/* Sections 1-4 with Charts and Metrics */}
                      {/* (Code for sections 1-4 remains the same as previous version) */}

                      {/* Section 1: Performance Overview */}
                      <Card style={{ padding: theme.spacing(2), backgroundColor: theme.colors.cardBackground }}>
                          <h2 style={{ color: theme.colors.primary, marginBottom: theme.spacing(2), fontSize: '1.25rem', fontWeight: '600' }}>Performance Overview</h2>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: theme.spacing(2) }}>
                              <MetricCard title="Call Volume" value={teamData.summary?.totalCalls ?? 'N/A'} change={teamData.summary?.callVolumeChange ?? null} />
                              <MetricCard title="Conversion Rate" value={`${teamData.summary?.conversionRate?.toFixed(1) ?? 'N/A'}%`} change={teamData.summary?.conversionRateChange ?? null} />
                              <MetricCard title="Deals Closed" value={teamData.summary?.totalDeals ?? 'N/A'} change={teamData.summary?.dealsClosedChange ?? null} />
                              <MetricCard title="Avg. Deal Value" value={`$${teamData.summary?.avgDealValue?.toFixed(2) ?? 'N/A'}`} />
                              <MetricCard title="Tasks Completed" value={teamData.summary?.completedTasks ?? 'N/A'} />
                              <MetricCard title="Avg. Follow-Up (Days)" value={teamData.summary?.avgFollowUpTime?.toFixed(1) ?? 'N/A'} />
                          </div>
                          {teamData.goals && Object.keys(teamData.goals).length > 0 && (
                              <div style={{ marginTop: theme.spacing(3) }}>
                                  <h3 style={{ color: theme.colors.secondary, marginBottom: theme.spacing(1), fontSize: '1.1rem', fontWeight: '600' }}>Goal Progress</h3>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: theme.spacing(2) }}>
                                      {Object.entries(teamData.goals).map(([key, goal]) => (
                                          <GoalProgress key={key} title={formatGoalTitle(key)} current={goal.current} target={goal.target} theme={theme} />
                                      ))}
                                  </div>
                              </div>
                          )}
                      </Card>

                       {/* Section 2: Activity Breakdown */}
                      <Card style={{ padding: theme.spacing(2), backgroundColor: theme.colors.cardBackground }}>
                           <h2 style={{ color: theme.colors.primary, marginBottom: theme.spacing(2), fontSize: '1.25rem', fontWeight: '600' }}>Activity Breakdown</h2>
                           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: theme.spacing(3) }}>
                               {teamData.callsByOutcome && teamData.callsByOutcome.length > 0 ? (
                                   <div>
                                       <h3 style={{ color: theme.colors.secondary, marginBottom: theme.spacing(1), textAlign: 'center', fontSize: '1rem', fontWeight: '500' }}>Calls by Outcome</h3>
                                       <ResponsiveContainer width="100%" height={300}>
                                           <PieChart>
                                               <Pie data={teamData.callsByOutcome} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                                                   {teamData.callsByOutcome.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                                               </Pie>
                                               <Tooltip content={<CustomTooltip />} />
                                               <Legend />
                                           </PieChart>
                                       </ResponsiveContainer>
                                   </div>
                               ) : <p style={{ color: theme.colors.muted, textAlign: 'center' }}>No call outcome data available.</p>}
                               {teamData.activityByDay && teamData.activityByDay.length > 0 ? (
                                   <div>
                                       <h3 style={{ color: theme.colors.secondary, marginBottom: theme.spacing(1), textAlign: 'center', fontSize: '1rem', fontWeight: '500' }}>Activity by Day</h3>
                                       <ResponsiveContainer width="100%" height={300}>
                                           <BarChart data={teamData.activityByDay}>
                                               <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.muted + '50'} />
                                               <XAxis dataKey="day" stroke={theme.colors.text} fontSize="0.75rem" />
                                               <YAxis stroke={theme.colors.text} fontSize="0.75rem" />
                                               <Tooltip content={<CustomTooltip />} />
                                               <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                                               {teamData.activityByDay[0]?.hasOwnProperty('calls') && <Bar dataKey="calls" fill={theme.colors.primary} name="Calls" />}
                                               {teamData.activityByDay[0]?.hasOwnProperty('tasks') && <Bar dataKey="tasks" fill={theme.colors.secondary} name="Tasks Completed" />}
                                               {teamData.activityByDay[0]?.hasOwnProperty('emails') && <Bar dataKey="emails" fill="#FFBB28" name="Emails Sent" />}
                                           </BarChart>
                                       </ResponsiveContainer>
                                   </div>
                               ) : <p style={{ color: theme.colors.muted, textAlign: 'center' }}>No daily activity data available.</p>}
                           </div>
                       </Card>

                       {/* Section 3: Contact Management */}
                       <Card style={{ padding: theme.spacing(2), backgroundColor: theme.colors.cardBackground }}>
                           <h2 style={{ color: theme.colors.primary, marginBottom: theme.spacing(2), fontSize: '1.25rem', fontWeight: '600' }}>Contact Management</h2>
                           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: theme.spacing(3) }}>
                               <MetricCard title="Total Contacts" value={teamData.summary?.totalContacts ?? 'N/A'} />
                               <MetricCard title="New Contacts" value={teamData.summary?.totalContacts ?? 'N/A'} />
                               <MetricCard title="Contact Conversion" value={`${teamData.summary?.conversionRate?.toFixed(1) ?? 'N/A'}%`} />
                               {teamData.contactsStatus && teamData.contactsStatus.length > 0 ? (
                                   <div style={{ gridColumn: 'span 1 / span 1' }}>
                                       <h3 style={{ color: theme.colors.secondary, marginBottom: theme.spacing(1), textAlign: 'center', fontSize: '1rem', fontWeight: '500' }}>Contact Statuses</h3>
                                       <ResponsiveContainer width="100%" height={300}>
                                           <PieChart>
                                               <Pie data={teamData.contactsStatus} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#ffc658" dataKey="value" nameKey="name" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                                                   {teamData.contactsStatus.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                                               </Pie>
                                               <Tooltip content={<CustomTooltip />} />
                                               <Legend />
                                           </PieChart>
                                       </ResponsiveContainer>
                                   </div>
                               ) : <MetricCard title="Contact Statuses" value="No data available" />}
                           </div>
                       </Card>

                       {/* Section 4: Tasks & Follow-ups */}
                       <Card style={{ padding: theme.spacing(2), backgroundColor: theme.colors.cardBackground }}>
                           <h2 style={{ color: theme.colors.primary, marginBottom: theme.spacing(2), fontSize: '1.25rem', fontWeight: '600' }}>Tasks & Follow-ups</h2>
                           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: theme.spacing(3) }}>
                               <MetricCard title="Tasks Completed" value={teamData.summary?.tasksCompleted ?? 'N/A'} />
                               <MetricCard title="Tasks Outstanding" value={(teamData.summary?.tasksTotalCount - teamData.summary?.tasksCompleted) ?? 'N/A'} />
                               <MetricCard title="Tasks Overdue" value={teamData.overdueTasks ?? 'N/A'} />
                               {teamData.tasksStatus && teamData.tasksStatus.length > 0 ? (
                                   <div style={{ gridColumn: 'span 1 / span 1' }}>
                                       <h3 style={{ color: theme.colors.secondary, marginBottom: theme.spacing(1), textAlign: 'center', fontSize: '1rem', fontWeight: '500' }}>Task Statuses</h3>
                                       <ResponsiveContainer width="100%" height={300}>
                                           <PieChart>
                                               <Pie data={teamData.tasksStatus} cx="50%" cy="50%" outerRadius={100} fill="#82ca9d" dataKey="value" nameKey="name" labelLine={false} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                                                   {teamData.tasksStatus.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />))}
                                               </Pie>
                                               <Tooltip content={<CustomTooltip />} />
                                               <Legend />
                                           </PieChart>
                                       </ResponsiveContainer>
                                   </div>
                               ) : <MetricCard title="Task Statuses" value="No data available" />}
                           </div>
                       </Card>

                       {/* Performance Metrics Radar Chart */}
                       {teamData.performanceMetrics && teamData.performanceMetrics.length > 0 ? (
                           <Card style={{ padding: theme.spacing(2), backgroundColor: theme.colors.cardBackground }}>
                               <h2 style={{ color: theme.colors.primary, marginBottom: theme.spacing(2), textAlign: 'center', fontSize: '1.25rem', fontWeight: '600' }}>Overall Performance Areas</h2>
                               <ResponsiveContainer width="100%" height={400}>
                                   <RadarChart cx="50%" cy="50%" outerRadius="80%" data={teamData.performanceMetrics}>
                                       <PolarGrid stroke={theme.colors.muted + '50'} />
                                       <PolarAngleAxis dataKey="subject" stroke={theme.colors.text} fontSize="0.85rem" />
                                       <PolarRadiusAxis angle={30} domain={[0, 100]} stroke={theme.colors.muted} fontSize="0.75rem" />
                                       <Radar name={selectedUserId === 'all' ? 'Team Average' : (users.find(u => u.id === selectedUserId)?.name || 'Selected User')} dataKey="A" stroke={theme.colors.primary} fill={theme.colors.primary} fillOpacity={0.6} />
                                       <Tooltip content={<CustomTooltip />} />
                                       <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                                   </RadarChart>
                               </ResponsiveContainer>
                           </Card>
                       ) : <p style={{ color: theme.colors.muted, textAlign: 'center' }}>No performance metrics data available.</p>}

                  </div>
              ) : (
                  // Show message if users loaded but no teamData (and not loading/error)
                  !loading && !error && users.length > 0 && (
                      <Card style={{ padding: theme.spacing(4), textAlign: 'center', backgroundColor: theme.colors.cardBackground, color: theme.colors.text }}>
                          <p>No data available for the selected filters. Try selecting a different time range or user.</p>
                      </Card>
                  )
              )}
          </>
       )}
    </div>
  );
};

// --- Helper Components ---

const MetricCard = React.memo(({ title, value, change = null }) => {
   // Simplified theme for brevity
   const theme = {
     colors: { text: '#111827', muted: '#6b7280', success: '#10b981', error: '#ef4444', cardBackground: '#ffffff' },
     spacing: (f) => `${f * 0.5}rem`,
     borderRadius: { md: '0.5rem' },
   };
   const isPositive = change !== null && change >= 0;
   const changeColor = change !== null ? (isPositive ? theme.colors.success : theme.colors.error) : theme.colors.muted;
   const changeText = change !== null ? `${isPositive ? '▲' : '▼'} ${Math.abs(change)}%` : null;

   return (
     <div style={{
       backgroundColor: theme.colors.cardBackground,
       padding: theme.spacing(2),
       borderRadius: theme.borderRadius.md,
       textAlign: 'center',
       boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
     }}>
       <h4 style={{ margin: `0 0 ${theme.spacing(1)} 0`, color: theme.colors.muted, fontSize: '0.8rem', fontWeight: '500', textTransform: 'uppercase' }}>{title}</h4>
       <div style={{ fontSize: '1.5em', fontWeight: '600', color: theme.colors.text, marginBottom: change !== null ? theme.spacing(0.5) : 0 }}>{value}</div>
       {changeText && (
         <div style={{ color: changeColor, fontSize: '0.8em' }}>
           {changeText} <span style={{color: theme.colors.muted, fontSize: '0.7em'}}>vs prev.</span>
         </div>
       )}
     </div>
   );
 });
MetricCard.displayName = 'MetricCard';

 const GoalProgress = React.memo(({ title, current, target, theme }) => {
   const percentage = target > 0 ? Math.min(100, Math.max(0, Math.round((current / target) * 100))) : 0;
   const barColor = percentage >= 100 ? theme.colors.success : (percentage > 75 ? theme.colors.primary : (percentage > 40 ? '#FFBB28' : theme.colors.error));

   return (
     <div style={{ marginBottom: theme.spacing(1.5) }}>
       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: theme.spacing(0.5), fontSize: '0.85em' }}>
         <span style={{ color: theme.colors.text, fontWeight: '500' }}>{title}</span>
         <span style={{ color: theme.colors.muted }}>{current} / {target} ({percentage}%)</span>
       </div>
       <div style={{ height: '8px', backgroundColor: theme.colors.muted + '30', borderRadius: '4px', overflow: 'hidden' }}>
         <div style={{
           width: `${percentage}%`,
           height: '100%',
           backgroundColor: barColor,
           borderRadius: '4px',
           transition: 'width 0.5s ease-in-out, background-color 0.5s ease-in-out'
         }}></div>
       </div>
     </div>
   );
 });
 GoalProgress.displayName = 'GoalProgress';

const formatGoalTitle = (key) => {
   return key.replace(/([A-Z])/g, ' $1')
           .replace(/Goal$/, ' Goal')
           .replace(/_/g, ' ')
           .replace(/^\w/, c => c.toUpperCase());
 };

export default TeamAnalytics;
