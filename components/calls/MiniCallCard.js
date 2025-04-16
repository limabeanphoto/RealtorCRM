import { useState } from 'react';
import { FaClock, FaPhone, FaAngleDown, FaAngleUp, FaTasks } from 'react-icons/fa';
import theme from '../../styles/theme';

export default function MiniCallCard({ 
  call, 
  onAddTask
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Toggle expanded state
  const toggleExpand = (e) => {
    e.stopPropagation(); // Stop propagation to prevent parent card from collapsing
    setIsExpanded(!isExpanded);
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Get color based on outcome
  const getOutcomeStyle = (outcome) => {
    const styles = {
      'Interested': { backgroundColor: '#d4edda', color: '#155724' },
      'Not Interested': { backgroundColor: '#f8d7da', color: '#721c24' },
      'Follow Up': { backgroundColor: '#fff3cd', color: '#856404' },
      'No Answer': { backgroundColor: '#e2e3e5', color: '#383d41' },
      'Left Message': { backgroundColor: '#cce5ff', color: '#004085' },
      'Wrong Number': { backgroundColor: '#f8d7da', color: '#721c24' },
      'Deal Closed': { backgroundColor: '#d4edda', color: '#155724' }
    };
    
    return styles[outcome] || { backgroundColor: '#e2e3e5', color: '#383d41' };
  };
  
  return (
    <div style={{ 
      backgroundColor: 'white', 
      padding: '0.75rem', 
      borderRadius: theme.borderRadius.sm,
      border: '1px solid #eee',
      marginBottom: '0.5rem',
      cursor: 'pointer'
    }} onClick={toggleExpand}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Call Date/Time & Duration */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.2rem',
            fontSize: '0.9rem',
            color: theme.colors.brand.text
          }}>
            <FaClock size={12} />
            {formatDate(call.date)}
          </span>
          
          <span style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.2rem',
            fontSize: '0.9rem',
            color: theme.colors.brand.text
          }}>
            <FaPhone size={12} />
            {call.duration} min
          </span>
        </div>
        
        {/* Outcome Badge and Expand Icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ 
            display: 'inline-block',
            padding: '0.2rem 0.4rem',
            borderRadius: '4px',
            fontSize: '0.75rem',
            ...getOutcomeStyle(call.outcome)
          }}>
            {call.outcome}
          </span>
          
          {call.isDeal && (
            <span style={{
              display: 'inline-block',
              padding: '0.2rem 0.4rem',
              borderRadius: '4px',
              fontSize: '0.75rem',
              backgroundColor: '#4a69bd',
              color: 'white'
            }}>
              Deal {call.dealValue ? `($${parseFloat(call.dealValue).toFixed(2)})` : ''}
            </span>
          )}
          
          <div style={{ color: theme.colors.brand.text }}>
            {isExpanded ? <FaAngleUp size={14} /> : <FaAngleDown size={14} />}
          </div>
        </div>
      </div>
      
      {/* Expanded Content */}
      {isExpanded && (
        <div style={{ 
          marginTop: '0.75rem', 
          paddingTop: '0.75rem', 
          borderTop: '1px solid #eee'
        }}>
          {/* Call Details */}
          <div style={{ marginBottom: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div><strong>Date:</strong> {formatDate(call.date)}</div>
            <div><strong>Duration:</strong> {call.duration} minutes</div>
            <div><strong>Outcome:</strong> {call.outcome}</div>
            <div><strong>Deal:</strong> {call.isDeal ? 'Yes' : 'No'}</div>
            {call.isDeal && call.dealValue && (
              <div><strong>Deal Value:</strong> ${parseFloat(call.dealValue).toFixed(2)}</div>
            )}
          </div>
          
          {/* Notes */}
          {call.notes && (
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Notes:</div>
              <div style={{ fontSize: '0.9rem' }}>{call.notes}</div>
            </div>
          )}
          
          {/* Action Button */}
          <div style={{ textAlign: 'right', marginTop: '0.75rem' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddTask(call);
              }}
              style={{
                backgroundColor: '#e58e26',
                color: 'white',
                padding: '0.25rem 0.5rem',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <FaTasks size={12} /> Create Follow-up Task
            </button>
          </div>
        </div>
      )}
    </div>
  );
}