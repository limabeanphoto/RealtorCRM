import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import theme from '../../styles/theme';

// DashboardCard component - a reusable container for all dashboard widgets
export const DashboardCard = ({ title, children, actionButton, fullWidth = false }) => (
  <div style={{
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.md,
    boxShadow: theme.shadows.sm,
    padding: '1.5rem',
    marginBottom: '1.5rem',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    width: '100%'
  }}>
    {title && (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1rem',
      }}>
        <h3 style={{ margin: 0 }}>{title}</h3>
        {actionButton}
      </div>
    )}
    <div style={{ flex: 1 }}>
      {children}
    </div>
  </div>
);

// StatCard component - for simple stats display
export const StatCard = ({ title, value }) => (
  <DashboardCard>
    <div style={{
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
    }}>
      <h3 style={{ margin: '0 0 1rem 0' }}>{title}</h3>
      <p style={{ 
        fontSize: '2rem', 
        fontWeight: 'bold', 
        margin: 0 
      }}>{value}</p>
    </div>
  </DashboardCard>
);

// ContactsCard component - for contacts display
export const ContactsCard = ({ title, count, buttonText, onClick }) => (
  <DashboardCard>
    <div>
      <h3 style={{ margin: '0 0 1rem 0' }}>{title}</h3>
      <p style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>
        {count} contacts available
      </p>
      <button 
        onClick={onClick}
        style={{
          backgroundColor: theme.colors.brand.accent,
          color: 'white',
          padding: '0.5rem 1rem',
          border: 'none',
          borderRadius: theme.borderRadius.sm,
          cursor: 'pointer',
        }}
      >
        {buttonText}
      </button>
    </div>
  </DashboardCard>
);

// ActionButton component - for consistent action buttons
export const ActionButton = ({ children, onClick, small = false }) => (
  <button
    onClick={onClick}
    style={{
      backgroundColor: theme.colors.brand.accent,
      color: 'white',
      padding: small ? '0.25rem 0.5rem' : '0.75rem 1.5rem',
      border: 'none',
      borderRadius: theme.borderRadius.sm,
      fontSize: small ? '0.8rem' : '1rem',
      cursor: 'pointer',
    }}
  >
    {children}
  </button>
);

// Row Layout component - for consistent grid layout
export const RowLayout = ({ children }) => (
  <div style={{ 
    display: 'flex',
    flexWrap: 'wrap',
    margin: '0 -0.75rem', // Negative margin to counteract padding
    marginBottom: '1.5rem',
  }}>
    {children}
  </div>
);

// Column component - with responsive behavior
export const Column = ({ children, width = '100%', mobileWidth = '100%' }) => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Set initial value
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return (
    <div style={{ 
      width: isMobile ? mobileWidth : width, 
      padding: '0 0.75rem',
      marginBottom: '1.5rem',
      boxSizing: 'border-box',
    }}>
      {children}
    </div>
  );
};