// components/Layout.js
import { useState, useEffect } from 'react';
import { FaBars, FaSignOutAlt } from 'react-icons/fa';
import { useRouter } from 'next/router';
import theme from '../styles/theme';
import Sidebar from './common/Sidebar';
import Header from './common/Header';

export default function Layout({ children, customHeader }) {
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [user, setUser] = useState(null);
  
  // Get user data from localStorage
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
  }, []);
  
  // Toggle sidebar collapsed state
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };
  
  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };
  
  // Check if we're on mobile and auto-collapse sidebar
  useEffect(() => {
    const handleResize = () => {
      const mobileCheck = window.innerWidth < 768;
      setIsMobile(mobileCheck);
      
      // Auto-collapse only if entering mobile view
      // Keep it collapsed if already mobile and user expanded it manually
      // Keep it expanded if already desktop and user collapsed it manually
      if (mobileCheck && !isMobile) { // Check if changed to mobile
        setIsSidebarCollapsed(true);
      } else if (!mobileCheck && isMobile) { // Check if changed to desktop
         // Optional: Auto-expand when going back to desktop?
         // setIsSidebarCollapsed(false);\ 
      }
    };
    
    // Set initially
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isMobile]); // Rerun effect if isMobile state changes
  
  // Get page title based on path
  const getPageTitle = () => {
    const path = router.pathname;
    if (path.includes('/admin/dashboard')) return 'Admin Dashboard';
    if (path.includes('/dashboard')) return 'Dashboard';
    if (path.includes('/contacts')) return 'Contacts';
    if (path.includes('/calls')) return 'Calls';
    if (path.includes('/tasks')) return 'Tasks';
    if (path.includes('/stats') || path.includes('/analytics')) return 'Analytics';
    // Add more conditions as needed
    return 'Realtor CRM';
  };
  
  return (
    <div style={{ 
      display: 'flex',
      backgroundColor: theme.colors.brand.background,
      minHeight: '100vh',
      position: 'relative',
      // Removed overflow: 'hidden', potential issue?
    }}>
      {/* Sidebar - Fixed position with z-index */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: isSidebarCollapsed ? '70px' : '240px',
        zIndex: 10,
        transition: 'width 0.3s ease',
        overflowX: 'hidden',
        flexShrink: 0, // Prevent sidebar from shrinking
      }}>
        <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      </div>
      
      {/* Main Content - With left margin based on sidebar state */}
      <div style={{ 
        marginLeft: isSidebarCollapsed ? '70px' : '240px',
        width: 'calc(100% - ' + (isSidebarCollapsed ? '70px' : '240px') + ')',
        transition: 'margin-left 0.3s ease, width 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        flexGrow: 1, // Ensure it takes available space
      }}>
        {/* Top Bar - Mobile Only - This should only show < 768px */}
        {isMobile && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            backgroundColor: 'white',
            boxShadow: theme.shadows.sm,
            flexShrink: 0, // Prevent shrinking
          }}>
            <h1 style={{ 
              margin: 0, 
              fontSize: '1.2rem', 
              color: theme.colors.brand.primary 
            }}>
              {getPageTitle()}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {user && (
                <span style={{ marginRight: '1rem', fontSize: '0.9rem' }}>
                  Welcome, {user.firstName}
                </span>
              )}
              <button 
                onClick={toggleSidebar}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: theme.colors.brand.primary,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <FaBars size={20} />
              </button>
            </div>
          </div>
        )}
        
        {/* Default Header (Not Mobile) */}
        {/* Render Header only if not custom and not mobile (mobile has its own top bar) */}
        {!customHeader && !isMobile && (
          <Header />
        )}
        {/* Render custom header if provided (regardless of mobile status?) */} 
        {/* Consider if customHeader needs to be mobile aware too */} 
        {customHeader && customHeader } 
        
        {/* Main Content Area */}
        <main style={{ 
          // Use responsive padding: 1rem on mobile, 2rem otherwise
          padding: isMobile ? '0 1rem 1rem' : '0 2rem 2rem',
          flex: 1, // Allow shrinking/growing
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%',
          overflowY: 'auto', // Allow vertical scroll within main if needed
        }}>
          {children}
        </main>
        
        {/* Footer */}
        <footer style={{
          padding: '1.5rem',
          backgroundColor: 'white',
          borderTop: `1px solid ${theme.colors.brand.secondary}`,
          textAlign: 'center',
          color: theme.colors.brand.text,
          flexShrink: 0, // Prevent footer from shrinking
        }}>
          <p style={{ margin: 0 }}>Realtor CRM • Simplifying sales tracking since 2024</p>
        </footer>
      </div>
    </div>
  );
}