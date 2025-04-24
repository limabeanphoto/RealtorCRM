import React, { useState } from 'react';
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
import Button from '../common/Button';

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
  currentUser,
  volumeOptions,
  regionOptions
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [volumeMenuOpen, setVolumeMenuOpen] = useState(false);
  const [regionMenuOpen, setRegionMenuOpen] = useState(false);
  
  // Get status style
  const getStatusStyle = (status) => {
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

  // Get outcome style
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
        // Update the local contact data
        const updatedContact = {
          ...contact,
          lastCallOutcome: newStatus,
          status: data.data.status
        };
        
        // Call the update function from props
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
        // Update the local contact data
        const updatedContact = {
          ...contact,
          volume: newVolume
        };
        
        // Call the update function from props
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
        // Update the local contact data
        const updatedContact = {
          ...contact,
          region: newRegion
        };
        
        // Call the update function from props
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

  // Get the profile link display
  const getProfileDisplay = () => {
    if (!contact.profileLink) return null;
    
    const url = new URL(contact.profileLink);
    const domain = url.hostname.replace('www.', '');
    
    return (
      <a 
        href={contact.profileLink} 
        target="_blank" 
        rel="noopener noreferrer"
        style={{ 
          display: 'inline-flex',
          alignItems: 'center',
          color: theme.colors.brand.primary,
          textDecoration: 'none',
          fontSize: '0.8rem',
          gap: '0.25rem'
        }}
      >
        <FaExternalLinkAlt size={12} />
        {domain}
      </a>
    );
  };

  // Actions menu component
  const ActionsMenu = () => (
    <div style={{ 
      position: 'absolute', 
      top: '100%', 
      right: 0,
      backgroundColor: 'white',
      boxShadow: theme.shadows.md,
      borderRadius: theme.borderRadius.sm,
      zIndex: 100,
      width: '180px',
    }}>
      <div
        onClick={() => {
          setMenuOpen(false);
          onEditContact(contact);
        }}
        style={{
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          cursor: 'pointer',
          borderBottom: '1px solid #eee',
          transition: 'background-color 0.2s ease',
        }}
      >
        <FaEdit size={14} />
        <span>Edit Contact</span>
      </div>
      
      <div
        onClick={() => {
          setMenuOpen(false);
          onLogCall(contact);
        }}
        style={{
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          cursor: 'pointer',
          borderBottom: '1px solid #eee',
          transition: 'background-color 0.2s ease',
        }}
      >
        <FaPhone size={14} />
        <span>Log Call</span>
      </div>
      
      <div
        onClick={() => {
          setMenuOpen(false);
          onAddTask(contact);
        }}
        style={{
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          cursor: 'pointer',
          borderBottom: '1px solid #eee',
          transition: 'background-color 0.2s ease',
        }}
      >
        <FaTasks size={14} />
        <span>Add Task</span>
      </div>
      
      {currentUser && currentUser.role === 'admin' && (
        <div
          onClick={() => {
            setMenuOpen(false);
            onReassignContact(contact);
          }}
          style={{
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            borderBottom: '1px solid #eee',
            transition: 'background-color 0.2s ease',
          }}
        >
          <FaUser size={14} />
          <span>Reassign Contact</span>
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
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          cursor: 'pointer',
          color: '#e74c3c',
          transition: 'background-color 0.2s ease',
        }}
      >
        <FaTrash size={14} />
        <span>Delete Contact</span>
      </div>
    </div>
  );

  // Status menu component
  const StatusMenu = () => (
    <div style={{ 
      position: 'absolute', 
      top: '100%', 
      right: 0,
      backgroundColor: 'white',
      boxShadow: theme.shadows.md,
      borderRadius: theme.borderRadius.sm,
      zIndex: 100,
      width: '180px',
    }}>
      {['Follow Up', 'No Answer', 'Deal Closed', 'Not Interested'].map(status => (
        <div
          key={status}
          onClick={() => handleStatusChange(status)}
          style={{
            padding: '0.5rem',
            cursor: 'pointer',
            backgroundColor: status === contact.lastCallOutcome ? '#f0f0f0' : 'white',
            borderBottom: '1px solid #eee',
            ...getOutcomeStyle(status)
          }}
        >
          {status}
        </div>
      ))}
    </div>
  );

  // Volume menu component
  const VolumeMenu = () => (
    <div style={{ 
      position: 'absolute', 
      top: '100%', 
      right: 0,
      backgroundColor: 'white',
      boxShadow: theme.shadows.md,
      borderRadius: theme.borderRadius.sm,
      zIndex: 100,
      width: '150px',
    }}>
      {volumeOptions.map(option => (
        <div
          key={option.value}
          onClick={() => handleVolumeChange(option.value)}
          style={{
            padding: '0.5rem',
            cursor: 'pointer',
            backgroundColor: option.value === contact.volume ? '#f0f0f0' : 'white',
            borderBottom: '1px solid #eee',
            ...getVolumeStyle(option.value)
          }}
        >
          {option.label}
        </div>
      ))}
    </div>
  );

  // Region menu component
  const RegionMenu = () => (
    <div style={{ 
      position: 'absolute', 
      top: '100%', 
      right: 0,
      backgroundColor: 'white',
      boxShadow: theme.shadows.md,
      borderRadius: theme.borderRadius.sm,
      zIndex: 100,
      width: '180px',
    }}>
      {regionOptions.map(option => (
        <div
          key={option.value}
          onClick={() => handleRegionChange(option.value)}
          style={{
            padding: '0.5rem',
            cursor: 'pointer',
            backgroundColor: option.value === contact.region ? '#f0f0f0' : 'white',
            borderBottom: '1px solid #eee',
          }}
        >
          {option.label}
        </div>
      ))}
    </div>
  );

  return (
    <>
      {/* Contact Row */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: '3fr 2fr 2fr 1fr 1fr 1fr 1fr',
        padding: '0.75rem 1rem',
        backgroundColor: expanded ? '#f8f9fa' : 'white',
        borderBottom: '1px solid #eee',
        alignItems: 'center',
        transition: 'background-color 0.2s ease',
        cursor: 'pointer',
      }}>
        {/* Name Column with expand toggle */}
        <div 
          onClick={onToggleExpand} 
          style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: '500'
          }}
        >
          {expanded ? <FaAngleUp size={14} /> : <FaAngleDown size={14} />}
          {contact.name}
          {contact.lastCallOutcome && (
            <span style={{
              display: 'inline-block',
              padding: '0.15rem 0.3rem',
              borderRadius: '3px',
              fontSize: '0.7rem',
              ...getOutcomeStyle(contact.lastCallOutcome)
            }}>
              {contact.lastCallOutcome}
            </span>
          )}
        </div>
        
        {/* Company */}
        <div onClick={onToggleExpand}>
          {contact.company || '-'}
        </div>
        
        {/* Contact Info */}
        <div onClick={onToggleExpand} style={{ fontSize: '0.9rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
            <FaPhone size={12} color={theme.colors.brand.text} />
            {contact.phone}
          </div>
          {contact.email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <FaEnvelope size={12} color={theme.colors.brand.text} />
              {contact.email}
            </div>
          )}
          {getProfileDisplay()}
        </div>
        
        {/* Volume - Clickable for dropdown */}
        <div style={{ position: 'relative' }}>
          <div 
            onClick={() => setVolumeMenuOpen(!volumeMenuOpen)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              ...(contact.volume ? getVolumeStyle(contact.volume) : { border: '1px dashed #ccc' })
            }}
          >
            {contact.volume ? 
              volumeOptions.find(o => o.value === contact.volume)?.label || 'Unknown' : 
              'Set Volume'}
          </div>
          {volumeMenuOpen && <VolumeMenu />}
        </div>
        
        {/* Region - Clickable for dropdown */}
        <div style={{ position: 'relative' }}>
          <div 
            onClick={() => setRegionMenuOpen(!regionMenuOpen)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              border: '1px solid #eee',
              backgroundColor: '#f8f9fa'
            }}
          >
            {contact.region ? 
              regionOptions.find(o => o.value === contact.region)?.label || contact.region : 
              'Set Region'}
          </div>
          {regionMenuOpen && <RegionMenu />}
        </div>
        
        {/* Status - Clickable for dropdown */}
        <div style={{ position: 'relative' }}>
          <div 
            onClick={() => setStatusMenuOpen(!statusMenuOpen)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              ...getStatusStyle(contact.status)
            }}
          >
            {contact.status}
          </div>
          {statusMenuOpen && <StatusMenu />}
        </div>
        
        {/* Actions Menu */}
        <div style={{ textAlign: 'center', position: 'relative' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();  // Prevent row toggle
              setMenuOpen(!menuOpen);
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              transition: 'background-color 0.2s ease',
            }}
          >
            <FaEllipsisV />
          </button>
          
          {menuOpen && <ActionsMenu />}
        </div>
      </div>
      
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
                        ...getStatusStyle(contact.status)
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, color: theme.colors.brand.primary }}>
                  Recent Activity
                </h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button
                    onClick={() => onLogCall(contact)}
                    size="small"
                    variant="primary"
                  >
                    <FaPhone size={12} style={{ marginRight: '0.25rem' }} />
                    Log Call
                  </Button>
                  <Button
                    onClick={() => onAddTask(contact)}
                    size="small"
                    variant="secondary"
                  >
                    <FaTasks size={12} style={{ marginRight: '0.25rem' }} />
                    Add Task
                  </Button>
                </div>
              </div>
              
              {/* Last Call */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ marginTop: 0, marginBottom: '0.5rem', color: theme.colors.brand.text, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FaHistory size={14} />
                  Last Call
                </h4>
                <div style={{ 
                  backgroundColor: 'white',
                  padding: '1rem',
                  borderRadius: theme.borderRadius.sm,
                  border: '1px solid #eee'
                }}>
                  {contact.lastCallDate ? (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <div style={{ fontWeight: 'bold' }}>{formatDate(contact.lastCallDate)}</div>
                        <div>
                          <span style={{
                            display: 'inline-block',
                            padding: '0.15rem 0.3rem',
                            borderRadius: '3px',
                            fontSize: '0.75rem',
                            ...getOutcomeStyle(contact.lastCallOutcome || 'No Answer')
                          }}>
                            {contact.lastCallOutcome || 'No Answer'}
                          </span>
                        </div>
                      </div>
                      <Button
                        onClick={() => onLogCall(contact)}
                        size="small"
                        variant="outline"
                        style={{ marginTop: '0.5rem' }}
                      >
                        <FaPhone size={12} style={{ marginRight: '0.25rem' }} />
                        Log Another Call
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <p style={{ margin: '0 0 0.5rem 0', color: theme.colors.brand.text }}>No calls recorded yet</p>
                      <Button
                        onClick={() => onLogCall(contact)}
                        size="small"
                        variant="primary"
                      >
                        <FaPhone size={12} style={{ marginRight: '0.25rem' }} />
                        Log First Call
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Tasks Section Placeholder */}
              <div>
                <h4 style={{ marginTop: 0, marginBottom: '0.5rem', color: theme.colors.brand.text, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FaTasks size={14} />
                  Tasks
                </h4>
                <div style={{ 
                  backgroundColor: 'white',
                  padding: '1rem',
                  borderRadius: theme.borderRadius.sm,
                  border: '1px solid #eee'
                }}>
                  <p style={{ margin: '0 0 0.5rem 0', color: theme.colors.brand.text }}>
                    {contact.tasks && contact.tasks.length > 0 ? 
                      `${contact.tasks.length} task(s) associated with this contact` :
                      'No tasks associated with this contact'}
                  </p>
                  <Button
                    onClick={() => onAddTask(contact)}
                    size="small"
                    variant={contact.tasks && contact.tasks.length > 0 ? 'outline' : 'primary'}
                  >
                    <FaTasks size={12} style={{ marginRight: '0.25rem' }} />
                    {contact.tasks && contact.tasks.length > 0 ? 'Add Another Task' : 'Create Task'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom Action Bar */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid #ddd' 
          }}>
            <Button
              onClick={() => onEditContact(contact)}
              style={{ marginRight: '0.5rem' }}
            >
              <FaEdit size={14} style={{ marginRight: '0.25rem' }} />
              Edit Contact
            </Button>
            {currentUser && currentUser.role === 'admin' && (
              <Button
                onClick={() => onReassignContact(contact)}
                variant="secondary"
                style={{ marginRight: '0.5rem' }}
              >
                <FaUser size={14} style={{ marginRight: '0.25rem' }} />
                Reassign
              </Button>
            )}
            <Button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this contact? This cannot be undone.')) {
                  onDeleteContact(contact.id);
                }
              }}
              variant="outline"
              style={{ color: '#e74c3c', borderColor: '#e74c3c' }}
            >
              <FaTrash size={14} style={{ marginRight: '0.25rem' }} />
              Delete
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default ContactRow;