import React from 'react';
import CallTimelineItem from './CallTimelineItem';
import theme from '../../styles/theme';

// Utility function to group calls by date
const groupCallsByDate = (calls) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() - today.getDay());
  
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(thisWeekStart.getDate() - 7);
  
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const groups = {};
  
  calls.forEach(call => {
    const callDate = new Date(call.date);
    const callDateStr = callDate.toDateString();
    const todayStr = today.toDateString();
    const yesterdayStr = yesterday.toDateString();
    
    let groupKey;
    
    if (callDateStr === todayStr) {
      groupKey = 'Today';
    } else if (callDateStr === yesterdayStr) {
      groupKey = 'Yesterday';
    } else if (callDate >= thisWeekStart && callDate < today) {
      groupKey = 'This Week';
    } else if (callDate >= lastWeekStart && callDate < thisWeekStart) {
      groupKey = 'Last Week';
    } else if (callDate >= thisMonthStart && callDate < thisWeekStart) {
      groupKey = 'This Month';
    } else {
      // Group by month and year for older calls
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      groupKey = `${monthNames[callDate.getMonth()]} ${callDate.getFullYear()}`;
    }
    
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    
    groups[groupKey].push(call);
  });
  
  // Sort calls within each group by date (newest first)
  Object.keys(groups).forEach(key => {
    groups[key].sort((a, b) => new Date(b.date) - new Date(a.date));
  });
  
  return groups;
};

// Define the order of date groups
const getGroupOrder = (groupKey) => {
  const orders = {
    'Today': 0,
    'Yesterday': 1,
    'This Week': 2,
    'Last Week': 3,
    'This Month': 4,
  };
  
  return orders[groupKey] !== undefined ? orders[groupKey] : 100;
};

export default function CallTimeline({ 
  calls, 
  onEditClick, 
  onDeleteClick,
  onAddTaskClick,
  onStatusChange,
  loading = false,
  emptyMessage = "No calls found"
}) {
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '3rem',
        color: theme.colors.neutral[500],
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '2rem',
            height: '2rem',
            border: `2px solid ${theme.colors.neutral[200]}`,
            borderTop: `2px solid ${theme.colors.primary[500]}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem',
          }} />
          <p style={{ margin: 0, fontSize: theme.typography.fontSize.sm }}>
            Loading calls...
          </p>
        </div>
      </div>
    );
  }
  
  if (!calls || calls.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '3rem 2rem',
        backgroundColor: theme.colors.neutral[50],
        borderRadius: theme.borderRadius.lg,
        border: `1px solid ${theme.colors.neutral[200]}`,
        color: theme.colors.neutral[600],
      }}>
        <div style={{
          width: '4rem',
          height: '4rem',
          borderRadius: '50%',
          backgroundColor: theme.colors.neutral[200],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1rem',
          color: theme.colors.neutral[400],
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
          </svg>
        </div>
        <h3 style={{ 
          margin: '0 0 0.5rem 0',
          fontSize: theme.typography.fontSize.lg,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.neutral[700]
        }}>
          {emptyMessage}
        </h3>
        <p style={{ 
          margin: 0, 
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.neutral[500]
        }}>
          When you log calls, they'll appear here in a timeline view.
        </p>
      </div>
    );
  }
  
  const groupedCalls = groupCallsByDate(calls);
  const sortedGroups = Object.keys(groupedCalls).sort((a, b) => {
    const orderA = getGroupOrder(a);
    const orderB = getGroupOrder(b);
    
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    
    // For month/year groups, sort by date
    if (orderA === 100) {
      return b.localeCompare(a);
    }
    
    return 0;
  });
  
  return (
    <div style={{ maxWidth: '100%', margin: '0 auto' }}>
      {sortedGroups.map(groupKey => (
        <div key={groupKey} style={{ marginBottom: '2rem' }}>
          {/* Date group header */}
          <div style={{
            position: 'sticky',
            top: '0',
            zIndex: theme.zIndex.sticky,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderBottom: `1px solid ${theme.colors.neutral[200]}`,
            padding: '1rem 0',
            marginBottom: '1.5rem',
          }}>
            <h2 style={{
              margin: 0,
              fontSize: theme.typography.fontSize.xl,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.neutral[900],
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}>
              <div style={{
                width: '0.25rem',
                height: '1.5rem',
                backgroundColor: theme.colors.primary[500],
                borderRadius: theme.borderRadius.full,
              }} />
              {groupKey}
              <span style={{
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.normal,
                color: theme.colors.neutral[500],
                backgroundColor: theme.colors.neutral[100],
                padding: '0.25rem 0.5rem',
                borderRadius: theme.borderRadius.full,
              }}>
                {groupedCalls[groupKey].length} {groupedCalls[groupKey].length === 1 ? 'call' : 'calls'}
              </span>
            </h2>
          </div>
          
          {/* Timeline items */}
          <div className="timeline-items" style={{ paddingLeft: '1rem' }}>
            {groupedCalls[groupKey].map((call, index) => (
              <CallTimelineItem
                key={call.id}
                call={call}
                onEditClick={onEditClick}
                onDeleteClick={onDeleteClick}
                onAddTaskClick={onAddTaskClick}
                onStatusChange={onStatusChange}
                showFullDate={groupKey.includes('2023') || groupKey.includes('2024') || groupKey.includes('2025')}
                isLast={index === groupedCalls[groupKey].length - 1}
              />
            ))}
          </div>
        </div>
      ))}
      
      {/* Animation styles */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .timeline-items {
            padding-left: 0.5rem !important;
          }
        }
        
        @media (max-width: 480px) {
          .timeline-items {
            padding-left: 0.25rem !important;
          }
        }
      `}</style>
    </div>
  );
}