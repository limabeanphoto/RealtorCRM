// pages/stats.js
import { useState, useEffect } from 'react'
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import DateRangeSelector from '../components/stats/DateRangeSelector'
import MetricCard from '../components/stats/MetricCard'
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
  
  // COLORS
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
      <div>
        <h1>Analytics</h1>
        {/* Date Range Selector */}
        <div className="date-range-container" style={{ marginBottom: '2rem' }}>
          <DateRangeSelector 
            activeRange={dateRange}
            onRangeChange={handleDateRangeChange}
            onCustomDateChange={handleCustomDateChange}
          />
          <h2 style={{ marginTop: '1rem' }}>
            {getRangeText()} Statistics
          </h2>
        </div>
        
        {metricsData.loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <Spinner size="large" />
            <p>Loading metrics data...</p>
          </div>
        ) : (
          <>
            {/* Metrics Overview Cards */}
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '1rem', 
              marginBottom: '2rem'
            }}>
              <MetricCard 
                title="Calls Made" 
                value={metricsData.callsMetrics.total} 
                icon="📞"
                color="#4a69bd"
              />
              <MetricCard 
                title="Deals Closed" 
                value={metricsData.dealsMetrics.total} 
                icon="🤝"
                color="#78e08f"
              />
              <MetricCard 
                title="Contacts Added" 
                value={metricsData.contactsMetrics.total} 
                icon="👥"
                color="#60a3bc"
              />
              <MetricCard 
                title="Tasks Created" 
                value={metricsData.tasksMetrics.total} 
                icon="✅"
                color="#60a3bc"
              />
              <MetricCard 
                title="Conversion Rate" 
                value={`${metricsData.conversionRates.rate}%`} 
                icon="📈"
                color="#b71540"
                subtext={`${metricsData.conversionRates.deals} deals from ${metricsData.conversionRates.calls} calls`}
              />
            </div>
            
            {/* Activity Charts */}
            <h2>Activity Trends</h2>
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
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#4a69bd" name="Calls" />
                    </BarChart>
                  ) : (
                    <LineChart data={metricsData.callsMetrics.data} margin={{ top: 10, right: 30, left: 0, bottom: 15 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="count" stroke="#4a69bd" name="Calls" />
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
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#78e08f" name="Deals" />
                    </BarChart>
                  ) : (
                    <LineChart data={metricsData.dealsMetrics.data} margin={{ top: 10, right: 30, left: 0, bottom: 15 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="count" stroke="#78e08f" name="Deals" />
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
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#e58e26" name="Contacts" />
                    </BarChart>
                  ) : (
                    <LineChart data={metricsData.contactsMetrics.data} margin={{ top: 10, right: 30, left: 0, bottom: 15 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="count" stroke="#e58e26" name="Contacts" />
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
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {metricsData.callOutcomes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value} calls`, name]} />
                      <Legend />
                    </PieChart>
                  ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <p style={{ color: theme.colors.brand.text }}>No call outcome data available for the selected period</p>
                    </div>
                  )}
                </ResponsiveContainer>
              </ChartContainer>
            </div>
            
            {/* Raw Data Tables */}
            <h2>Detailed Data</h2>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <Button
                  onClick={() => handleTabChange('calls')}
                  variant={rawData.activeTab === 'calls' ? 'primary' : 'outline'}
                  tooltip="View detailed call data"
                >
                  Calls
                </Button>
                
                <Button
                  onClick={() => handleTabChange('deals')}
                  variant={rawData.activeTab === 'deals' ? 'primary' : 'outline'}
                  tooltip="View detailed deal data"
                >
                  Deals
                </Button>
                
                <Button
                  onClick={() => handleTabChange('contacts')}
                  variant={rawData.activeTab === 'contacts' ? 'primary' : 'outline'}
                  tooltip="View detailed contact data"
                >
                  Contacts
                </Button>
                
                <Button
                  onClick={() => handleTabChange('tasks')}
                  variant={rawData.activeTab === 'tasks' ? 'primary' : 'outline'}
                  tooltip="View detailed task data"
                >
                  Tasks
                </Button>
              </div>
              
              {rawData.loading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <Spinner />
                  <p>Loading data...</p>
                </div>
              ) : (
                <DataTable 
                  data={rawData[rawData.activeTab]} 
                  type={rawData.activeTab} 
                />
              )}
            </div>
          </>
        )}
      </div>
    </ProtectedRoute>
  )
}