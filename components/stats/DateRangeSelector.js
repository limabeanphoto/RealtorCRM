import { useState } from 'react'

export default function DateRangeSelector({ activeRange, onRangeChange, onCustomDateChange }) {
  const [showCustomPicker, setShowCustomPicker] = useState(false)
  const [customDates, setCustomDates] = useState({
    startDate: '',
    endDate: ''
  })
  
  const handleRangeClick = (range) => {
    if (range === 'custom') {
      setShowCustomPicker(true)
    } else {
      setShowCustomPicker(false)
      onRangeChange(range)
    }
  }
  
  const handleCustomDateChange = (e) => {
    setCustomDates({
      ...customDates,
      [e.target.name]: e.target.value
    })
  }
  
  const handleCustomRangeSubmit = (e) => {
    e.preventDefault()
    if (customDates.startDate && customDates.endDate) {
      onCustomDateChange(new Date(customDates.startDate), new Date(customDates.endDate))
    }
  }
  
  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => handleRangeClick('today')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: activeRange === 'today' ? '#4a69bd' : '#e2e8f0',
            color: activeRange === 'today' ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Today
        </button>
        <button
          onClick={() => handleRangeClick('week')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: activeRange === 'week' ? '#4a69bd' : '#e2e8f0',
            color: activeRange === 'week' ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          This Week
        </button>
        <button
          onClick={() => handleRangeClick('month')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: activeRange === 'month' ? '#4a69bd' : '#e2e8f0',
            color: activeRange === 'month' ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          This Month
        </button>
        <button
          onClick={() => handleRangeClick('ytd')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: activeRange === 'ytd' ? '#4a69bd' : '#e2e8f0',
            color: activeRange === 'ytd' ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Year to Date
        </button>
        <button
          onClick={() => handleRangeClick('year')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: activeRange === 'year' ? '#4a69bd' : '#e2e8f0',
            color: activeRange === 'year' ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Last 365 Days
        </button>
        <button
          onClick={() => handleRangeClick('custom')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: activeRange === 'custom' ? '#4a69bd' : '#e2e8f0',
            color: activeRange === 'custom' ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Custom Range
        </button>
      </div>
      
      {showCustomPicker && (
        <form 
          onSubmit={handleCustomRangeSubmit}
          style={{ 
            marginTop: '1rem', 
            padding: '1rem', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '8px' 
          }}
        >
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <label htmlFor="startDate" style={{ marginRight: '0.5rem' }}>
                Start Date:
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={customDates.startDate}
                onChange={handleCustomDateChange}
                required
                style={{ padding: '0.5rem' }}
              />
            </div>
            
            <div>
              <label htmlFor="endDate" style={{ marginRight: '0.5rem' }}>
                End Date:
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={customDates.endDate}
                onChange={handleCustomDateChange}
                required
                style={{ padding: '0.5rem' }}
              />
            </div>
            
            <button
              type="submit"
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#4a69bd',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Apply Range
            </button>
          </div>
        </form>
      )}
    </div>
  )
}