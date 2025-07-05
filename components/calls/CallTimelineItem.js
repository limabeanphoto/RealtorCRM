import React, { useState } from 'react';
import { 
  FaPhone, 
  FaClock, 
  FaUser, 
  FaBuilding, 
  FaEdit, 
  FaTasks, 
  FaChevronDown,
  FaChevronUp,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationCircle,
  FaQuestionCircle
} from 'react-icons/fa';
import theme from '../../styles/theme';
import Button from '../common/Button';
import ClickToCallButton from '../openphone/ClickToCallButton';

// Utility function to format time
const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

// Utility function to format duration
const formatDuration = (duration) => {
  if (duration >= 60) {
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return `${hours}h ${minutes}m`;
  }
  return `${duration}m`;
};

// Get outcome icon and color
const getOutcomeConfig = (outcome) => {
  const configs = {
    'Deal Closed': {
      icon: FaCheckCircle,
      color: theme.colors.success[500],
      bgColor: theme.colors.success[50],
      borderColor: theme.colors.success[200],
    },
    'Follow Up': {
      icon: FaExclamationCircle,
      color: theme.colors.warning[500],
      bgColor: theme.colors.warning[50],
      borderColor: theme.colors.warning[200],
    },
    'No Answer': {
      icon: FaQuestionCircle,
      color: theme.colors.neutral[500],
      bgColor: theme.colors.neutral[50],
      borderColor: theme.colors.neutral[200],
    },
    'Not Interested': {
      icon: FaTimesCircle,
      color: theme.colors.error[500],
      bgColor: theme.colors.error[50],
      borderColor: theme.colors.error[200],
    }
  };
  
  return configs[outcome] || {
    icon: FaQuestionCircle,
    color: theme.colors.neutral[500],
    bgColor: theme.colors.neutral[50],
    borderColor: theme.colors.neutral[200],
  };
};

// Status dropdown component
const StatusDropdown = ({ currentStatus, onStatusChange, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  const statuses = [
    'No Answer',
    'Follow Up', 
    'Deal Closed',
    'Not Interested'
  ];
  
  const handleStatusChange = async (newStatus) => {
    if (newStatus === currentStatus || updating) return;
    
    setUpdating(true);
    try {
      await onStatusChange(newStatus);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setUpdating(false);
    }
  };
  
  const currentConfig = getOutcomeConfig(currentStatus);
  
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || updating}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.375rem 0.75rem',
          borderRadius: theme.borderRadius.md,
          border: `1px solid ${currentConfig.borderColor}`,
          backgroundColor: currentConfig.bgColor,
          color: currentConfig.color,
          cursor: disabled || updating ? 'not-allowed' : 'pointer',
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.medium,
          transition: 'all 0.2s ease',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <currentConfig.icon size={12} />
        {currentStatus}
        {!disabled && (
          <FaChevronDown 
            size={10} 
            style={{ 
              transition: 'transform 0.2s ease',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
            }} 
          />
        )}
      </button>
      
      {isOpen && !disabled && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            zIndex: theme.zIndex.dropdown,
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: theme.borderRadius.md,
            boxShadow: theme.shadows.lg,
            minWidth: '150px',
            marginTop: '0.25rem',
          }}
        >
          {statuses.map((status) => {
            const config = getOutcomeConfig(status);
            return (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                disabled={updating}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: 'none',
                  backgroundColor: status === currentStatus ? config.bgColor : 'transparent',
                  color: config.color,
                  fontSize: theme.typography.fontSize.sm,
                  cursor: updating ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  ':hover': {
                    backgroundColor: config.bgColor,
                  }
                }}
                onMouseEnter={(e) => {
                  if (!updating) {
                    e.target.style.backgroundColor = config.bgColor;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!updating) {
                    e.target.style.backgroundColor = status === currentStatus ? config.bgColor : 'transparent';
                  }
                }}
              >
                <config.icon size={12} />
                {status}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default function CallTimelineItem({ 
  call, 
  onEditClick, 
  onDeleteClick,
  onAddTaskClick,
  onStatusChange,
  showFullDate = false,
  isLast = false
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const outcomeConfig = getOutcomeConfig(call.outcome);
  
  const handleStatusChange = async (newStatus) => {
    if (onStatusChange) {
      await onStatusChange(call.id, newStatus);
    }
  };
  
  return (
    <div
      className="timeline-item"
      style={{
        display: 'flex',
        position: 'relative',
        paddingBottom: isLast ? '0' : '2rem',
      }}
    >
      {/* Timeline line */}
      {!isLast && (
        <div
          style={{
            position: 'absolute',
            left: '1rem',
            top: '2.5rem',
            bottom: '0',
            width: '2px',
            backgroundColor: theme.colors.neutral[200],
          }}
        />
      )}
      
      {/* Timeline dot */}
      <div
        className="timeline-dot"
        style={{
          position: 'relative',
          width: '2rem',
          height: '2rem',
          borderRadius: '50%',
          backgroundColor: outcomeConfig.bgColor,
          border: `2px solid ${outcomeConfig.borderColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginRight: '1rem',
        }}
      >
        <outcomeConfig.icon size={12} color={outcomeConfig.color} />
      </div>
      
      {/* Content */}
      <div
        style={{
          flex: 1,
          backgroundColor: 'white',
          borderRadius: theme.borderRadius.lg,
          border: '1px solid #e5e7eb',
          boxShadow: theme.shadows.sm,
          overflow: 'hidden',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Header */}
        <div
          className="timeline-content"
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid #f3f4f6',
            cursor: 'pointer',
          }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="timeline-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            {/* Left side - Contact info */}
            <div style={{ flex: 1, minWidth: '0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                <h3 style={{ 
                  margin: 0, 
                  fontSize: theme.typography.fontSize.lg,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.neutral[900],
                  wordBreak: 'break-word'
                }}>
                  {call.contact.name}
                </h3>
                
                {call.contact.company && (
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.neutral[600],
                    wordBreak: 'break-word'
                  }}>
                    <FaBuilding size={12} />
                    {call.contact.company}
                  </span>
                )}
                
                {call.isDeal && (
                  <span style={{
                    padding: '0.125rem 0.5rem',
                    borderRadius: theme.borderRadius.full,
                    backgroundColor: theme.colors.success[100],
                    color: theme.colors.success[700],
                    fontSize: theme.typography.fontSize.xs,
                    fontWeight: theme.typography.fontWeight.medium,
                    whiteSpace: 'nowrap'
                  }}>
                    Deal
                  </span>
                )}
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.neutral[600],
                  whiteSpace: 'nowrap'
                }}>
                  <FaClock size={12} />
                  {formatTime(call.date)}
                </span>
                
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.neutral[600],
                  whiteSpace: 'nowrap'
                }}>
                  <FaPhone size={12} />
                  {formatDuration(call.duration)}
                </span>
                
                <StatusDropdown 
                  currentStatus={call.outcome}
                  onStatusChange={handleStatusChange}
                />
              </div>
            </div>
            
            {/* Right side - Actions */}
            <div className="timeline-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
              {/* Call back button */}
              <ClickToCallButton
                contactId={call.contact.id}
                phoneNumber={call.contact.phone}
                size={14}
                showNumber={false}
                compact={true}
                style={{
                  padding: '0.5rem',
                  borderRadius: theme.borderRadius.md,
                  backgroundColor: theme.colors.primary[50],
                  border: `1px solid ${theme.colors.primary[200]}`,
                }}
              />
              
              {/* Create task button */}
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddTaskClick(call);
                }}
                variant="outline"
                size="small"
                style={{
                  padding: '0.5rem',
                  minWidth: 'auto',
                  borderColor: theme.colors.primary[200],
                  color: theme.colors.primary[600],
                }}
                tooltip="Create follow-up task"
              >
                <FaTasks size={14} />
              </Button>
              
              {/* Edit button */}
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditClick(call);
                }}
                variant="outline"
                size="small"
                style={{
                  padding: '0.5rem',
                  minWidth: 'auto',
                  borderColor: theme.colors.neutral[200],
                  color: theme.colors.neutral[600],
                }}
                tooltip="Edit call"
              >
                <FaEdit size={14} />
              </Button>
              
              {/* Expand button */}
              <button
                style={{
                  padding: '0.5rem',
                  borderRadius: theme.borderRadius.md,
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: theme.colors.neutral[400],
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = theme.colors.neutral[100];
                  e.target.style.color = theme.colors.neutral[600];
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = theme.colors.neutral[400];
                }}
              >
                {isExpanded ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
              </button>
            </div>
          </div>
        </div>
        
        {/* Expanded content */}
        {isExpanded && (
          <div
            style={{
              padding: '1.25rem',
              backgroundColor: theme.colors.neutral[50],
              borderTop: '1px solid #f3f4f6',
              animation: 'expandIn 0.3s ease-out',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {/* Contact details */}
              <div>
                <h4 style={{ 
                  margin: '0 0 0.75rem 0',
                  fontSize: theme.typography.fontSize.base,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.neutral[900]
                }}>
                  Contact Details
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FaUser size={14} color={theme.colors.neutral[500]} />
                    <span style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.neutral[700] }}>
                      {call.contact.name}
                    </span>
                  </div>
                  
                  {call.contact.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FaPhone size={14} color={theme.colors.neutral[500]} />
                      <span style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.neutral[700] }}>
                        {call.contact.phone}
                      </span>
                    </div>
                  )}
                  
                  {call.contact.company && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FaBuilding size={14} color={theme.colors.neutral[500]} />
                      <span style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.neutral[700] }}>
                        {call.contact.company}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Call notes */}
              {call.notes && (
                <div>
                  <h4 style={{ 
                    margin: '0 0 0.75rem 0',
                    fontSize: theme.typography.fontSize.base,
                    fontWeight: theme.typography.fontWeight.semibold,
                    color: theme.colors.neutral[900]
                  }}>
                    Notes
                  </h4>
                  <div style={{
                    padding: '0.75rem',
                    backgroundColor: 'white',
                    borderRadius: theme.borderRadius.md,
                    border: '1px solid #e5e7eb',
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.neutral[700],
                    lineHeight: theme.typography.lineHeight.relaxed,
                  }}>
                    {call.notes}
                  </div>
                </div>
              )}
            </div>
            
            {/* Action buttons */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: '0.75rem', 
              marginTop: '1.5rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid #e5e7eb'
            }}>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('Are you sure you want to delete this call record? This cannot be undone.')) {
                    onDeleteClick(call.id);
                  }
                }}
                variant="outline"
                size="small"
                style={{
                  color: theme.colors.error[600],
                  borderColor: theme.colors.error[300],
                }}
                tooltip="Delete call"
              >
                Delete Call
              </Button>
              
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddTaskClick(call);
                }}
                variant="primary"
                size="small"
                tooltip="Create follow-up task"
              >
                Create Task
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Animation styles */}
      <style jsx>{`
        @keyframes expandIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @media (max-width: 768px) {
          .timeline-item {
            padding-left: 0.5rem;
          }
          
          .timeline-dot {
            width: 1.5rem;
            height: 1.5rem;
            margin-right: 0.75rem;
          }
          
          .timeline-content {
            padding: 0.75rem 1rem;
          }
          
          .timeline-actions {
            flex-wrap: wrap;
            gap: 0.25rem;
          }
        }
        
        @media (max-width: 480px) {
          .timeline-item {
            padding-left: 0.25rem;
          }
          
          .timeline-dot {
            width: 1.25rem;
            height: 1.25rem;
            margin-right: 0.5rem;
          }
          
          .timeline-content {
            padding: 0.5rem 0.75rem;
          }
          
          .timeline-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
          }
          
          .timeline-actions {
            width: 100%;
            justify-content: flex-end;
          }
        }
      `}</style>
    </div>
  );
}