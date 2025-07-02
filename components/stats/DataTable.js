import { useState } from 'react'

export default function DataTable({ data, type }) {
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'ascending'
  })

  // Format date for display
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  // Get columns based on data type
  const getColumns = () => {
    if (!data || data.length === 0) return []

    switch (type) {
      case 'calls':
        return [
          { key: 'date', label: 'Date/Time' },
          { key: 'contactName', label: 'Contact' },
          { key: 'duration', label: 'Duration (min)' },
          { key: 'outcome', label: 'Outcome' },
          { key: 'isDeal', label: 'Deal' },
          { key: 'dealValue', label: 'Deal Value' },
          { key: 'notes', label: 'Notes' }
        ]
      case 'deals':
        return [
          { key: 'date', label: 'Date/Time' },
          { key: 'contactName', label: 'Contact' },
          { key: 'value', label: 'Deal Value' },
          { key: 'notes', label: 'Notes' }
        ]
      case 'contacts':
        return [
          { key: 'createdAt', label: 'Date Added' },
          { key: 'name', label: 'Name' },
          { key: 'company', label: 'Company' },
          { key: 'phone', label: 'Phone' },
          { key: 'email', label: 'Email' }
        ]
      case 'tasks':
        return [
          { key: 'createdAt', label: 'Created' },
          { key: 'title', label: 'Title' },
          { key: 'dueDate', label: 'Due Date' },
          { key: 'status', label: 'Status' },
          { key: 'priority', label: 'Priority' },
          { key: 'contactName', label: 'Contact' }
        ]
      default:
        return Object.keys(data[0]).map(key => ({
          key,
          label: key.charAt(0).toUpperCase() + key.slice(1)
        }))
    }
  }

  // Handle sorting
  const handleSort = (key) => {
    let direction = 'ascending'
    
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending'
    }
    
    setSortConfig({ key, direction })
  }

  // Sort data
  const sortedData = () => {
    if (!sortConfig.key) return data

    return [...data].sort((a, b) => {
      if (a[sortConfig.key] === null) return 1
      if (b[sortConfig.key] === null) return -1
      
      // Date comparison
      if (a[sortConfig.key] instanceof Date || 
          (typeof a[sortConfig.key] === 'string' && a[sortConfig.key].includes('-'))) {
        const dateA = new Date(a[sortConfig.key])
        const dateB = new Date(b[sortConfig.key])
        
        if (sortConfig.direction === 'ascending') {
          return dateA - dateB
        }
        return dateB - dateA
      }
      
      // String comparison
      if (typeof a[sortConfig.key] === 'string') {
        if (sortConfig.direction === 'ascending') {
          return a[sortConfig.key].localeCompare(b[sortConfig.key])
        }
        return b[sortConfig.key].localeCompare(a[sortConfig.key])
      }
      
      // Number comparison
      if (sortConfig.direction === 'ascending') {
        return a[sortConfig.key] - b[sortConfig.key]
      }
      return b[sortConfig.key] - a[sortConfig.key]
    })
  }

  // Get cell content based on column key and row data
  const getCellContent = (row, column) => {
    if (column.key === 'date' || column.key === 'createdAt' || column.key === 'dueDate') {
      return formatDate(row[column.key])
    }
    
    if (column.key === 'outcome') {
      return (
        <span style={{ 
          display: 'inline-block',
          padding: '0.25rem 0.5rem',
          borderRadius: '4px',
          fontSize: '0.8rem',
          backgroundColor: getOutcomeColor(row[column.key]).bg,
          color: getOutcomeColor(row[column.key]).text
        }}>
          {row[column.key]}
        </span>
      )
    }
    
    if (column.key === 'status') {
        return (
          <span style={{ 
            display: 'inline-block',
            padding: '0.25rem 0.5rem',
            borderRadius: '4px',
            fontSize: '0.8rem',
            backgroundColor: getStatusColor(row[column.key]).bg,
            color: getStatusColor(row[column.key]).text
          }}>
            {row[column.key]}
          </span>
        )
      }
      
      if (column.key === 'priority') {
        return (
          <span style={{ 
            display: 'inline-block',
            padding: '0.25rem 0.5rem',
            borderRadius: '4px',
            fontSize: '0.8rem',
            backgroundColor: getPriorityColor(row[column.key]).bg,
            color: getPriorityColor(row[column.key]).text
          }}>
            {row[column.key]}
          </span>
        )
      }
      
      if (column.key === 'isDeal') {
        return row[column.key] ? 'Yes' : 'No'
      }
      
      if (column.key === 'dealValue' && row[column.key]) {
        return `$${parseFloat(row[column.key]).toFixed(2)}`
      }
      
      return row[column.key] || '-'
    }
  
    // Get color based on call outcome
    const getOutcomeColor = (outcome) => {
      const colors = {
        'Interested': { bg: '#d4edda', text: '#155724' },
        'Not Interested': { bg: '#f8d7da', text: '#721c24' },
        'Follow Up': { bg: '#fff3cd', text: '#856404' },
        'No Answer': { bg: '#e2e3e5', text: '#383d41' },
        'Left Message': { bg: '#cce5ff', text: '#004085' },
        'Wrong Number': { bg: '#f8d7da', text: '#721c24' },
        'Deal Closed': { bg: '#d4edda', text: '#155724' }
      }
      
      return colors[outcome] || { bg: '#e2e3e5', text: '#383d41' }
    }
  
    // Get color based on task status
    const getStatusColor = (status) => {
      const colors = {
        'Open': { bg: '#cce5ff', text: '#004085' },
        'In Progress': { bg: '#fff3cd', text: '#856404' },
        'Completed': { bg: '#d4edda', text: '#155724' }
      }
      
      return colors[status] || { bg: '#e2e3e5', text: '#383d41' }
    }
  
    // Get color based on priority
    const getPriorityColor = (priority) => {
      const colors = {
        'High': { bg: '#f8d7da', text: '#721c24' },
        'Medium': { bg: '#fff3cd', text: '#856404' },
        'Low': { bg: '#d1ecf1', text: '#0c5460' }
      }
      
      return colors[priority] || { bg: '#e2e3e5', text: '#383d41' }
    }
  
    // Export data as CSV
    const exportCSV = (data, filename) => {
      if (data.length === 0) return
      
      // Get headers from first object
      const headers = Object.keys(data[0])
      
      // Create CSV content
      let csvContent = headers.join(',') + '\n'
      
      data.forEach(item => {
        const row = headers.map(header => {
          const value = item[header]
          // Handle different types of values
          if (value === null || value === undefined) return ''
          if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`
          if (value instanceof Date) return value.toISOString()
          return value
        }).join(',')
        csvContent += row + '\n'
      })
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `${filename}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  
    // Export data as Excel - Using CSV format for security
    const exportExcel = (data, filename) => {
      if (data.length === 0) return
      
      // For security, we'll export as CSV instead of Excel
      exportCSV(data, filename)
    }
  
    const columns = getColumns()
    
    if (!data || data.length === 0) {
      return <p>No data available for the selected time period.</p>
    }
  
    return (
      <div>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <button
            onClick={() => exportCSV(data, `${type}-export`)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Export as CSV
          </button>
          <button
            onClick={() => exportExcel(data, `${type}-export`)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Export CSV (Excel Compatible)
          </button>
        </div>
  
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th 
                    key={column.key}
                    onClick={() => handleSort(column.key)}
                    style={{ 
                      textAlign: 'left', 
                      padding: '0.75rem 0.5rem', 
                      backgroundColor: '#f8f9fa',
                      borderBottom: '2px solid #dee2e6',
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {column.label}
                      {sortConfig.key === column.key && (
                        <span style={{ marginLeft: '0.5rem' }}>
                          {sortConfig.direction === 'ascending' ? '▲' : '▼'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedData().map((row, rowIndex) => (
                <tr 
                  key={rowIndex}
                  style={{ 
                    backgroundColor: rowIndex % 2 === 0 ? 'white' : '#f8f9fa' 
                  }}
                >
                  {columns.map((column) => (
                    <td 
                      key={column.key}
                      style={{ 
                        padding: '0.75rem 0.5rem', 
                        borderBottom: '1px solid #dee2e6',
                        whiteSpace: column.key === 'notes' ? 'normal' : 'nowrap'
                      }}
                    >
                      {getCellContent(row, column)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }