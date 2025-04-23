import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import DateRangeSelector from '../stats/DateRangeSelector'; // Corrected import path
import Button from '../common/Button'; // Assuming this component exists
import Card from '../common/Card'; // Assuming this component exists
import Spinner from '../common/Spinner'; // Assuming this component exists
import { useTheme } from 'next-themes'; // Or your theme context

// Helper function for dynamic colors (optional, replace with your theme colors if needed)
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

const TeamAnalytics = () => {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('all'); // 'all' or a specific user ID
  const [dateRange, setDateRange] = useState('month'); // e.g., 'today', 'week', 'month', 'custom'
  const [customDateRange, setCustomDateRange] = useState({ start: null, end: null }); // For custom range picker
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { theme: nextTheme } = useTheme(); // Adapt if using a different theme provider

  // Theme object (replace with your actual theme structure or context)
  // Using a simplified theme structure here for demonstration
  const theme = {
      colors: {
          primary: nextTheme === 'dark' ? '#60a5fa' : '#3b82f6', // Example blue
          secondary: nextTheme === 'dark' ? '#4ade80' : '#22c55e', // Example green
          background: nextTheme === 'dark' ? '#1f2937' : '#f9fafb', // Example dark/light bg
          cardBackground: nextTheme === 'dark' ? '#374151' : '#ffffff', // Example card bg
          text: nextTheme === 'dark' ? '#d1d5db' : '#111827', // Example text color
          muted: nextTheme === 'dark' ? '#6b7280' : '#6b7280', // Example muted color
          error: nextTheme === 'dark' ? '#f87171' : '#ef4444', // Example error color
          success: nextTheme === 'dark' ? '#4ade80' : '#22c55e', // Example success color (matches secondary here)
      },
      borderRadius: {
          sm: '0.25rem',
          md: '0.5rem',
          lg: '0.75rem',
      },
      spacing: (factor) => `${factor * 0.5}rem`, // Example spacing function (adjust multiplier as needed)
  };


  // Fetch Users for the dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Assuming /api/users returns an array like [{ id: '...', name: '...' }]
        const response = await fetch('/api/users');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
         // Ensure 'data' is an array before spreading
         const usersArray = Array.isArray(data) ? data : (data.users || []); // Adjust if API nests users under a key
        setUsers([{ id: 'all', name: 'All Team Members' }, ...usersArray]);
      } catch (err) {
        console.error("Failed to fetch users:", err);
        setError("Failed to load team members.");
        setUsers([{ id: 'all', name: 'All Team Members' }]);
      }
    };
    fetchUsers();
  }, []); // Fetch users only once on mount

  // Fetch Team Analytics Data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    // Don't clear previous data immediately, maybe show stale data while loading
    // setTeamData(null);

    const params = new URLSearchParams();
    params.append('userId', selectedUserId);
    params.append('range', dateRange);
    if (dateRange === 'custom' && customDateRange.start && customDateRange.end) {
      params.append('startDate', customDateRange.start.toISOString().split('T')[0]);
      params.append('endDate', customDateRange.end.toISOString().split('T')[0]);
    }

    try {
      // Use the confirmed API endpoint
      const response = await fetch(`/api/stats/team-performance?${params.toString()}`);
      if (!response.ok) {
         // Try to parse error message from backend if available
         let errorMsg = `HTTP error! status: ${response.status}`;
         try {
             const errorData = await response.json();
             errorMsg += `, message: ${errorData.message || response.statusText}`;
         } catch (parseError) {
             // Fallback if response is not JSON or message key doesn't exist
             errorMsg += `, message: ${response.statusText}`;
         }
        throw new Error(errorMsg);
      }
      const data = await response.json();

      // Set the fetched team data
      setTeamData(data);

    } catch (err) {
      console.error("Failed to fetch team data:", err);
      setError(`Failed to load team analytics data: ${err.message}`);
      setTeamData(null); // Ensure data is null on error
    } finally {
      setLoading(false);
    }
  }, [selectedUserId, dateRange, customDateRange]); // Dependencies for useCallback

  // Trigger data fetch when filters change
  useEffect(() => {
    fetchData();
  }, [fetchData]); // fetchData is memoized by useCallback


  // --- Handlers ---
  const handleUserChange = (event) => {
    setSelectedUserId(event.target.value);
  };

  const handleDateRangeChange = (range, customDates = null) => {
     setDateRange(range);
     if (range === 'custom' && customDates) {
       setCustomDateRange(customDates);
     } else if (range !== 'custom') {
       setCustomDateRange({ start: null, end: null });
     }
     // Data fetch is triggered by the useEffect watching 'dateRange' and 'customDateRange'
   };


  // --- Rendering Logic ---

  // Custom Tooltip for Charts
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
              {/* Accessing name/value which are standard recharts payload properties */}
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

      {/* Filter Section */}
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
                  backgroundColor: theme.colors.background, // Use main background for select
                  color: theme.colors.text,
                  minWidth: '150px'
              }}
              disabled={loading || users.length <= 1} // Disable if loading or only 'All' option
            >
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>
           {/* Assuming DateRangeSelector handles its own styling and theme */}
          <DateRangeSelector
            currentRange={dateRange}
            onRangeChange={handleDateRangeChange}
            disabled={loading}
             // Pass theme if needed by DateRangeSelector internally
             // theme={theme}
          />
          <Button onClick={fetchData} disabled={loading} style={{ marginLeft: 'auto' }}>
            {loading ? <Spinner size="sm" /> : 'Refresh Data'}
          </Button>
        </div>
      </Card>

      {/* Loading and Error States */}
      {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
              <Spinner />
          </div>
      )}
       {error && !loading && (
         <Card style={{ marginBottom: theme.spacing(3), padding: theme.spacing(2), backgroundColor: '#ffebee', color: theme.colors.error, border: `1px solid ${theme.colors.error}` }}>
           <p><strong>Error:</strong> {error}</p>
           <Button onClick={fetchData} style={{ marginTop: theme.spacing(1) }}>Retry</Button>
         </Card>
       )}


      {/* Dashboard Content Area */}
       {!loading && !error && teamData ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing(3) }}>
           {/* Section 1: Performance Overview */}
           <Card style={{ padding: theme.spacing(2), backgroundColor: theme.colors.cardBackground }}>
             <h2 style={{ color: theme.colors.primary, marginBottom: theme.spacing(2), fontSize: '1.25rem', fontWeight: '600' }}>Performance Overview</h2>
             {/* Display Key Metrics: Adapt based on teamData structure */}
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: theme.spacing(2) }}>
               {/* Assuming teamData.summary contains these metrics */}
               <MetricCard title="Call Volume" value={teamData.summary?.totalCalls ?? 'N/A'} change={teamData.summary?.callVolumeChange ?? null} />
               <MetricCard title="Conversion Rate" value={`${teamData.summary?.conversionRate ?? 'N/A'}%`} change={teamData.summary?.conversionRateChange ?? null} />
               <MetricCard title="Deals Closed" value={teamData.summary?.totalDeals ?? 'N/A'} change={teamData.summary?.dealsClosedChange ?? null} />
               <MetricCard title="Avg. Deal Value" value={`$${teamData.summary?.avgDealValue?.toFixed(2) ?? 'N/A'}`} />
               <MetricCard title="Tasks Completed" value={teamData.summary?.completedTasks ?? 'N/A'} />
               <MetricCard title="Avg. Follow-Up (Days)" value={teamData.summary?.avgFollowUpTime?.toFixed(1) ?? 'N/A'} />
             </div>

             {/* Goals Progress - Assuming teamData.goals structure */}
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

               {/* Calls by Outcome Pie Chart */}
               {/* Assuming teamData.callsByOutcome is like [{ name: '...', value: ... }] */}
               {teamData.callsByOutcome && teamData.callsByOutcome.length > 0 ? (
                <div>
                  <h3 style={{ color: theme.colors.secondary, marginBottom: theme.spacing(1), textAlign: 'center', fontSize: '1rem', fontWeight: '500' }}>Calls by Outcome</h3>
                    <ResponsiveContainer width="100%" height={300}>
                     <PieChart>
                        <Pie
                         data={teamData.callsByOutcome}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value" // Matches the assumed API structure { name: '...', value: ... }
                          nameKey="name"  // Use 'name' from data for labels/tooltips
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          >
                          {teamData.callsByOutcome.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                           ))}
                         </Pie>
                         <Tooltip content={<CustomTooltip />} />
                         <Legend />
                       </PieChart>
                   </ResponsiveContainer>
                 </div>
               ) : <p style={{color: theme.colors.muted, textAlign: 'center'}}>No call outcome data.</p>}


                {/* Activity by Day Bar Chart */}
                {/* Assuming teamData.activityByDay is like [{ day: 'Mon', calls: ..., tasks: ... }] */}
                 {teamData.activityByDay && teamData.activityByDay.length > 0 ? (
                   <div>
                     <h3 style={{ color: theme.colors.secondary, marginBottom: theme.spacing(1), textAlign: 'center', fontSize: '1rem', fontWeight: '500' }}>Activity by Day</h3>
                     <ResponsiveContainer width="100%" height={300}>
                       <BarChart data={teamData.activityByDay}>
                         <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.muted + '50'} /> {/* Muted grid */}
                         <XAxis dataKey="day" stroke={theme.colors.text} fontSize="0.75rem" />
                         <YAxis stroke={theme.colors.text} fontSize="0.75rem"/>
                         <Tooltip content={<CustomTooltip />} />
                         <Legend wrapperStyle={{fontSize: '0.8rem'}}/>
                         {/* Check if 'calls' key exists in the first data item */}
                         {teamData.activityByDay[0]?.hasOwnProperty('calls') && <Bar dataKey="calls" fill={theme.colors.primary} name="Calls" />}
                         {/* Check if 'tasks' key exists */}
                         {teamData.activityByDay[0]?.hasOwnProperty('tasks') && <Bar dataKey="tasks" fill={theme.colors.secondary} name="Tasks Completed" />}
                         {/* Add other potential keys */}
                         {teamData.activityByDay[0]?.hasOwnProperty('emails') && <Bar dataKey="emails" fill="#FFBB28" name="Emails Sent" />}
                       </BarChart>
                     </ResponsiveContainer>
                   </div>
                 ) : <p style={{color: theme.colors.muted, textAlign: 'center'}}>No daily activity data.</p>}

               </div>
            </Card>


           {/* Section 3: Contact Management */}
           <Card style={{ padding: theme.spacing(2), backgroundColor: theme.colors.cardBackground }}>
             <h2 style={{ color: theme.colors.primary, marginBottom: theme.spacing(2), fontSize: '1.25rem', fontWeight: '600' }}>Contact Management</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: theme.spacing(3) }}>

                {/* Display contact stats */}
                {/* Assuming teamData.contactStats contains these */}
                <MetricCard title="Total Contacts" value={teamData.contactStats?.totalAssigned ?? 'N/A'} />
                <MetricCard title="New Contacts" value={teamData.contactStats?.newContacts ?? 'N/A'} />
                <MetricCard title="Contact Conversion" value={`${teamData.contactStats?.conversionRate?.toFixed(1) ?? 'N/A'}%`} />


               {/* Contact Statuses Pie Chart */}
               {/* Assuming teamData.contactStatusDistribution is like [{ name: '...', value: ... }] */}
               {teamData.contactStatusDistribution && teamData.contactStatusDistribution.length > 0 ? (
                 <div style={{ gridColumn: 'span 1 / span 1' }}> {/* Allow pie to take space */}
                   <h3 style={{ color: theme.colors.secondary, marginBottom: theme.spacing(1), textAlign: 'center', fontSize: '1rem', fontWeight: '500' }}>Contact Statuses</h3>
                    <ResponsiveContainer width="100%" height={300}>
                     <PieChart>
                       <Pie
                          data={teamData.contactStatusDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#ffc658"
                          dataKey="value" // Correct key assumed
                          nameKey="name" // Use name for label
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                       >
                         {teamData.contactStatusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
               ): <MetricCard title="Contact Statuses" value="No data" /> /* Placeholder if no data */}
              </div>
           </Card>

           {/* Section 4: Tasks & Follow-ups */}
            <Card style={{ padding: theme.spacing(2), backgroundColor: theme.colors.cardBackground }}>
              <h2 style={{ color: theme.colors.primary, marginBottom: theme.spacing(2), fontSize: '1.25rem', fontWeight: '600' }}>Tasks & Follow-ups</h2>
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: theme.spacing(3) }}>

                 {/* Display task stats */}
                 {/* Assuming teamData.taskStats contains these */}
                 <MetricCard title="Tasks Completed" value={teamData.taskStats?.completed ?? 'N/A'} />
                 <MetricCard title="Tasks Outstanding" value={teamData.taskStats?.outstanding ?? 'N/A'} />
                 <MetricCard title="Tasks Overdue" value={teamData.taskStats?.overdue ?? 'N/A'} />

                 {/* Task Status Distribution Pie Chart */}
                 {/* Assuming teamData.taskStatusDistribution is like [{ name: '...', value: ... }] */}
                 {teamData.taskStatusDistribution && teamData.taskStatusDistribution.length > 0 ? (
                     <div style={{ gridColumn: 'span 1 / span 1' }}>
                         <h3 style={{ color: theme.colors.secondary, marginBottom: theme.spacing(1), textAlign: 'center', fontSize: '1rem', fontWeight: '500' }}>Task Statuses</h3>
                         <ResponsiveContainer width="100%" height={300}>
                             <PieChart>
                                 <Pie
                                     data={teamData.taskStatusDistribution}
                                     cx="50%"
                                     cy="50%"
                                     outerRadius={100}
                                     fill="#82ca9d"
                                     dataKey="value" // Correct key assumed
                                     nameKey="name" // Use name for label
                                     labelLine={false}
                                     label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                 >
                                     {teamData.taskStatusDistribution.map((entry, index) => (
                                         <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} /> // Offset colors
                                     ))}
                                 </Pie>
                                 <Tooltip content={<CustomTooltip />} />
                                 <Legend />
                             </PieChart>
                         </ResponsiveContainer>
                     </div>
                 ) : <MetricCard title="Task Statuses" value="No data" />}
               </div>
             </Card>

            {/* Performance Metrics Radar Chart */}
            {/* Using teamData.performanceMetrics directly from API snippet */}
            {teamData.performanceMetrics && teamData.performanceMetrics.length > 0 ? (
               <Card style={{ padding: theme.spacing(2), backgroundColor: theme.colors.cardBackground }}>
                  <h2 style={{ color: theme.colors.primary, marginBottom: theme.spacing(2), textAlign: 'center', fontSize: '1.25rem', fontWeight: '600' }}>Overall Performance Areas</h2>
                  <ResponsiveContainer width="100%" height={400}>
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={teamData.performanceMetrics}>
                      <PolarGrid stroke={theme.colors.muted + '50'} />
                      <PolarAngleAxis dataKey="subject" stroke={theme.colors.text} fontSize="0.85rem"/>
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke={theme.colors.muted} fontSize="0.75rem"/>
                      <Radar
                          name={selectedUserId === 'all' ? 'Team Average' : (users.find(u=>u.id === selectedUserId)?.name || 'Selected User')}
                          dataKey="A" // Matches the 'A' key from the API snippet
                          stroke={theme.colors.primary}
                          fill={theme.colors.primary}
                          fillOpacity={0.6}
                       />
                       <Tooltip content={<CustomTooltip />} />
                       <Legend wrapperStyle={{fontSize: '0.8rem'}}/>
                     </RadarChart>
                   </ResponsiveContainer>
                </Card>
            ) : <p style={{color: theme.colors.muted, textAlign: 'center'}}>No performance metrics data available.</p>}
        </div>
      ) : (
         // Display message when there's no error, not loading, but no data
         !loading && !error && !teamData && (
           <Card style={{ padding: theme.spacing(4), textAlign: 'center', backgroundColor: theme.colors.cardBackground, color: theme.colors.text }}>
             <p style={{marginBottom: theme.spacing(2)}}>No data available for the selected filters.</p>
             <p style={{color: theme.colors.muted, marginBottom: theme.spacing(3)}}>Try adjusting the date range or selecting a different team member.</p>
              <Button
                onClick={() => {
                  setSelectedUserId('all');
                  setDateRange('month');
                  setCustomDateRange({ start: null, end: null });
                  // fetchData() will be triggered by the state change effect
                }}
              >
               Reset Filters
             </Button>
           </Card>
         )
       )}
    </div>
  );
};


// --- Helper Components ---

// Metric Card Component
const MetricCard = React.memo(({ title, value, change = null }) => {
   // Using inline theme object for simplicity, ideally consume from context
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
       backgroundColor: theme.colors.cardBackground, // Inner card bg can differ if needed
       // border: `1px solid ${theme.colors.muted + '30'}`, // Subtle border
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
MetricCard.displayName = 'MetricCard'; // Add display name for React DevTools


// Goal Progress Component
 const GoalProgress = React.memo(({ title, current, target, theme }) => {
   const percentage = target > 0 ? Math.min(100, Math.max(0, Math.round((current / target) * 100))) : 0;
   const barColor = percentage >= 100 ? theme.colors.success : (percentage > 75 ? theme.colors.primary : (percentage > 40 ? '#FFBB28' : theme.colors.error)); // Color based on progress

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
 GoalProgress.displayName = 'GoalProgress'; // Add display name

// Helper to format goal keys into readable titles
const formatGoalTitle = (key) => {
   // Example: turns 'callsGoal' into 'Calls Goal'
   return key.replace(/([A-Z])/g, ' $1') // Add space before caps
           .replace(/Goal$/, ' Goal')   // Ensure 'Goal' suffix has space
           .replace(/_/g, ' ')          // Replace underscores with spaces
           .replace(/^\w/, c => c.toUpperCase()); // Capitalize first letter
 };


export default TeamAnalytics;
