import { useState, useEffect } from 'react';
import { FaBars, FaSignOutAlt } from 'react-icons/fa';
import { useRouter } from 'next/router';
import theme from '../styles/theme';
import Sidebar from './common/Sidebar';

export default function Layout({ children }) {
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
        
        {/* Header with Search */}
        <div style={{
          backgroundColor: 'white',
          padding: '1rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: theme.shadows.sm,
          marginBottom: '2rem',
        }}>
          <div style={{ flex: 1 }}>
            <input 
              type="text"
              placeholder="Search contacts, calls, tasks..."
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                border: '1px solid #ddd',
                width: '100%',
                maxWidth: '500px',
              }}
            />
          </div>
          
          {user && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ marginRight: '1rem' }}>
                <div style={{ fontWeight: 'bold' }}>{user.firstName} {user.lastName}</div>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>
                  {user.role === 'admin' ? 'Administrator' : 'Team Member'}
                </div>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#666',
                  cursor: 'pointer',
                }}
              >
                <FaSignOutAlt size={18} />
                <span style={{ marginLeft: '0.5rem' }}>Logout</span>
              </button>
            </div>
          )}
        </div>
        
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