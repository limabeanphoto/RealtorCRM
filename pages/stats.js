// pages/stats.js - Modernized Analytics Page (Part 1)
import { useState, useEffect } from 'react'
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import DateRangeSelector from '../components/stats/DateRangeSelector'
import ModernMetricCard from '../components/stats/ModernMetricCard'
import ChartContainer from '../components/stats/ChartContainer'
import DataTable from '../components/stats/DataTable'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import Button from '../components/common/Button'
import Spinner from '../components/common/Spinner'
import theme from '../styles/theme'

export default function Stats() {
  // State for date range and metrics
  const [dateRange, setDateRange] = useState('month')
  const [customRange, setCustomRange] = useState({
    startDate: null,
    endDate: null
  })
  const [metricsData, setMetricsData] = useState({
    callsMetrics: { total: 0, data: [] },
    dealsMetrics: { total: 0, data: [] },
    contactsMetrics: { total: 0, data: [] },
    tasksMetrics: { total: 0, data: [] },
    callOutcomes: [],
    conversionRates: { calls: 0, deals: 0, rate: 0 },
    loading: true
  })
  
  // State for active chart types
  const [activeChartTypes, setActiveChartTypes] = useState({
    calls: 'bar',
    deals: 'bar',
    contacts: 'bar',
    tasks: 'bar'
  })
  
  // State for raw data tables
  const [rawData, setRawData] = useState({
    calls: [],
    deals: [],
    contacts: [],
    tasks: [],
    activeTab: 'calls',
    loading: true
  })
  
  // Format date range for API requests
  const getDateParams = () => {
    const now = new Date()
    let startDate, endDate
    
    switch (dateRange) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0))
        endDate = new Date(new Date().setHours(23, 59, 59, 999))
        break
      case 'week':
        startDate = new Date(now)
        startDate.setDate(now.getDate() - now.getDay()) // Start of current week (Sunday)
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date(new Date().setHours(23, 59, 59, 999))
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = new Date(new Date().setHours(23, 59, 59, 999))
        break
      case 'ytd':
        startDate = new Date(now.getFullYear(), 0, 1)
        endDate = new Date(new Date().setHours(23, 59, 59, 999))
        break
      case 'year':
        startDate = new Date()
        startDate.setFullYear(startDate.getFullYear() - 1)
        endDate = new Date(new Date().setHours(23, 59, 59, 999))
        break
      case 'custom':
        startDate = customRange.startDate
        endDate = customRange.endDate
        if (!startDate || !endDate) {
          // Use this month as fallback
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          endDate = new Date(new Date().setHours(23, 59, 59, 999))
        }
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = new Date(new Date().setHours(23, 59, 59, 999))
    }
    
    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    }
  }

  // Fetch metrics data
  const fetchMetricsData = async () => {
    try {
      setMetricsData(prev => ({ ...prev, loading: true }))
      
      const { startDate, endDate } = getDateParams()
      const token = localStorage.getItem('token')
      
      if (!token) {
        console.error('Authentication token not found')
        setMetricsData(prev => ({ ...prev, loading: false }))
        return
      }
      
      console.log(`Fetching metrics from ${startDate} to ${endDate}`)
      
      const response = await fetch(`/api/stats/metrics?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        console.log('Metrics data received:', data)
        setMetricsData({
          callsMetrics: data.callsMetrics || { total: 0, data: [] },
          dealsMetrics: data.dealsMetrics || { total: 0, data: [] },
          contactsMetrics: data.contactsMetrics || { total: 0, data: [] },
          tasksMetrics: data.tasksMetrics || { total: 0, data: [] },
          callOutcomes: data.callOutcomes || [],
          conversionRates: data.conversionRates || { calls: 0, deals: 0, rate: 0 },
          loading: false
        })
      } else {
        console.error('Error fetching metrics:', data.message)
        setMetricsData(prev => ({ ...prev, loading: false }))
      }
    } catch (error) {
      console.error('Error fetching metrics data:', error)
      setMetricsData(prev => ({ ...prev, loading: false }))
    }
  }
  
  // Fetch raw data
  const fetchRawData = async (type) => {
    try {
      setRawData(prev => ({ ...prev, loading: true }))
      
      const { startDate, endDate } = getDateParams()
      const token = localStorage.getItem('token')
      
      if (!token) {
        console.error('Authentication token not found')
        setRawData(prev => ({ ...prev, loading: false }))
        return
      }
      
      console.log(`Fetching ${type} data from ${startDate} to ${endDate}`)
      
      const response = await fetch(`/api/stats/raw-data?type=${type}&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        console.log(`${type} data received:`, data)
        setRawData(prev => ({
          ...prev,
          [type]: data.data || [],
          loading: false
        }))
      } else {
        console.error(`Error fetching ${type} data:`, data.message)
        setRawData(prev => ({ ...prev, loading: false }))
      }
    } catch (error) {
      console.error(`Error fetching ${type} data:`, error)
      setRawData(prev => ({ ...prev, loading: false }))
    }
  }
  
  // Effect to fetch data when date range changes
  useEffect(() => {
    fetchMetricsData()
    fetchRawData(rawData.activeTab)
  }, [dateRange, customRange.startDate, customRange.endDate])
  
  // Effect to fetch data when active tab changes
  useEffect(() => {
    fetchRawData(rawData.activeTab)
  }, [rawData.activeTab])
  
  // Handle date range change
  const handleDateRangeChange = (range) => {
    console.log('Date range changed to:', range)
    setDateRange(range)
  }
  
  // Handle custom date range change
  const handleCustomDateChange = (startDate, endDate) => {
    console.log('Custom date range changed:', startDate, endDate)
    setCustomRange({ startDate, endDate })
    setDateRange('custom')
  }
  
  // Toggle chart type
  const toggleChartType = (metric) => {
    setActiveChartTypes(prev => ({
      ...prev,
      [metric]: prev[metric] === 'bar' ? 'line' : 'bar'
    }))
  }
  
  // Handle tab change for raw data
  const handleTabChange = (tab) => {
    setRawData(prev => ({ ...prev, activeTab: tab }))
  }

  // Format date for display
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }
  
  // Get range display text
  const getRangeText = () => {
    switch (dateRange) {
      case 'today': return 'Today'
      case 'week': return 'This Week'
      case 'month': return 'This Month'
      case 'ytd': return 'Year to Date'
      case 'year': return 'Last 365 Days'
      case 'custom': 
        return customRange.startDate && customRange.endDate
          ? `${formatDate(customRange.startDate)} - ${formatDate(customRange.endDate)}`
          : 'Custom Range'
      default: return 'This Month'
    }
  }
  
  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours()
    
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }
  
  // COLORS for charts
  const COLORS = [
    theme.colors.brand.primary,
    theme.colors.brand.secondary,
    theme.colors.brand.accent,
    theme.colors.brand.highlight,
    '#e74c3c',
    '#3498db'
  ]
 
  return (
    <ProtectedRoute>
      <div className="dashboard-container">
        {/* Welcome Message - Matching Dashboard Style */}
        <div className="dashboard-card welcome-card">
          <h1>
            {getGreeting()}! Let's dive into your analytics
          </h1>
          <p>Analyze your performance and track your progress with detailed insights for {getRangeText().toLowerCase()}.</p>
        </div>

        {/* Date Range Selector */}
        <div className="dashboard-card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ 
            marginTop: '0', 
            marginBottom: '1.5rem',
            color: '#2c3e50',
            fontSize: '1.5rem',
            fontWeight: '600'
          }}>
            📊 Analytics Dashboard
          </h2>
          
          <DateRangeSelector 
            activeRange={dateRange}
            onRangeChange={handleDateRangeChange}
            onCustomDateChange={handleCustomDateChange}
          />
          
          <h3 style={{ 
            marginTop: '1.5rem', 
            marginBottom: '0',
            color: theme.colors.brand.primary,
            fontSize: '1.2rem',
            fontWeight: '600'
          }}>
            {getRangeText()} Performance Overview
          </h3>
        </div>
        
        {metricsData.loading ? (
          <div className="dashboard-card" style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading analytics data...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Metrics Overview Cards - Dashboard Style */}
            <div className="dashboard-grid">
              <ModernMetricCard 
                title="Calls Made" 
                value={metricsData.callsMetrics.total} 
                icon="📞"
                color={theme.colors.brand.primary}
                subtitle="Total outbound calls"
              />
              <ModernMetricCard 
                title="Deals Closed" 
                value={metricsData.dealsMetrics.total} 
                icon="🤝"
                color={theme.colors.brand.secondary}
                subtitle="Successfully closed deals"
              />
              <ModernMetricCard 
                title="Contacts Added" 
                value={metricsData.contactsMetrics.total} 
                icon="👥"
                color={theme.colors.brand.accent}
                subtitle="New prospects in pipeline"
              />
              <ModernMetricCard 
                title="Tasks Created" 
                value={metricsData.tasksMetrics.total} 
                icon="✅"
                color="#e58e26"
                subtitle="Follow-up actions logged"
              />
              <ModernMetricCard 
                title="Conversion Rate" 
                value={`${metricsData.conversionRates.rate}%`} 
                icon="📈"
                color="#b71540"
                subtitle={`${metricsData.conversionRates.deals} deals from ${metricsData.conversionRates.calls} calls`}
              />
            </div>

            {/* Activity Charts Section */}
            <div className="dashboard-card" style={{ marginBottom: '2rem' }}>
              <h2 style={{ 
                marginTop: '0', 
                marginBottom: '1.5rem',
                color: '#2c3e50',
                fontSize: '1.5rem',
                fontWeight: '600'
              }}>
                📈 Activity Trends
              </h2>
              <p style={{ 
                color: '#7A7A73', 
                marginBottom: '2rem',
                fontSize: '1.1rem'
              }}>
                Track your team's performance over time with interactive charts
              </p>
            </div>

            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '2rem', 
              marginBottom: '2rem'
            }}>
              {/* Calls Chart */}
              <ChartContainer 
                title="Calls Over Time"
                activeChartType={activeChartTypes.calls}
                onChartTypeToggle={() => toggleChartType('calls')}
              >
                <ResponsiveContainer width="100%" height="100%">
                  {activeChartTypes.calls === 'bar' ? (
                    <BarChart data={metricsData.callsMetrics.data} margin={{ top: 10, right: 30, left: 0, bottom: 15 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12, fill: '#7A7A73' }}
                        axisLine={{ stroke: '#e0e0e0' }}
                      />
                      <YAxis 
                        allowDecimals={false} 
                        tick={{ fontSize: 12, fill: '#7A7A73' }}
                        axisLine={{ stroke: '#e0e0e0' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Legend />
                      <Bar 
                        dataKey="count" 
                        fill={theme.colors.brand.primary}
                        name="Calls" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  ) : (
                    <LineChart data={metricsData.callsMetrics.data} margin={{ top: 10, right: 30, left: 0, bottom: 15 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12, fill: '#7A7A73' }}
                        axisLine={{ stroke: '#e0e0e0' }}
                      />
                      <YAxis 
                        allowDecimals={false} 
                        tick={{ fontSize: 12, fill: '#7A7A73' }}
                        axisLine={{ stroke: '#e0e0e0' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        stroke={theme.colors.brand.primary}
                        strokeWidth={3}
                        dot={{ fill: theme.colors.brand.primary, strokeWidth: 2, r: 5 }}
                        name="Calls" 
                      />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </ChartContainer>
              
              {/* Deals Chart */}
              <ChartContainer 
                title="Deals Over Time"
                activeChartType={activeChartTypes.deals}
                onChartTypeToggle={() => toggleChartType('deals')}
              >
                <ResponsiveContainer width="100%" height="100%">
                  {activeChartTypes.deals === 'bar' ? (
                    <BarChart data={metricsData.dealsMetrics.data} margin={{ top: 10, right: 30, left: 0, bottom: 15 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12, fill: '#7A7A73' }}
                        axisLine={{ stroke: '#e0e0e0' }}
                      />
                      <YAxis 
                        allowDecimals={false} 
                        tick={{ fontSize: 12, fill: '#7A7A73' }}
                        axisLine={{ stroke: '#e0e0e0' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Legend />
                      <Bar 
                        dataKey="count" 
                        fill={theme.colors.brand.secondary}
                        name="Deals" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  ) : (
                    <LineChart data={metricsData.dealsMetrics.data} margin={{ top: 10, right: 30, left: 0, bottom: 15 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12, fill: '#7A7A73' }}
                        axisLine={{ stroke: '#e0e0e0' }}
                      />
                      <YAxis 
                        allowDecimals={false} 
                        tick={{ fontSize: 12, fill: '#7A7A73' }}
                        axisLine={{ stroke: '#e0e0e0' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        stroke={theme.colors.brand.secondary}
                        strokeWidth={3}
                        dot={{ fill: theme.colors.brand.secondary, strokeWidth: 2, r: 5 }}
                        name="Deals" 
                      />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </ChartContainer>

              {/* Contacts Chart */}
              <ChartContainer 
                title="Contacts Added"
                activeChartType={activeChartTypes.contacts}
                onChartTypeToggle={() => toggleChartType('contacts')}
              >
                <ResponsiveContainer width="100%" height="100%">
                  {activeChartTypes.contacts === 'bar' ? (
                    <BarChart data={metricsData.contactsMetrics.data} margin={{ top: 10, right: 30, left: 0, bottom: 15 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12, fill: '#7A7A73' }}
                        axisLine={{ stroke: '#e0e0e0' }}
                      />
                      <YAxis 
                        allowDecimals={false} 
                        tick={{ fontSize: 12, fill: '#7A7A73' }}
                        axisLine={{ stroke: '#e0e0e0' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Legend />
                      <Bar 
                        dataKey="count" 
                        fill={theme.colors.brand.accent}
                        name="Contacts" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  ) : (
                    <LineChart data={metricsData.contactsMetrics.data} margin={{ top: 10, right: 30, left: 0, bottom: 15 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12, fill: '#7A7A73' }}
                        axisLine={{ stroke: '#e0e0e0' }}
                      />
                      <YAxis 
                        allowDecimals={false} 
                        tick={{ fontSize: 12, fill: '#7A7A73' }}
                        axisLine={{ stroke: '#e0e0e0' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        stroke={theme.colors.brand.accent}
                        strokeWidth={3}
                        dot={{ fill: theme.colors.brand.accent, strokeWidth: 2, r: 5 }}
                        name="Contacts" 
                      />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </ChartContainer>
              
              {/* Call Outcomes Distribution */}
              <ChartContainer title="Call Outcome Distribution">
                <ResponsiveContainer width="100%" height="100%">
                  {metricsData.callOutcomes && metricsData.callOutcomes.length > 0 ? (
                    <PieChart>
                      <Pie
                        data={metricsData.callOutcomes}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={100}
                        innerRadius={40}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {metricsData.callOutcomes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name) => [`${value} calls`, name]}
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Legend />
                    </PieChart>
                  ) : (
                    <div style={{ 
                      height: '100%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      flexDirection: 'column',
                      color: '#7A7A73'
                    }}>
                      <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}>
                        📊
                      </div>
                      <p style={{ textAlign: 'center', margin: 0 }}>
                        No call outcome data available for the selected period
                      </p>
                    </div>
                  )}
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            {/* Raw Data Tables Section */}
            <div className="dashboard-card" style={{ marginBottom: '1rem' }}>
              <h2 style={{ 
                marginTop: '0', 
                marginBottom: '1rem',
                color: '#2c3e50',
                fontSize: '1.5rem',
                fontWeight: '600'
              }}>
                📋 Detailed Data
              </h2>
              <p style={{ 
                color: '#7A7A73', 
                marginBottom: '1.5rem',
                fontSize: '1.1rem'
              }}>
                Export and analyze detailed records for the selected time period
              </p>
              
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <Button
                  onClick={() => handleTabChange('calls')}
                  variant={rawData.activeTab === 'calls' ? 'primary' : 'outline'}
                  tooltip="View detailed call data"
                  style={{
                    backgroundColor: rawData.activeTab === 'calls' ? theme.colors.brand.primary : 'transparent',
                    borderColor: theme.colors.brand.primary,
                    color: rawData.activeTab === 'calls' ? 'white' : theme.colors.brand.primary
                  }}
                >
                  📞 Calls
                </Button>
                
                <Button
                  onClick={() => handleTabChange('deals')}
                  variant={rawData.activeTab === 'deals' ? 'primary' : 'outline'}
                  tooltip="View detailed deal data"
                  style={{
                    backgroundColor: rawData.activeTab === 'deals' ? theme.colors.brand.secondary : 'transparent',
                    borderColor: theme.colors.brand.secondary,
                    color: rawData.activeTab === 'deals' ? 'white' : theme.colors.brand.secondary
                  }}
                >
                  🤝 Deals
                </Button>
                
                <Button
                  onClick={() => handleTabChange('contacts')}
                  variant={rawData.activeTab === 'contacts' ? 'primary' : 'outline'}
                  tooltip="View detailed contact data"
                  style={{
                    backgroundColor: rawData.activeTab === 'contacts' ? theme.colors.brand.accent : 'transparent',
                    borderColor: theme.colors.brand.accent,
                    color: rawData.activeTab === 'contacts' ? 'white' : theme.colors.brand.accent
                  }}
                >
                  👥 Contacts
                </Button>
                
                <Button
                  onClick={() => handleTabChange('tasks')}
                  variant={rawData.activeTab === 'tasks' ? 'primary' : 'outline'}
                  tooltip="View detailed task data"
                  style={{
                    backgroundColor: rawData.activeTab === 'tasks' ? '#e58e26' : 'transparent',
                    borderColor: '#e58e26',
                    color: rawData.activeTab === 'tasks' ? 'white' : '#e58e26'
                  }}
                >
                  ✅ Tasks
                </Button>
              </div>
              
              {rawData.loading ? (
                <div className="loading-container" style={{ padding: '2rem' }}>
                  <div className="spinner"></div>
                  <p>Loading data...</p>
                </div>
              ) : (
                <div style={{
                  backgroundColor: '#f8f9fa',
                  borderRadius: '12px',
                  padding: '1rem',
                  border: '1px solid #e9ecef'
                }}>
                  <DataTable 
                    data={rawData[rawData.activeTab]} 
                    type={rawData.activeTab} 
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </ProtectedRoute>
  )
}