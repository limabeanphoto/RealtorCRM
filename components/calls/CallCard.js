import { useState, useEffect } from 'react';
import { FaUser, FaBuilding, FaClock, FaPhone, FaEdit, FaAngleDown, FaAngleUp, FaTrash, FaClipboard, FaTasks } from 'react-icons/fa';
import theme from '../../styles/theme';
import MiniContactCard from '../contacts/MiniContactCard';

export default function CallCard({ 
  call, 
  onEditClick, 
  onDeleteClick,
  onAddTaskClick
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isContactExpanded, setIsContactExpanded] = useState(false);
  
  // Toggle expanded state
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  // Toggle contact expanded state
  const toggleContactExpand = (e) => {
    e.stopPropagation(); // Prevent main card from toggling
    setIsContactExpanded(!isContactExpanded);
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
      border: '1px solid #e2e8f0', 
      borderRadius: theme.borderRadius.md,
      margin: '0 0 1rem 0',
      backgroundColor: 'white',
      boxShadow: theme.shadows.sm,
      overflow: 'hidden',
      transition: 'box-shadow 0.2s ease',
      ':hover': {
        boxShadow: theme.shadows.md
      }
    }}>
      {/* Card Header - Always Visible */}
      <div style={{ 
        padding: '1rem', 
        borderBottom: isExpanded ? '1px solid #ddd' : 'none',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        cursor: 'pointer'
      }} onClick={toggleExpand}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <h3 style={{ 
              margin: 0, 
              color: theme.colors.brand.primary
            }}>
              {call.contact.name}
            </h3>
            
            <span style={{ 
              display: 'inline-block',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              fontSize: '0.8rem',
              ...getOutcomeStyle(call.outcome)
            }}>
              {call.outcome}
            </span>
            
            {call.isDeal && (
              <span style={{
                display: 'inline-block',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                fontSize: '0.8rem',
                backgroundColor: '#4a69bd',
                color: 'white'
              }}>
                Deal {call.dealValue ? `($${parseFloat(call.dealValue).toFixed(2)})` : ''}
              </span>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
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
            
            {call.contact.company && (
              <span style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem',
                fontSize: '0.9rem', 
                color: theme.colors.brand.text
              }}>
                <FaBuilding size={12} />
                {call.contact.company}
              </span>
            )}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {/* Square icon-only edit button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditClick(call);
            }}
            style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.colors.brand.primary,
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            <FaEdit size={14} />
          </button>
          
          {/* Square icon-only add task button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddTaskClick(call);
            }}
            style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.colors.brand.primary,
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            <FaTasks size={14} />
          </button>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            color: theme.colors.brand.text,
            marginLeft: '0.5rem'
          }}>
            {isExpanded ? <FaAngleUp /> : <FaAngleDown />}
          </div>
        </div>
      </div>
      
      {/* Card Expanded Content */}
      {isExpanded && (
        <div style={{ padding: '1rem', backgroundColor: '#f9f9fa' }}>
          {/* Contact Information - Now Expandable */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div 
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.5rem',
                cursor: 'pointer'
              }}
              onClick={toggleContactExpand}
            >
              <h4 style={{ marginTop: 0, marginBottom: 0 }}>Contact Information</h4>
              <div style={{ color: theme.colors.brand.text }}>
                {isContactExpanded ? <FaAngleUp /> : <FaAngleDown />}
              </div>
            </div>
            
            {isContactExpanded ? (
              <MiniContactCard 
                contact={call.contact}
                isExpanded={true}
              />
            ) : (
              <div style={{ 
                backgroundColor: 'white', 
                padding: '0.75rem', 
                borderRadius: theme.borderRadius.sm,
                border: '1px solid #eee'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <div><strong>Name:</strong> {call.contact.name}</div>
                  {call.contact.company && <div><strong>Company:</strong> {call.contact.company}</div>}
                  <div><strong>Phone:</strong> {call.contact.phone}</div>
                  {call.contact.email && <div><strong>Email:</strong> {call.contact.email}</div>}
                </div>
              </div>
            )}
          </div>
          
          {/* Call Details */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Call Details</h4>
            <div style={{ 
              backgroundColor: 'white', 
              padding: '0.75rem', 
              borderRadius: theme.borderRadius.sm,
              border: '1px solid #eee'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div><strong>Date/Time:</strong> {formatDate(call.date)}</div>
                <div><strong>Duration:</strong> {call.duration} minutes</div>
                <div><strong>Outcome:</strong> {call.outcome}</div>
                <div><strong>Deal:</strong> {call.isDeal ? 'Yes' : 'No'}</div>
                {call.isDeal && call.dealValue && (
                  <div><strong>Deal Value:</strong> ${parseFloat(call.dealValue).toFixed(2)}</div>
                )}
              </div>
            </div>
          </div>
          
          {/* Notes Section */}
          {call.notes && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Notes</h4>
              <div style={{ 
                backgroundColor: 'white', 
                padding: '0.75rem', 
                borderRadius: theme.borderRadius.sm,
                border: '1px solid #eee'
              }}>
                {call.notes}
              </div>
            </div>
          )}
          
          {/* Action Buttons Section */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddTaskClick(call);
              }}
              style={{
                backgroundColor: theme.colors.brand.primary,
                color: 'white',
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              <FaTasks size={14} /> Create Follow-up Task
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('Are you sure you want to delete this call record? This cannot be undone.')) {
                  onDeleteClick(call.id);
                }
              }}
              style={{
                backgroundColor: '#e74c3c',
                color: 'white',
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              <FaTrash size={14} /> Delete Call
            </button>
          </div>
        </div>
      )}
    </div>
  );
}