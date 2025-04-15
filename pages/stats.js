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
import Layout from '../components/Layout'

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
    dealValueMetrics: { totalValue: '0.00', averageValue: '0.00', count: 0 },
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
        startDate = new Date(now.setDate(now.getDate() - now.getDay()))
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
      
      const response = await fetch(`/api/stats/metrics?startDate=${startDate}&endDate=${endDate}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      
      if (data.success) {
        setMetricsData({
          callsMetrics: data.callsMetrics,
          dealsMetrics: data.dealsMetrics,
          dealValueMetrics: data.dealValueMetrics,
          contactsMetrics: data.contactsMetrics,
          tasksMetrics: data.tasksMetrics,
          callOutcomes: data.callOutcomes,
          conversionRates: data.conversionRates,
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
      
      const response = await fetch(`/api/stats/raw-data?type=${type}&startDate=${startDate}&endDate=${endDate}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      
      if (data.success) {
        setRawData(prev => ({
          ...prev,
          [type]: data.data,
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
    setDateRange(range)
  }
  
  // Handle custom date range change
  const handleCustomDateChange = (startDate, endDate) => {
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
        return `${formatDate(customRange.startDate)} - ${formatDate(customRange.endDate)}`
      default: return 'This Month'
    }
  }
  
  // COLORS
  const COLORS = ['#4a69bd', '#60a3bc', '#e58e26', '#78e08f', '#b71540', '#ef5777']
 
  return (
    <ProtectedRoute>
      <Layout>
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
          <p>Loading metrics data...</p>
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
                title="Total Deal Value" 
                value={`$${metricsData.dealValueMetrics?.totalValue || '0.00'}`} 
                icon="💰"
                color="#e58e26"
                subtext={`Avg: $${metricsData.dealValueMetrics?.averageValue || '0.00'} per deal`}
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
                    <BarChart data={metricsData.callsMetrics.data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#4a69bd" name="Calls" />
                    </BarChart>
                  ) : (
                    <LineChart data={metricsData.callsMetrics.data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
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
                    <BarChart data={metricsData.dealsMetrics.data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#78e08f" name="Deals" />
                    </BarChart>
                  ) : (
                    <LineChart data={metricsData.dealsMetrics.data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
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
                    <BarChart data={metricsData.contactsMetrics.data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#e58e26" name="Contacts" />
                    </BarChart>
                  ) : (
                    <LineChart data={metricsData.contactsMetrics.data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
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
                </ResponsiveContainer>
              </ChartContainer>
            </div>
            
            {/* Raw Data Tables */}
            <h2>Detailed Data</h2>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <button
                  onClick={() => handleTabChange('calls')}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: rawData.activeTab === 'calls' ? '#4a69bd' : '#e2e8f0',
                    color: rawData.activeTab === 'calls' ? 'white' : 'black',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Calls
                </button>
                <button
                  onClick={() => handleTabChange('deals')}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: rawData.activeTab === 'deals' ? '#4a69bd' : '#e2e8f0',
                    color: rawData.activeTab === 'deals' ? 'white' : 'black',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Deals
                </button>
                <button
                  onClick={() => handleTabChange('contacts')}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: rawData.activeTab === 'contacts' ? '#4a69bd' : '#e2e8f0',
                    color: rawData.activeTab === 'contacts' ? 'white' : 'black',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Contacts
                </button>
                <button
                  onClick={() => handleTabChange('tasks')}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: rawData.activeTab === 'tasks' ? '#4a69bd' : '#e2e8f0',
                    color: rawData.activeTab === 'tasks' ? 'white' : 'black',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Tasks
                </button>
              </div>
              
              {rawData.loading ? (
                <p>Loading data...</p>
              ) : (
                <DataTable 
                  data={rawData[rawData.activeTab]} 
                  type={rawData.activeTab} 
                />
              )}
            </div>
          </>
        )}
      </Layout>
    </ProtectedRoute>
  )
}