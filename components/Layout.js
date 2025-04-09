import { useState, useEffect } from 'react';
import { FaBars } from 'react-icons/fa';
import theme from '../styles/theme';
import Sidebar from './common/Sidebar';
import Header from './common/Header';

export default function Layout({ children }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Toggle sidebar collapsed state
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };
  
  // Check if we're on mobile and auto-collapse sidebar
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      
      // Auto-collapse on small screens
      if (window.innerWidth < 768) {
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
  }, []);
  
  return (
    <div style={{ 
      display: 'flex',
      backgroundColor: theme.colors.brand.background,
      minHeight: '100vh',
    }}>
      {/* Sidebar */}
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      
      {/* Main Content */}
      <div style={{ 
        marginLeft: isSidebarCollapsed ? '70px' : '240px',
        width: '100%',
        transition: 'margin-left 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}>
        {/* Top Bar - Mobile Only */}
        {isMobile && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            backgroundColor: 'white',
            boxShadow: theme.shadows.sm,
          }}>
            <h1 style={{ 
              margin: 0, 
              fontSize: '1.2rem', 
              color: theme.colors.brand.primary 
            }}>
              Realtor CRM
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
        
        {/* Header with Search */}
        <Header />
        
        {/* Main Content Area */}
        <main style={{ 
          padding: '0 2rem 2rem',
          flex: 1,
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%',
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
        }}>
          <p style={{ margin: 0 }}>Realtor CRM • Simplifying sales tracking since 2024</p>
        </footer>
      </div>
    </div>
  );
}