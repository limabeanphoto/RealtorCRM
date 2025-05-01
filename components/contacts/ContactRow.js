// Fixed ContactRow.js - Part 1
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
  FaHistory
} from 'react-icons/fa';
import theme from '../../styles/theme';
import MiniCallCard from '../calls/MiniCallCard';
import MiniTaskCard from '../tasks/MiniTaskCard';

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
  onSelectContact,
  getOwnerDisplay
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

  // FIXED: Handle status change
  const handleStatusChange = async (newStatus) => {
    try {
      setStatusMenuOpen(false); // Close the menu immediately to improve UX
      
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/contacts/${contact.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          lastCallOutcome: newStatus 
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Create a properly updated contact object
        const updatedContact = {
          ...contact,
          lastCallOutcome: newStatus,
          status: data.data.status // Make sure to use the status returned from the API
        };
        
        // Call the parent component's update function
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
    }
  };

  // FIXED: Handle volume change
  const handleVolumeChange = async (newVolume) => {
    try {
      setVolumeMenuOpen(false); // Close the menu immediately to improve UX
      
      const token = localStorage.getItem('token');
      
      // Only send the necessary data for the update
      const response = await fetch(`/api/contacts/${contact.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          // Include required fields
          name: contact.name,
          phone: contact.phone,
          // Include the field we want to update
          volume: newVolume
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Create a properly updated contact object
        const updatedContact = {
          ...contact,
          volume: newVolume
        };
        
        // Call the parent component's update function
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
    }
  };

  // FIXED: Handle region change
  const handleRegionChange = async (newRegion) => {
    try {
      setRegionMenuOpen(false); // Close the menu immediately to improve UX
      
      const token = localStorage.getItem('token');
      
      // Only send the necessary data for the update
      const response = await fetch(`/api/contacts/${contact.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          // Include required fields
          name: contact.name,
          phone: contact.phone,
          // Include the field we want to update
          region: newRegion
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Create a properly updated contact object
        const updatedContact = {
          ...contact,
          region: newRegion
        };
        
        // Call the parent component's update function
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
      <div 
        style={{ 
          display: 'grid',
          // Updated grid layout to adjust spacing between Owner column and menu button
          gridTemplateColumns: '40px minmax(150px, 2fr) minmax(120px, 1.5fr) minmax(150px, 2fr) minmax(100px, 1fr) minmax(100px, 1fr) minmax(100px, 1fr) minmax(120px, 1.5fr) 30px',
          padding: '1rem 1.5rem',
          backgroundColor: 'white',
          borderBottom: '1px solid #eee',
          alignItems: 'center',
          transition: 'background-color 0.2s ease',
          cursor: 'pointer',
          // Increased font size for better readability
          fontSize: '0.95rem',
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
        
        {/* Name Column - Removed expand arrow and status badge */}
        <div 
          onClick={onToggleExpand} 
          style={{ 
            display: 'flex',
            alignItems: 'center',
            fontWeight: '500',
            minWidth: 0,
            overflow: 'hidden'
          }}
        >
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

        {/* FIXED: Volume Button */}
        <div style={{ position: 'relative' }}>
          <div
            ref={volumeButtonRef}
            onClick={(e) => {
              e.stopPropagation(); // Stop event propagation
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
        
        {/* FIXED: Region Button */}
        <div style={{ position: 'relative' }}>
          <div
            ref={regionButtonRef}
            onClick={(e) => {
              e.stopPropagation(); // Stop event propagation
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
        
        {/* FIXED: Status Button */}
        <div style={{ position: 'relative' }}>
          <div
            ref={statusButtonRef}
            onClick={(e) => {
              e.stopPropagation(); // Stop event propagation
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
        
        {/* Owner Column */}
        <div 
          onClick={onToggleExpand}
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: contact.status === 'Open' ? theme.colors.brand.primary : theme.colors.brand.text,
            fontWeight: contact.status === 'Open' ? '500' : 'normal'
          }}
          title={getOwnerDisplay(contact)}
        >
          {getOwnerDisplay(contact)}
        </div>

        {/* Actions Menu - Adjusted width for better spacing */}
        <div style={{ 
          textAlign: 'center', 
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
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
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              borderRadius: '4px',
              transition: 'all 0.2s ease',
              color: theme.colors.brand.text
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f0f0f0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="More actions"
          >
            <FaEllipsisV size={14} />
          </button>
        </div>
      </div>

      {/* FIXED: Action Menu Dropdown */}
      {menuOpen && (
        <div style={{
          position: 'absolute',
          top: actionButtonRef.current?.getBoundingClientRect().bottom + 5 || 0,
          right: 10,
          backgroundColor: 'white',
          boxShadow: theme.shadows.lg,
          borderRadius: theme.borderRadius.sm,
          zIndex: 1000,
          border: '1px solid #eee',
          minWidth: '180px'
        }}>
          <div
            onClick={(e) => {
              e.stopPropagation();
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
            onClick={(e) => {
              e.stopPropagation();
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
            onClick={(e) => {
              e.stopPropagation();
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
              onClick={(e) => {
                e.stopPropagation();
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
            onClick={(e) => {
              e.stopPropagation();
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
      
      {/* FIXED: Status Dropdown */}
      {statusMenuOpen && (
        <div style={{
          position: 'absolute',
          top: statusButtonRef.current?.getBoundingClientRect().bottom + 5 || 0,
          left: statusButtonRef.current?.getBoundingClientRect().left || 0,
          backgroundColor: 'white',
          boxShadow: theme.shadows.lg,
          borderRadius: theme.borderRadius.sm,
          zIndex: 1000,
          border: '1px solid #eee',
          minWidth: '180px'
        }}>
          {['Follow Up', 'Deal Closed', 'No Answer', 'Not Interested'].map(status => (
            <div
              key={status}
              onClick={(e) => {
                e.stopPropagation(); // Stop event propagation
                handleStatusChange(status);
              }}
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

{/* FIXED: Volume Dropdown */}
{volumeMenuOpen && (
  <div style={{
    position: 'absolute',
    top: volumeButtonRef.current?.getBoundingClientRect().bottom + 5 || 0,
    left: volumeButtonRef.current?.getBoundingClientRect().left || 0,
    backgroundColor: 'white',
    boxShadow: theme.shadows.lg,
    borderRadius: theme.borderRadius.sm,
    zIndex: 1000,
    border: '1px solid #eee',
    minWidth: '180px'
  }}>
    {volumeOptions.map((option, index) => (
      <div
        key={option.value}
        onClick={(e) => {
          e.stopPropagation(); // Stop event propagation
          handleVolumeChange(option.value);
        }}
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

{/* FIXED: Region Dropdown */}
{regionMenuOpen && (
  <div style={{
    position: 'absolute',
    top: regionButtonRef.current?.getBoundingClientRect().bottom + 5 || 0,
    left: regionButtonRef.current?.getBoundingClientRect().left || 0,
    backgroundColor: 'white',
    boxShadow: theme.shadows.lg,
    borderRadius: theme.borderRadius.sm,
    zIndex: 1000,
    border: '1px solid #eee',
    minWidth: '180px'
  }}>
    {regionOptions.map((option, index) => (
      <div
        key={option.value}
        onClick={(e) => {
          e.stopPropagation(); // Stop event propagation
          handleRegionChange(option.value);
        }}
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
          {/* Contact details content */}
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
          
          {/* Additional contact details... */}
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
        {/* Activity sections... */}
      </div>
    </div>
  </div>
)}
</>
);
};

export default ContactRow;