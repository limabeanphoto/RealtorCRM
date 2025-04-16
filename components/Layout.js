// components/Layout.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import theme from '../styles/theme';
import Sidebar from './common/Sidebar';

export default function Layout({ children, customHeader }) {
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Toggle sidebar collapsed state
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };
  
  // Check if we're on mobile and auto-collapse sidebar
  useEffect(() => {
    const handleResize = () => {
      const mobileCheck = window.innerWidth < 768;
      setIsMobile(mobileCheck);
      
      // Auto-collapse only if entering mobile view
      if (mobileCheck && !isMobile) { // Check if changed to mobile
        setIsSidebarCollapsed(true);
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
  
  return (
    <div style={{ 
      display: 'flex',
      backgroundColor: theme.colors.brand.background,
      minHeight: '100vh',
      position: 'relative',
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
              {getPageTitle(router.pathname)}
            </h1>
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
        )}
        
        {/* Main Content Area */}
        <main style={{ 
          padding: isMobile ? '1rem' : '2rem',
          flex: 1, // Allow shrinking/growing
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%',
          overflowY: 'auto', // Allow vertical scroll within main if needed
        }}>
          {children}
        </main>
        
        {/* Footer */}
      </div>
    </div>
  );
}

// Helper function to get page title based on path
function getPageTitle(path) {
  if (path.includes('/admin/dashboard')) return 'Admin Dashboard';
  if (path === '/' || path.includes('/dashboard')) return 'Dashboard';
  if (path.includes('/contacts')) return 'Contacts';
  if (path.includes('/calls')) return 'Calls';
  if (path.includes('/tasks')) return 'Tasks';
  if (path.includes('/stats') || path.includes('/analytics')) return 'Analytics';
  if (path.includes('/settings')) return 'Settings';
  return 'Realtor CRM';
}