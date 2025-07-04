// utils/badgeUtils.js - Centralized badge styling utilities

/**
 * Get color scheme for call outcomes
 */
export function getOutcomeStyle(outcome) {
  const styles = {
    'Interested': { 
      bg: '#d4edda', 
      text: '#155724',
      border: '#c3e6cb'
    },
    'Not Interested': { 
      bg: '#f8d7da', 
      text: '#721c24',
      border: '#f5c6cb'
    },
    'Follow Up': { 
      bg: '#fff3cd', 
      text: '#856404',
      border: '#ffeaa7'
    },
    'No Answer': { 
      bg: '#e2e3e5', 
      text: '#383d41',
      border: '#d1d3d4'
    },
    'Left Message': { 
      bg: '#cce5ff', 
      text: '#004085',
      border: '#a6d0ff'
    },
    'Wrong Number': { 
      bg: '#f8d7da', 
      text: '#721c24',
      border: '#f5c6cb'
    },
    'Deal Closed': { 
      bg: '#d4edda', 
      text: '#155724',
      border: '#c3e6cb'
    }
  }
  
  return styles[outcome] || { 
    bg: '#e2e3e5', 
    text: '#383d41',
    border: '#d1d3d4'
  }
}

/**
 * Get color scheme for task status
 */
export function getStatusStyle(status) {
  const styles = {
    'Open': { 
      bg: '#cce5ff', 
      text: '#004085',
      border: '#a6d0ff'
    },
    'In Progress': { 
      bg: '#fff3cd', 
      text: '#856404',
      border: '#ffeaa7'
    },
    'Completed': { 
      bg: '#d4edda', 
      text: '#155724',
      border: '#c3e6cb'
    }
  }
  
  return styles[status] || { 
    bg: '#e2e3e5', 
    text: '#383d41',
    border: '#d1d3d4'
  }
}

/**
 * Get color scheme for task priority
 */
export function getPriorityStyle(priority) {
  const styles = {
    'High': { 
      bg: '#f8d7da', 
      text: '#721c24',
      border: '#f5c6cb'
    },
    'Medium': { 
      bg: '#fff3cd', 
      text: '#856404',
      border: '#ffeaa7'
    },
    'Low': { 
      bg: '#d1ecf1', 
      text: '#0c5460',
      border: '#bee5eb'
    }
  }
  
  return styles[priority] || { 
    bg: '#e2e3e5', 
    text: '#383d41',
    border: '#d1d3d4'
  }
}

/**
 * Get color scheme for contact volume
 */
export function getVolumeStyle(volume) {
  const styles = {
    'High': { 
      bg: '#d4edda', 
      text: '#155724',
      border: '#c3e6cb'
    },
    'Medium': { 
      bg: '#fff3cd', 
      text: '#856404',
      border: '#ffeaa7'
    },
    'Low': { 
      bg: '#f8d7da', 
      text: '#721c24',
      border: '#f5c6cb'
    }
  }
  
  return styles[volume] || { 
    bg: '#e2e3e5', 
    text: '#383d41',
    border: '#d1d3d4'
  }
}

/**
 * Get color scheme for contact regions
 */
export function getRegionStyle(region) {
  const styles = {
    'LA': { 
      bg: '#e3f2fd', 
      text: '#1976d2',
      border: '#bbdefb'
    },
    'OC': { 
      bg: '#f3e5f5', 
      text: '#7b1fa2',
      border: '#e1bee7'
    },
    'SD': { 
      bg: '#e8f5e8', 
      text: '#388e3c',
      border: '#c8e6c9'
    },
    'SF': { 
      bg: '#fff3e0', 
      text: '#f57c00',
      border: '#ffcc02'
    },
    'other': { 
      bg: '#f5f5f5', 
      text: '#616161',
      border: '#e0e0e0'
    }
  }
  
  return styles[region] || { 
    bg: '#e2e3e5', 
    text: '#383d41',
    border: '#d1d3d4'
  }
}

/**
 * Create a badge component with consistent styling
 */
export function createBadge(text, styleFunc, value) {
  const style = styleFunc(value)
  
  return {
    display: 'inline-block',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.8rem',
    fontWeight: '500',
    backgroundColor: style.bg,
    color: style.text,
    border: `1px solid ${style.border}`,
    whiteSpace: 'nowrap'
  }
}

/**
 * Get badge style object for React components
 */
export function getBadgeStyle(type, value) {
  const styleFunctions = {
    outcome: getOutcomeStyle,
    status: getStatusStyle,
    priority: getPriorityStyle,
    volume: getVolumeStyle,
    region: getRegionStyle
  }
  
  const styleFunc = styleFunctions[type]
  if (!styleFunc) {
    console.warn(`Unknown badge type: ${type}`)
    return { bg: '#e2e3e5', text: '#383d41', border: '#d1d3d4' }
  }
  
  return createBadge(value, styleFunc, value)
}

/**
 * Badge component for React (JSX)
 */
export function Badge({ type, value, className = '', style = {} }) {
  const badgeStyle = getBadgeStyle(type, value)
  
  return (
    <span 
      className={className}
      style={{
        ...badgeStyle,
        ...style
      }}
    >
      {value}
    </span>
  )
}