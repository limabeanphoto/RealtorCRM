import { useState } from 'react';
import { FaClock, FaPhone, FaAngleDown, FaAngleUp, FaTasks } from 'react-icons/fa';
import theme from '../../styles/theme';
import Button from '../common/Button';
import { getOutcomeStyle } from '../../utils/badgeUtils';

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
  
  // Using getOutcomeStyle from badgeUtils.js for consistency
  
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
            backgroundColor: getOutcomeStyle(call.outcome).bg,
            color: getOutcomeStyle(call.outcome).text
          }}>
            {call.outcome}
          </span>
          
          {call.isDeal && (
            <span style={{
              display: 'inline-block',
              padding: '0.2rem 0.4rem',
              borderRadius: '4px',
              fontSize: '0.75rem',
              backgroundColor: theme.colors.brand.secondary,
              color: 'white'
            }}>
              Deal
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
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onAddTask(call);
              }}
              variant="secondary"
              size="small"
              tooltip="Create a follow-up task based on this call"
            >
              <FaTasks size={12} style={{ marginRight: '0.25rem' }} /> Create Follow-up Task
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}