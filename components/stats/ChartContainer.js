import { useState, useEffect } from 'react'

export default function ChartContainer({ title, children, activeChartType, onChartTypeToggle }) {
  const [chartHeight, setChartHeight] = useState(300)
  
  useEffect(() => {
    const handleResize = () => {
      // Adjust chart height based on container width
      if (window.innerWidth < 768) {
        setChartHeight(250)
      } else {
        setChartHeight(300)
      }
    }
    
    window.addEventListener('resize', handleResize)
    handleResize() // Set initial size
    
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  return (
    <div style={{
      backgroundColor: 'white', 
      padding: '1rem',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
      flex: '1',
      minWidth: '300px',
      maxWidth: '100%'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0 }}>{title}</h3>
        
        {onChartTypeToggle && (
          <button
            onClick={onChartTypeToggle}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              fontSize: '0.85rem',
              color: '#4a69bd',
              padding: '0.3rem 0.6rem',
              borderRadius: '4px',
              border: '1px solid #4a69bd'
            }}
          >
            {activeChartType === 'bar' ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.3rem' }}>
                  <path d="M3 3v18h18"></path>
                  <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"></path>
                </svg>
                Switch to Line
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.3rem' }}>
                  <path d="M3 3v18h18"></path>
                  <path d="M3 12h18"></path>
                  <path d="M3 6h18"></path>
                  <path d="M3 18h18"></path>
                </svg>
                Switch to Bar
              </>
            )}
          </button>
        )}
      </div>
      
      <div style={{ height: `${chartHeight}px` }}>
        {children}
      </div>
    </div>
  )
}