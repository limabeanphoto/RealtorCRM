// components/Layout.js - Modernized with responsive design and CSS Grid
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import theme from '../styles/theme';
import Sidebar from './common/Sidebar';
import { FaBars } from 'react-icons/fa';

export default function Layout({ children, customHeader }) {
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [sidebarOverlay, setSidebarOverlay] = useState(false);
  
  // Toggle sidebar collapsed state
  const toggleSidebar = useCallback(() => {
    if (isMobile) {
      setSidebarOverlay(!sidebarOverlay);
    } else {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  }, [isMobile, isSidebarCollapsed, sidebarOverlay]);
  
  // Enhanced responsive breakpoint handling
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const mobileCheck = width < parseInt(theme.breakpoints.md);
      const tabletCheck = width >= parseInt(theme.breakpoints.md) && width < parseInt(theme.breakpoints.lg);
      
      setIsMobile(mobileCheck);
      setIsTablet(tabletCheck);
      
      // Auto-collapse sidebar for mobile and tablet
      if (mobileCheck) {
        setIsSidebarCollapsed(true);
        setSidebarOverlay(false);
      } else if (tabletCheck) {
        setIsSidebarCollapsed(true);
        setSidebarOverlay(false);
      }
    };
    
    // Set initial state
    handleResize();
    
    // Debounced resize handler for better performance
    let timeoutId;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 150);
    };
    
    window.addEventListener('resize', debouncedResize);
    
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(timeoutId);
    };
  }, []);
  
  // Close sidebar overlay when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobile && sidebarOverlay && !event.target.closest('[data-sidebar]')) {
        setSidebarOverlay(false);
      }
    };
    
    if (sidebarOverlay) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isMobile, sidebarOverlay]);
  
  return (
    <div style={{ 
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : (isSidebarCollapsed ? '70px 1fr' : '240px 1fr'),
      gridTemplateRows: isMobile ? 'auto 1fr' : '1fr',
      gridTemplateAreas: isMobile ? '"header" "main"' : '"sidebar main"',
      minHeight: '100vh',
      backgroundColor: theme.colors.brand.background,
      transition: 'grid-template-columns 0.3s ease',
      position: 'relative',
    }}>
      {/* Mobile Header */}
      {isMobile && (
        <header style={{
          gridArea: 'header',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: theme.spacing[4],
          backgroundColor: 'white',
          boxShadow: theme.shadows.sm,
          borderBottom: `1px solid ${theme.colors.neutral[200]}`,
          position: 'sticky',
          top: 0,
          zIndex: theme.zIndex.sticky,
        }}>
          <h1 style={{ 
            margin: 0, 
            fontSize: theme.typography.fontSize.xl,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.brand.primary,
            letterSpacing: theme.typography.letterSpacing.tight,
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
              justifyContent: 'center',
              padding: theme.spacing[3],
              borderRadius: theme.borderRadius.md,
              transition: `background-color ${theme.animation.duration.fast} ${theme.animation.easing.inOut}`,
              minHeight: '44px', // Better touch target
              minWidth: '44px',
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = theme.colors.neutral[100]}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            <FaBars size={20} />
          </button>
        </header>
      )}
      
      {/* Sidebar - Enhanced with overlay support */}
      <div 
        data-sidebar
        style={{
          gridArea: 'sidebar',
          position: isMobile ? 'fixed' : 'relative',
          top: isMobile ? 0 : 'auto',
          left: isMobile ? (sidebarOverlay ? 0 : '-240px') : 'auto',
          bottom: isMobile ? 0 : 'auto',
          width: isMobile ? '240px' : '100%',
          height: isMobile ? '100vh' : 'auto',
          zIndex: isMobile ? theme.zIndex.overlay : 'auto',
          transition: isMobile ? 
            `left ${theme.animation.duration.normal} ${theme.animation.easing.inOut}` : 
            'none',
          backgroundColor: theme.colors.brand.primary,
          ...(isMobile && sidebarOverlay && {
            boxShadow: theme.shadows.xl,
          }),
        }}
      >
        <Sidebar 
          isCollapsed={isSidebarCollapsed} 
          toggleSidebar={toggleSidebar}
          isMobile={isMobile}
          isOverlay={sidebarOverlay}
        />
      </div>
      
      {/* Backdrop for mobile overlay */}
      {isMobile && sidebarOverlay && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: theme.zIndex.overlay - 1,
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
          }}
          onClick={() => setSidebarOverlay(false)}
        />
      )}
      
      {/* Main Content Area */}
      <main style={{ 
        gridArea: 'main',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Content Container with improved spacing */}
        <div style={{
          flex: 1,
          padding: isMobile ? theme.spacing[4] : 
                   isTablet ? theme.spacing[6] : theme.spacing[8],
          maxWidth: '1400px',
          margin: '0 auto',
          width: '100%',
          overflow: 'auto',
          // Modern scrollbar styling
          scrollbarWidth: 'thin',
          scrollbarColor: `${theme.colors.neutral[300]} transparent`,
        }}>
          {/* CSS for webkit scrollbar */}
          <style jsx>{`
            div::-webkit-scrollbar {
              width: 8px;
            }
            div::-webkit-scrollbar-track {
              background: transparent;
            }
            div::-webkit-scrollbar-thumb {
              background: ${theme.colors.neutral[300]};
              border-radius: 4px;
            }
            div::-webkit-scrollbar-thumb:hover {
              background: ${theme.colors.neutral[400]};
            }
          `}</style>
          
          {customHeader && (
            <div style={{
              marginBottom: theme.spacing[6],
              paddingBottom: theme.spacing[4],
              borderBottom: `1px solid ${theme.colors.neutral[200]}`,
            }}>
              {customHeader}
            </div>
          )}
          
          {children}
        </div>
      </main>
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
