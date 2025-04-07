import { useState } from 'react'

export default function TaskCard({ task, onStatusChange, onDelete, onEdit }) {
  const [isExpanded, setIsExpanded] = useState(false)
  
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
  
  // Get color based on priority
  const getPriorityStyle = (priority) => {
    const styles = {
      'High': { backgroundColor: '#f8d7da', color: '#721c24' },
      'Medium': { backgroundColor: '#fff3cd', color: '#856404' },
      'Low': { backgroundColor: '#d1ecf1', color: '#0c5460' }
    }
    
    return styles[priority] || {}
  }
  
  // Get color based on status
  const getStatusStyle = (status) => {
    const styles = {
      'Open': { backgroundColor: '#cce5ff', color: '#004085' },
      'In Progress': { backgroundColor: '#fff3cd', color: '#856404' },
      'Completed': { backgroundColor: '#d4edda', color: '#155724' }
    }
    
    return styles[status] || {}
  }
  
  // Calculate time remaining or overdue
  const getTimeStatus = () => {
    const now = new Date()
    const dueDate = new Date(task.dueDate)
    const diffTime = dueDate - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (task.status === 'Completed') {
      return { text: 'Completed', style: { color: '#28a745' } }
    } else if (diffTime < 0) {
      return { text: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`, style: { color: '#dc3545' } }
    } else if (diffDays === 0) {
      return { text: 'Due today', style: { color: '#ffc107' } }
    } else if (diffDays === 1) {
      return { text: 'Due tomorrow', style: { color: '#17a2b8' } }
    } else {
      return { text: `Due in ${diffDays} days`, style: { color: '#6c757d' } }
    }
  }
  
  const timeStatus = getTimeStatus()
  
  // Handle status change
  const handleStatusChange = (e) => {
    const newStatus = e.target.value
    onStatusChange(task.id, newStatus)
  }
  
  return (
    <div style={{ 
      border: '1px solid #ddd', 
      borderRadius: '8px',
      margin: '0 0 1rem 0',
      backgroundColor: task.status === 'Completed' ? '#f8f9fa' : 'white',
      opacity: task.status === 'Completed' ? 0.8 : 1
    }}>
      {/* Card Header */}
      <div style={{ 
        padding: '1rem', 
        borderBottom: isExpanded ? '1px solid #ddd' : 'none',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        cursor: 'pointer'
      }} onClick={() => setIsExpanded(!isExpanded)}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input 
              type="checkbox" 
              checked={task.status === 'Completed'}
              onChange={(e) => onStatusChange(task.id, e.target.checked ? 'Completed' : 'Open')}
              onClick={(e) => e.stopPropagation()}
              style={{ transform: 'scale(1.3)', cursor: 'pointer' }}
            />
            <h3 style={{ 
              margin: 0, 
              textDecoration: task.status === 'Completed' ? 'line-through' : 'none',
              color: task.status === 'Completed' ? '#6c757d' : 'inherit'
            }}>
              {task.title}
            </h3>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ 
              display: 'inline-block',
              padding: '0.2rem 0.5rem',
              borderRadius: '4px',
              fontSize: '0.8rem',
              ...getPriorityStyle(task.priority)
            }}>
              {task.priority}
            </span>
            
            <span style={{ 
              display: 'inline-block',
              padding: '0.2rem 0.5rem',
              borderRadius: '4px',
              fontSize: '0.8rem',
              ...getStatusStyle(task.status)
            }}>
              {task.status}
            </span>
            
            <span style={{ fontSize: '0.9rem', ...timeStatus.style }}>
              {timeStatus.text}
            </span>
          </div>
          
          {!isExpanded && task.contact && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#6c757d' }}>
              Contact: {task.contact.name}
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit(task)
            }}
            style={{
              backgroundColor: '#4a69bd',
              color: 'white',
              padding: '0.3rem 0.6rem',
              border: 'none',
              borderRadius: '4px',
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            Edit
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (confirm('Are you sure you want to delete this task?')) {
                onDelete(task.id)
              }
            }}
            style={{
              backgroundColor: '#e74c3c',
              color: 'white',
              padding: '0.3rem 0.6rem',
              border: 'none',
              borderRadius: '4px',
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            Delete
          </button>
        </div>
      </div>
      
      {/* Card Expanded Content */}
      {isExpanded && (
        <div style={{ padding: '1rem' }}>
          {task.description && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Description:</div>
              <div>{task.description}</div>
            </div>
          )}
          
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Due Date:</div>
            <div>{formatDate(task.dueDate)}</div>
          </div>
          
          {task.contact && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Contact:</div>
              <div>{task.contact.name}</div>
              {task.contact.company && <div>{task.contact.company}</div>}
              <div>{task.contact.phone}</div>
            </div>
          )}
          
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Status:</div>
            <select
              value={task.status}
              onChange={handleStatusChange}
              style={{ padding: '0.3rem' }}
            >
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Created:</div>
            <div>{formatDate(task.createdAt)}</div>
          </div>
        </div>
      )}
    </div>
  )
}