// components/contacts/ContactRow.js
import React, { useState, useRef, useEffect } from 'react';
import { 
  FaPhone, 
  FaEnvelope, 
  FaBuilding, 
  FaUser, 
  FaEllipsisV,
  FaTasks, 
  FaEdit, 
  FaTrash, 
  FaExternalLinkAlt,
  FaAngleDown,
  FaAngleUp,
  FaHistory
} from 'react-icons/fa';
import theme from '../../styles/theme';
import MiniCallCard from '../calls/MiniCallCard';
import MiniTaskCard from '../tasks/MiniTaskCard';

// Custom hook for dropdown positioning
const useDropdownPosition = (triggerRef, isOpen) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      
      // Calculate optimal position
      let top = rect.bottom + 5;
      let left = rect.left;
      
      // If dropdown would go below viewport, position it above
      if (top + 250 > viewportHeight) { // Estimate dropdown height as 250px
        top = rect.top - 250 - 5;
      }
      
      // If dropdown would go beyond right edge, align to right edge
      if (left + 200 > viewportWidth) { // Dropdown width is ~200px
        left = rect.right - 200;
      }
      
      setPosition({ top, left });
    }
  }, [isOpen, triggerRef]);
  
  return position;
};

const ContactRow = ({
  contact,
  expanded,
  onToggleExpand,
  onEditContact,
  onLogCall,
  onAddTask,
  onDeleteContact,
  onContactUpdate,
  onReassignContact,
  onEditTask,
  onTaskStatusChange,
  currentUser,
  volumeOptions,
  regionOptions,
  isSelected,
  onSelectContact
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [volumeMenuOpen, setVolumeMenuOpen] = useState(false);
  const [regionMenuOpen, setRegionMenuOpen] = useState(false);
  
  // Refs for dropdown triggers
  const actionButtonRef = useRef(null);
  const statusButtonRef = useRef(null);
  const volumeButtonRef = useRef(null);
  const regionButtonRef = useRef(null);
  
  // Get positions for dropdowns
  const actionMenuPosition = useDropdownPosition(actionButtonRef, menuOpen);
  const statusMenuPosition = useDropdownPosition(statusButtonRef, statusMenuOpen);
  const volumeMenuPosition = useDropdownPosition(volumeButtonRef, volumeMenuOpen);
  const regionMenuPosition = useDropdownPosition(regionButtonRef, regionMenuOpen);
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuOpen && !actionButtonRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
      if (statusMenuOpen && !statusButtonRef.current?.contains(event.target)) {
        setStatusMenuOpen(false);
      }
      if (volumeMenuOpen && !volumeButtonRef.current?.contains(event.target)) {
        setVolumeMenuOpen(false);
      }
      if (regionMenuOpen && !regionButtonRef.current?.contains(event.target)) {
        setRegionMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen, statusMenuOpen, volumeMenuOpen, regionMenuOpen]);
  
  // Get assignment status style
  const getAssignmentStatusStyle = (status) => {
    switch (status) {
      case 'Open':
        return { backgroundColor: '#78e08f', color: 'white' };
      case 'Active':
        return { backgroundColor: '#4a69bd', color: 'white' };
      case 'Closed':
        return { backgroundColor: '#e74c3c', color: 'white' };
      default:
        return { backgroundColor: '#e2e3e5', color: '#383d41' };
    }
  };

  // Get volume style
  const getVolumeStyle = (volume) => {
    switch (volume) {
      case 'high':
        return { backgroundColor: '#4a69bd', color: 'white' };
      case 'medium':
        return { backgroundColor: '#78e08f', color: 'white' };
      case 'low':
        return { backgroundColor: '#e74c3c', color: 'white' };
      default:
        return { backgroundColor: '#e2e3e5', color: '#383d41' };
    }
  };

  // Get call outcome style
  const getOutcomeStyle = (outcome) => {
    const styles = {
      'Follow Up': { backgroundColor: '#fff3cd', color: '#856404' },
      'No Answer': { backgroundColor: '#e2e3e5', color: '#383d41' },
      'Deal Closed': { backgroundColor: '#d4edda', color: '#155724' },
      'Not Interested': { backgroundColor: '#f8d7da', color: '#721c24' }
    };
    
    return styles[outcome] || { backgroundColor: '#e2e3e5', color: '#383d41' };
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'No calls yet';
    
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Handle status change
  const handleStatusChange = async (newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/contacts/${contact.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ lastCallOutcome: newStatus })
      });
      
      const data = await response.json();
      
      if (data.success) {
        const updatedContact = {
          ...contact,
          lastCallOutcome: newStatus,
          status: data.data.status
        };
        
        if (onContactUpdate) {
          onContactUpdate(updatedContact);
        }
      } else {
        console.error("Error updating status:", data.message);
        alert('Error updating contact status: ' + data.message);
      }
    } catch (error) {
      console.error('Error updating contact status:', error);
      alert('Error updating contact status');
    } finally {
      setStatusMenuOpen(false);
    }
  };

  // Handle volume change
  const handleVolumeChange = async (newVolume) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/contacts/${contact.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...contact,
          volume: newVolume
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        const updatedContact = {
          ...contact,
          volume: newVolume
        };
        
        if (onContactUpdate) {
          onContactUpdate(updatedContact);
        }
      } else {
        console.error("Error updating volume:", data.message);
        alert('Error updating contact volume: ' + data.message);
      }
    } catch (error) {
      console.error('Error updating contact volume:', error);
      alert('Error updating contact volume');
    } finally {
      setVolumeMenuOpen(false);
    }
  };

  // Handle region change
  const handleRegionChange = async (newRegion) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/contacts/${contact.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...contact,
          region: newRegion
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        const updatedContact = {
          ...contact,
          region: newRegion
        };
        
        if (onContactUpdate) {
          onContactUpdate(updatedContact);
        }
      } else {
        console.error("Error updating region:", data.message);
        alert('Error updating contact region: ' + data.message);
      }
    } catch (error) {
      console.error('Error updating contact region:', error);
      alert('Error updating contact region');
    } finally {
      setRegionMenuOpen(false);
    }
  };

  // Base dropdown menu styles
  const dropdownBaseStyle = {
    position: 'fixed',
    backgroundColor: 'white',
    boxShadow: theme.shadows.lg,
    borderRadius: theme.borderRadius.sm,
    zIndex: 1000,
    border: '1px solid #eee',
    minWidth: '180px'
  };

  return (
    <>
      {/* Contact Row */}
      <div 
        style={{ 
          display: 'grid',
          gridTemplateColumns: '40px minmax(150px, 2fr) minmax(120px, 1.5fr) minmax(150px, 2fr) minmax(100px, 1fr) minmax(100px, 1fr) minmax(100px, 1fr) minmax(80px, 0.5fr)',
          padding: '1rem 1.5rem',
          backgroundColor: 'white',
          borderBottom: '1px solid #eee',
          alignItems: 'center',
          transition: 'background-color 0.2s ease',
          cursor: 'pointer',
          fontSize: '0.9rem',
          width: '100%'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = expanded ? '#f8f9fa' : 'white'}
      >
        {/* Checkbox Column */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onSelectContact(contact.id);
            }}
            style={{ cursor: 'pointer' }}
            title={`Select ${contact.name}`}
          />
        </div>
        
        {/* Name Column with profile link and assignment status badge */}
        <div 
          onClick={onToggleExpand} 
          style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: '500',
            minWidth: 0, // Allow text truncation
            overflow: 'hidden'
          }}
        >
          {expanded ? <FaAngleUp size={14} /> : <FaAngleDown size={14} />}
          
          {contact.profileLink ? (
            <a 
              href={contact.profileLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: theme.colors.brand.text,
                textDecoration: 'none',
                transition: 'color 0.2s ease',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                e.target.style.color = theme.colors.brand.primary;
                e.target.style.textDecoration = 'underline';
              }}
              onMouseLeave={(e) => {
                e.target.style.color = theme.colors.brand.text;
                e.target.style.textDecoration = 'none';
              }}
              onClick={(e) => e.stopPropagation()}
              title={`View ${contact.name}'s profile`}
            >
              {contact.name}
            </a>
          ) : (
            <span 
              title={`${contact.name} - No profile available`}
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {contact.name}
            </span>
          )}
          
          {/* Assignment status badge */}
          <span style={{
            display: 'inline-block',
            padding: '0.15rem 0.3rem',
            borderRadius: '3px',
            fontSize: '0.75rem',
            ...getAssignmentStatusStyle(contact.status),
            flexShrink: 0
          }}
          title={`Assignment status: ${contact.status}`}>
            {contact.status}
          </span>
        </div>
        
        {/* Company */}
        <div 
          onClick={onToggleExpand} 
          title={contact.company || 'No company'}
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {contact.company || '-'}
        </div>
        
        {/* Contact Info */}
        <div onClick={onToggleExpand}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.4rem', 
            marginBottom: '0.2rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }} 
          title={`Phone: ${contact.phone}`}>
            <FaPhone size={12} color={theme.colors.brand.text} />
            {contact.phone}
          </div>
          {contact.email && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.4rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }} 
            title={`Email: ${contact.email}`}>
              <FaEnvelope size={12} color={theme.colors.brand.text} />
              {contact.email}
            </div>
          )}
        </div>
        
        {/* Volume */}
        <div style={{ position: 'relative' }}>
          <div
            ref={volumeButtonRef}
            onClick={(e) => {
              e.stopPropagation();
              setVolumeMenuOpen(!volumeMenuOpen);
              setRegionMenuOpen(false);
              setStatusMenuOpen(false);
              setMenuOpen(false);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '90px',
              padding: '0.3rem 0.5rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              textAlign: 'center',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              ...(contact.volume ? getVolumeStyle(contact.volume) : { border: '1px dashed #ccc', fontSize: '0.8rem' })
            }}
            title={`Volume: ${contact.volume ? 
              volumeOptions.find(o => o.value === contact.volume)?.label || contact.volume : 
              'Not set'} - Click to change`}
          >
            {contact.volume ? 
              volumeOptions.find(o => o.value === contact.volume)?.label || 'Unknown' : 
              'Set Volume'}
          </div>
        </div>
        
        {/* Region */}
        <div style={{ position: 'relative' }}>
          <div
            ref={regionButtonRef}
            onClick={(e) => {
              e.stopPropagation();
              setRegionMenuOpen(!regionMenuOpen);
              setVolumeMenuOpen(false);
              setStatusMenuOpen(false);
              setMenuOpen(false);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '90px',
              padding: '0.3rem 0.5rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              border: '1px solid #eee',
              backgroundColor: '#f8f9fa',
              textAlign: 'center',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
            title={`Region: ${contact.region ? 
              regionOptions.find(o => o.value === contact.region)?.label || contact.region : 
              'Not set'} - Click to change`}
          >
            {contact.region ? 
              regionOptions.find(o => o.value === contact.region)?.label || contact.region : 
              'Set Region'}
          </div>
        </div>
        
      {/* Call Outcome Status */}
      <div style={{ position: 'relative' }}>
          <div
            ref={statusButtonRef}
            onClick={(e) => {
              e.stopPropagation();
              setStatusMenuOpen(!statusMenuOpen);
              setRegionMenuOpen(false);
              setVolumeMenuOpen(false);
              setMenuOpen(false);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '90px',
              padding: '0.3rem 0.5rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              textAlign: 'center',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              ...(contact.lastCallOutcome ? 
                getOutcomeStyle(contact.lastCallOutcome) : 
                { border: '1px dashed #ccc', color: '#666', fontSize: '0.8rem' })
            }}
            title={`Call outcome: ${contact.lastCallOutcome || 'No calls yet'} - Click to change`}
          >
            {contact.lastCallOutcome || 'Set Status'}
          </div>
        </div>
        
        {/* Actions Menu */}
        <div style={{ textAlign: 'center', position: 'relative' }}>
          <button
            ref={actionButtonRef}
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
              setStatusMenuOpen(false);
              setRegionMenuOpen(false);
              setVolumeMenuOpen(false);
            }}
            style={{
              background: 'none',
              border: '1px solid #eee',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '75px',
              height: '32px',
              borderRadius: '4px',
              transition: 'all 0.2s ease',
              gap: '0.3rem',
              fontSize: '0.8rem',
              color: theme.colors.brand.text
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f0f0f0';
              e.currentTarget.style.borderColor = '#ddd';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = '#eee';
            }}
            title="More actions"
          >
            Actions <FaEllipsisV size={10} />
          </button>
        </div>
      </div>

      {/* Dropdowns rendered in portals at calculated positions */}
      {menuOpen && (
        <div style={{
          ...dropdownBaseStyle,
          top: actionMenuPosition.top,
          left: actionMenuPosition.left
        }}>
          <div
            onClick={() => {
              setMenuOpen(false);
              onEditContact(contact);
            }}
            style={{
              padding: '0.75rem 1rem',
              cursor: 'pointer',
              borderBottom: '1px solid #eee',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            Edit Contact
          </div>
          
          <div
            onClick={() => {
              setMenuOpen(false);
              onLogCall(contact);
            }}
            style={{
              padding: '0.75rem 1rem',
              cursor: 'pointer',
              borderBottom: '1px solid #eee',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            Log Call
          </div>
          
          <div
            onClick={() => {
              setMenuOpen(false);
              onAddTask(contact);
            }}
            style={{
              padding: '0.75rem 1rem',
              cursor: 'pointer',
              borderBottom: '1px solid #eee',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            Add Task
          </div>
          
          {currentUser && currentUser.role === 'admin' && (
            <div
              onClick={() => {
                setMenuOpen(false);
                onReassignContact(contact);
              }}
              style={{
                padding: '0.75rem 1rem',
                cursor: 'pointer',
                borderBottom: '1px solid #eee',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
            >
              Reassign Contact
            </div>
          )}
          
          <div
            onClick={() => {
              setMenuOpen(false);
              if (window.confirm('Are you sure you want to delete this contact? This cannot be undone.')) {
                onDeleteContact(contact.id);
              }
            }}
            style={{
              padding: '0.75rem 1rem',
              cursor: 'pointer',
              color: '#e74c3c',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            Delete Contact
          </div>
        </div>
      )}
      
      {/* Status dropdown */}
      {statusMenuOpen && (
        <div style={{
          ...dropdownBaseStyle,
          top: statusMenuPosition.top,
          left: statusMenuPosition.left
        }}>
          {['Follow Up', 'Deal Closed', 'No Answer', 'Not Interested'].map(status => (
            <div
              key={status}
              onClick={() => handleStatusChange(status)}
              style={{
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                backgroundColor: status === contact.lastCallOutcome ? '#f0f0f0' : 'white',
                borderBottom: status === 'Not Interested' ? 'none' : '1px solid #eee',
                ...getOutcomeStyle(status),
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = status === contact.lastCallOutcome ? '#f0f0f0' : 'white'}
            >
              {status}
            </div>
          ))}
        </div>
      )}
      
      {/* Volume dropdown */}
      {volumeMenuOpen && (
        <div style={{
          ...dropdownBaseStyle,
          top: volumeMenuPosition.top,
          left: volumeMenuPosition.left
        }}>
          {volumeOptions.map((option, index) => (
            <div
              key={option.value}
              onClick={() => handleVolumeChange(option.value)}
              style={{
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                backgroundColor: option.value === contact.volume ? '#f0f0f0' : 'white',
                borderBottom: index === volumeOptions.length - 1 ? 'none' : '1px solid #eee',
                ...getVolumeStyle(option.value),
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = option.value === contact.volume ? '#f0f0f0' : 'white'}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
      
      {/* Region dropdown */}
      {regionMenuOpen && (
        <div style={{
          ...dropdownBaseStyle,
          top: regionMenuPosition.top,
          left: regionMenuPosition.left
        }}>
          {regionOptions.map((option, index) => (
            <div
              key={option.value}
              onClick={() => handleRegionChange(option.value)}
              style={{
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                backgroundColor: option.value === contact.region ? '#f0f0f0' : 'white',
                borderBottom: index === regionOptions.length - 1 ? 'none' : '1px solid #eee',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = option.value === contact.region ? '#f0f0f0' : 'white'}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}

      {/* Expanded View */}
      {expanded && (
        <div style={{ 
          padding: '1.5rem',
          backgroundColor: '#f8f9fa',
          borderBottom: '1px solid #eee'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* Left Column */}
            <div>
              <h3 style={{ marginTop: 0, marginBottom: '1rem', color: theme.colors.brand.primary }}>
                Contact Details
              </h3>
              
              {/* Details Card */}
              <div style={{ 
                backgroundColor: 'white',
                padding: '1rem',
                borderRadius: theme.borderRadius.sm,
                border: '1px solid #eee',
                marginBottom: '1.5rem'
              }}>
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '0.25rem', fontSize: '0.9rem', color: theme.colors.brand.text }}>
                    Full Name
                  </div>
                  <div>{contact.name}</div>
                </div>
                
                {contact.company && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '0.25rem', fontSize: '0.9rem', color: theme.colors.brand.text }}>
                      Company
                    </div>
                    <div>{contact.company}</div>
                  </div>
                )}
                
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '0.25rem', fontSize: '0.9rem', color: theme.colors.brand.text }}>
                    Phone
                  </div>
                  <div>{contact.phone}</div>
                </div>
                
                {contact.email && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '0.25rem', fontSize: '0.9rem', color: theme.colors.brand.text }}>
                      Email
                    </div>
                    <div>{contact.email}</div>
                  </div>
                )}
                
                {contact.profileLink && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '0.25rem', fontSize: '0.9rem', color: theme.colors.brand.text }}>
                      Profile
                    </div>
                    <div>
                      <a 
                        href={contact.profileLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ 
                          display: 'inline-flex',
                          alignItems: 'center',
                          color: theme.colors.brand.primary,
                          gap: '0.25rem'
                        }}
                      >
                        <FaExternalLinkAlt size={12} />
                        View Profile
                      </a>
                    </div>
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '0.25rem', fontSize: '0.9rem', color: theme.colors.brand.text }}>
                      Status
                    </div>
                    <div>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        ...getAssignmentStatusStyle(contact.status)
                      }}>
                        {contact.status}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '0.25rem', fontSize: '0.9rem', color: theme.colors.brand.text }}>
                      Volume
                    </div>
                    <div>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        ...(contact.volume ? getVolumeStyle(contact.volume) : { border: '1px dashed #ccc', color: '#666' })
                      }}>
                        {contact.volume ? 
                          volumeOptions.find(o => o.value === contact.volume)?.label || 'Unknown' : 
                          'Not Set'}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '0.25rem', fontSize: '0.9rem', color: theme.colors.brand.text }}>
                      Region
                    </div>
                    <div>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        border: '1px solid #eee',
                        backgroundColor: contact.region ? '#f8f9fa' : 'transparent'
                      }}>
                        {contact.region ? 
                          regionOptions.find(o => o.value === contact.region)?.label || contact.region : 
                          'Not Set'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Notes Section */}
              {contact.notes && (
                <div>
                  <h4 style={{ marginTop: 0, marginBottom: '0.5rem', color: theme.colors.brand.text }}>
                    Notes
                  </h4>
                  <div style={{ 
                    backgroundColor: 'white',
                    padding: '1rem',
                    borderRadius: theme.borderRadius.sm,
                    border: '1px solid #eee'
                  }}>
                    {contact.notes}
                  </div>
                </div>
              )}
            </div>
            
            {/* Right Column */}
            <div>
              <h3 style={{ marginTop: 0, marginBottom: '1rem', color: theme.colors.brand.primary }}>
                Recent Activity
              </h3>
              
              {/* Call History */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ marginTop: 0, marginBottom: '0.5rem', color: theme.colors.brand.text, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FaHistory size={14} />
                  Call History
                </h4>
                <div style={{ 
                  backgroundColor: 'white',
                  padding: '1rem',
                  borderRadius: theme.borderRadius.sm,
                  border: '1px solid #eee'
                }}>
                  {contact.calls && contact.calls.length > 0 ? (
                    <div>
                      {contact.calls.map(call => (
                        <MiniCallCard 
                          key={call.id}
                          call={call}
                          onAddTask={() => onAddTask(contact, call)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div>
                      <p style={{ margin: '0 0 0.5rem 0', color: theme.colors.brand.text }}>No calls recorded yet</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Tasks Section */}
              <div>
                <h4 style={{ marginTop: 0, marginBottom: '0.5rem', color: theme.colors.brand.text, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FaTasks size={14} />
                  Tasks ({contact.tasks && contact.tasks.length > 0 ? contact.tasks.length : '0'})
                </h4>
                <div style={{ 
                  backgroundColor: 'white',
                  padding: '1rem',
                  borderRadius: theme.borderRadius.sm,
                  border: '1px solid #eee'
                }}>
                  {contact.tasks && contact.tasks.length > 0 ? (
                    <div>
                      {contact.tasks.map(task => (
                        <MiniTaskCard 
                          key={task.id}
                          task={task}
                          onStatusChange={onTaskStatusChange}
                          onEdit={onEditTask}
                        />
                      ))}
                    </div>
                  ) : (
                    <p style={{ margin: '0 0 0.5rem 0', color: theme.colors.brand.text }}>
                      No tasks associated with this contact
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ContactRow;