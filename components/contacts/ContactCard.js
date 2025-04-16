// components/contacts/ContactCard.js
import { useState, useEffect } from 'react';
import { FaCheck, FaPhone, FaEdit, FaEnvelope, FaBuilding, FaAngleDown, FaAngleUp, FaTasks, FaHistory, FaTrash } from 'react-icons/fa';
import theme from '../../styles/theme';
import MiniTaskCard from '../tasks/MiniTaskCard';
import MiniCallCard from '../calls/MiniCallCard';

export default function ContactCard({ 
  contact, 
  onEditClick, 
  onLogCallClick, 
  onAddTaskClick,
  onDeleteContact,
  onEditTask,
  onTaskStatusChange,
  onContactUpdate // New prop for handling contact updates
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [calls, setCalls] = useState([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false); // New state for status dropdown
  
  // Toggle expanded state
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    
    // Load related data when expanding for the first time
    if (!isExpanded && tasks.length === 0 && calls.length === 0) {
      fetchRelatedData();
    }
  };
  
  // Fetch tasks and calls related to this contact
  const fetchRelatedData = async () => {
    setIsLoadingRelated(true);
    
    try {
      const token = localStorage.getItem('token');
      
      // Fetch tasks for this contact
      const tasksResponse = await fetch(`/api/tasks?contactId=${contact.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Fetch calls for this contact
      const callsResponse = await fetch(`/api/calls?contactId=${contact.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const tasksData = await tasksResponse.json();
      const callsData = await callsResponse.json();
      
      if (tasksData.success) {
        setTasks(tasksData.data);
      }
      
      if (callsData.success) {
        setCalls(callsData.data);
      }
    } catch (error) {
      console.error('Error fetching related data:', error);
    } finally {
      setIsLoadingRelated(false);
    }
  };
  
  // Handle status update
  const handleStatusUpdate = async (newStatus) => {
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
        // Update the contact in parent component
        if (onContactUpdate) {
          onContactUpdate(data.data);
        }
      } else {
        alert('Error updating contact status: ' + data.message);
      }
    } catch (error) {
      console.error('Error updating contact status:', error);
      alert('Error updating contact status');
    } finally {
      setIsStatusDropdownOpen(false);
    }
  };
  
  // Handle task status change from within the contact card
  const handleTaskStatusChange = async (taskId, newStatus) => {
    try {
      const result = await onTaskStatusChange(taskId, newStatus);
      
      if (result.success) {
        // Update the task in our local state
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === taskId ? { ...task, status: newStatus, completed: newStatus === 'Completed' } : task
          )
        );
      }
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };
  
  // Get assigned status badge style (for admin view)
  const getAssignedStyle = (status) => {
    return status === 'Open' 
      ? { backgroundColor: '#78e08f', color: 'white' }
      : { backgroundColor: '#4a69bd', color: 'white' };
  };
  
  // Get call outcome badge style
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
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isStatusDropdownOpen) {
        setIsStatusDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isStatusDropdownOpen]);
  
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
      {/* Card Header */}
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
              {contact.name}
            </h3>
            
            {/* Status badges */}
            <div style={{ display: 'flex', gap: '0.3rem' }}>
              {/* Assignment status badge */}
              {contact.status && (
                <span style={{
                  display: 'inline-block',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  ...getAssignedStyle(contact.status)
                }}>
                  {contact.status}
                  {contact.assignedToUser && ` (${contact.assignedToUser.firstName})`}
                </span>
              )}
              
              {/* Last call outcome badge with dropdown */}
              {contact.lastCallOutcome && (
                <div style={{ position: 'relative' }}>
                  <span 
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsStatusDropdownOpen(!isStatusDropdownOpen);
                    }}
                    style={{
                      display: 'inline-block',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      ...getOutcomeStyle(contact.lastCallOutcome)
                    }}
                  >
                    {contact.lastCallOutcome} ▼
                  </span>
                  
                  {isStatusDropdownOpen && (
                    <div 
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        backgroundColor: 'white',
                        borderRadius: '4px',
                        boxShadow: theme.shadows.md,
                        zIndex: 10,
                        width: '180px',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {['Interested', 'Not Interested', 'Follow Up', 'No Answer', 'Left Message', 'Wrong Number', 'Deal Closed'].map(status => (
                        <div
                          key={status}
                          onClick={(e) => {
                            handleStatusUpdate(status);
                          }}
                          style={{
                            padding: '0.5rem',
                            cursor: 'pointer',
                            backgroundColor: status === contact.lastCallOutcome ? '#f0f0f0' : 'white',
                            borderBottom: '1px solid #eee',
                            ...getOutcomeStyle(status),
                            borderRadius: 0
                          }}
                        >
                          {status}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {contact.company && (
              <span style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem',
                fontSize: '0.9rem', 
                color: theme.colors.brand.text
              }}>
                <FaBuilding size={12} />
                {contact.company}
              </span>
            )}
            
            <span style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '0.2rem',
              fontSize: '0.9rem', 
              color: theme.colors.brand.text
            }}>
              <FaPhone size={12} />
              {contact.phone}
            </span>
            
            {contact.email && (
              <span style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem',
                fontSize: '0.9rem', 
                color: theme.colors.brand.text
              }}>
                <FaEnvelope size={12} />
                {contact.email}
              </span>
            )}
            
            {/* Last call date */}
            {contact.lastCallDate && (
              <span style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem',
                fontSize: '0.9rem', 
                color: theme.colors.brand.text
              }}>
                <FaHistory size={12} />
                Last call: {formatDate(contact.lastCallDate)}
              </span>
            )}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {/* Updated square buttons */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditClick(contact);
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
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLogCallClick(contact);
            }}
            style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#78e08f',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            <FaPhone size={14} />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddTaskClick(contact);
            }}
            style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#e58e26',
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
        <div style={{ padding: '1rem', backgroundColor: '#f9f9f9' }}>
          {/* Notes Section */}
          {contact.notes && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Notes</h4>
              <div style={{ 
                backgroundColor: 'white', 
                padding: '0.75rem', 
                borderRadius: theme.borderRadius.sm,
                border: '1px solid #eee'
              }}>
                {contact.notes}
              </div>
            </div>
          )}
          
          {/* Tasks Section */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h4 style={{ margin: 0 }}>Tasks</h4>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddTaskClick(contact);
                }}
                style={{
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#e58e26',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                <FaTasks size={14} />
              </button>
            </div>
            
            {isLoadingRelated ? (
              <div style={{ textAlign: 'center', padding: '1rem' }}>Loading tasks...</div>
            ) : tasks.length > 0 ? (
              <div>
                {tasks.map(task => (
                  <MiniTaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={handleTaskStatusChange}
                    onEdit={onEditTask}
                  />
                ))}
              </div>
            ) : (
              <div style={{ 
                backgroundColor: 'white', 
                padding: '0.75rem', 
                borderRadius: theme.borderRadius.sm,
                border: '1px solid #eee',
                textAlign: 'center',
                color: theme.colors.brand.text,
                fontStyle: 'italic'
              }}>
                No tasks for this contact
              </div>
            )}
          </div>
          
          {/* Call History Section */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h4 style={{ margin: 0 }}>Recent Calls</h4>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onLogCallClick(contact);
                }}
                style={{
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#78e08f',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                <FaPhone size={14} />
              </button>
            </div>
            
            {isLoadingRelated ? (
              <div style={{ textAlign: 'center', padding: '1rem' }}>Loading calls...</div>
            ) : calls.length > 0 ? (
              <div>
                {calls.map(call => (
                  <MiniCallCard
                    key={call.id}
                    call={call}
                    onAddTask={() => onAddTaskClick(contact, call)}
                  />
                ))}
              </div>
            ) : (
              <div style={{ 
                backgroundColor: 'white', 
                padding: '0.75rem', 
                borderRadius: theme.borderRadius.sm,
                border: '1px solid #eee',
                textAlign: 'center',
                color: theme.colors.brand.text,
                fontStyle: 'italic'
              }}>
                No calls logged for this contact
              </div>
            )}
          </div>
          
          {/* Delete Contact Button */}
          <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('Are you sure you want to delete this contact? This cannot be undone.')) {
                  onDeleteContact(contact.id);
                }
              }}
              style={{
                backgroundColor: '#e74c3c',
                color: 'white',
                padding: '0.25rem 0.5rem',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.2rem',
              }}
            >
              <FaTrash size={12} /> Delete Contact
            </button>
          </div>
        </div>
      )}
    </div>
  );
}