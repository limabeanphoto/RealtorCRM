import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import theme from '../../styles/theme';
import { FaHome, FaUsers, FaPhone, FaTasks, FaChartBar, FaBars, FaAngleLeft, FaAngleRight } from 'react-icons/fa';

export default function Sidebar({ isCollapsed, toggleSidebar }) {
  const router = useRouter();
  
  // Navigation items
  const navItems = [
    { href: '/', label: 'Dashboard', icon: <FaHome /> },
    { href: '/contacts', label: 'Contacts', icon: <FaUsers /> },
    { href: '/calls', label: 'Calls', icon: <FaPhone /> },
    { href: '/tasks', label: 'Tasks', icon: <FaTasks /> },
    { href: '/stats', label: 'Analytics', icon: <FaChartBar /> },
  ];
  
  // Check if the current path matches
  const isActive = (path) => {
    return router.pathname === path;
  };
  
  return (
    <div 
      style={{
        width: isCollapsed ? '70px' : '240px',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        backgroundColor: theme.colors.brand.primary,
        color: 'white',
        transition: 'width 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: theme.shadows.md,
        zIndex: 1000,
      }}
    >
      {/* Logo Area */}
      <div style={{
        padding: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'space-between',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        {!isCollapsed && (
          <h1 style={{ 
            margin: 0, 
            fontSize: '1.5rem', 
            fontWeight: 'bold',
            color: 'white',
          }}>
            Realtor CRM
          </h1>
        )}
        
        {isCollapsed && (
          <FaHome size={24} />
        )}
        
        <button 
          onClick={toggleSidebar}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.5rem',
          }}
        >
          {isCollapsed ? <FaAngleRight /> : <FaAngleLeft />}
        </button>
      </div>
      
      {/* Navigation Items */}
      <nav style={{ padding: '1rem 0', flex: 1 }}>
        <ul style={{ 
          listStyle: 'none', 
          padding: 0, 
          margin: 0,
        }}>
          {navItems.map((item) => (
            <li key={item.href} style={{ marginBottom: '0.5rem' }}>
              <Link 
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem 1.5rem',
                  textDecoration: 'none',
                  color: 'white',
                  backgroundColor: isActive(item.href) 
                    ? 'rgba(255, 255, 255, 0.2)' 
                    : 'transparent',
                  borderLeft: isActive(item.href) 
                    ? `4px solid ${theme.colors.brand.highlight}` 
                    : '4px solid transparent',
                  transition: 'all 0.2s ease',
                }}
              >
                <span style={{ 
                  marginRight: isCollapsed ? 0 : '0.75rem',
                  fontSize: '1.2rem',
                  display: 'flex',
                  alignItems: 'center',
                }}>
                  {item.icon}
                </span>
                
                {!isCollapsed && (
                  <span>{item.label}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* Footer */}
      <div style={{
        padding: '1rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        textAlign: 'center',
        fontSize: '0.8rem',
      }}>
        {!isCollapsed && 'Realtor CRM © 2024'}
      </div>
    </div>
  );
}