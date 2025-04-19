import React from 'react';
import { useRouter } from 'next/router';
import { FaTasks, FaUsers, FaPhone, FaCalendarAlt, FaCheck, FaChevronRight } from 'react-icons/fa';

export default function ActionPanel({ type, title, items, viewAllLink, color }) {
  const router = useRouter();
  
  // Get icon for the panel header
  const getPanelIcon = () => {
    switch (type) {
      case 'tasks':
        return <FaTasks size={18} />;
      case 'contacts':
        return <FaUsers size={18} />;
      default:
        return null;
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const options = { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Get appropriate action for item type
  const getItemAction = (item) => {
    if (type === 'tasks') {
      return () => router.push(`/tasks?id=${item.id}`);
    } else if (type === 'contacts') {
      return () => router.push(`/calls?contactId=${item.id}`);
    }
    return () => {};
  };
  
  // Get appropriate icon for item action
  const getActionIcon = () => {
    if (type === 'tasks') {
      return <FaCheck size={14} />;
    } else if (type === 'contacts') {
      return <FaPhone size={14} />;
    }
    return null;
  };
  
  // Get action text based on item type
  const getActionText = () => {
    if (type === 'tasks') {
      return "View Task";
    } else if (type === 'contacts') {
      return "Log Call";
    }
    return "View";
  };

  return (
    <div className="dashboard-card action-panel">
      <div className="panel-header">
        <h2 className="panel-title">
          <span className="panel-icon" style={{ color: color || '#4a69bd' }}>
            {getPanelIcon()}
          </span>
          {title}
        </h2>
        {items.length > 0 && (
          <span className="item-count" style={{ 
            backgroundColor: color || '#4a69bd',
            color: 'white'
          }}>
            {items.length}
          </span>
        )}
      </div>
      
      <div className="panel-content">
        {items.length > 0 ? (
          <ul className="action-list">
            {items.map((item) => (
              <li key={item.id} className="action-item">
                <div className="item-details">
                  <h4 className="item-title">
                    {type === 'tasks' ? item.title : item.name}
                  </h4>
                  <div className="item-meta">
                    <span className="item-date">
                      <FaCalendarAlt size={12} />
                      {type === 'tasks' 
                        ? formatDate(item.dueDate) 
                        : formatDate(item.lastCallDate)
                      }
                    </span>
                    {type === 'contacts' && item.company && (
                      <span className="item-company">{item.company}</span>
                    )}
                  </div>
                </div>
                <button 
                  className="item-action"
                  onClick={getItemAction(item)}
                  style={{ backgroundColor: color || '#4a69bd' }}
                >
                  {getActionIcon()}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="no-items">
            No {type} {type === 'tasks' ? 'due' : 'to follow up'} at this time.
          </p>
        )}
      </div>
      
      <div className="panel-footer">
        <button 
          className="view-all-button"
          onClick={() => router.push(viewAllLink || `/${type}`)}
        >
          View All {title} <FaChevronRight size={12} />
        </button>
      </div>
    </div>
  );
}