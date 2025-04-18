// components/common/Sidebar.js
import { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import theme from '../../styles/theme';
import { 
  FaHome, 
  FaUsers, 
  FaPhone, 
  FaTasks, 
  FaChartBar,
  FaSearch, 
  FaSignOutAlt, 
  FaCog, 
  FaAngleLeft, 
  FaAngleRight,
  FaEllipsisV,
  FaBars
} from 'react-icons/fa';
import SearchResults from '../search/SearchResults';

export default function Sidebar({ isCollapsed, toggleSidebar }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [user, setUser] = useState(null);
  const searchRef = useRef(null);
  const userMenuRef = useRef(null);
  
  // Get user data from localStorage on mount
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
  }, []);
  
  // Determine navigation items based on user role
  const navItems = useMemo(() => {
    const isAdmin = user && user.role === 'admin';
    
    // Base navigation items
    const items = [
      // Dashboard link is conditional based on user role
      {
        href: isAdmin ? '/admin/dashboard' : '/',
        label: 'Dashboard',
        icon: <FaHome size={18} />
      },
      { href: '/contacts', label: 'Contacts', icon: <FaUsers size={18} /> },
      { href: '/calls', label: 'Calls', icon: <FaPhone size={18} /> },
      { href: '/tasks', label: 'Tasks', icon: <FaTasks size={18} /> },
      { href: '/stats', label: 'Analytics', icon: <FaChartBar size={18} /> },
    ];
    
    return items;
  }, [user]);
  
  // Improved isActive function to handle more specific path matching
  const isActive = (path) => {
    // Exact match for root path
    if (path === '/' && router.pathname === '/') return true;
    
    // Special case for admin dashboard
    if (path === '/admin/dashboard' && router.pathname.startsWith('/admin/dashboard')) return true;
    
    // For other paths, check if the pathname starts with the path but is not the root
    if (path !== '/' && path !== '/admin/dashboard' && router.pathname.startsWith(path)) return true;
    
    return false;
  };
  
  // Handle search form submission
  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) return;
    
    setSearching(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/search?query=${encodeURIComponent(searchTerm)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data.data);
      } else {
        console.error('Search failed:', data.message);
      }
    } catch (error) {
      console.error('Error performing search:', error);
    } finally {
      setSearching(false);
    }
  };
  
  // Clear search results and term
  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults(null);
    setIsSearchOpen(false);
  };
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchResults(null);
        setIsSearchOpen(false);
      }
      
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: theme.colors.brand.primary,
      color: 'white',
      width: '100%',
    }}>
      {/* Top section with toggle and search */}
      <div style={{
        padding: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'space-between',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        {!isCollapsed ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            width: '100%'
          }}>
            <button 
              onClick={() => setIsSearchOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '0.5rem',
                cursor: 'pointer',
                width: '100%',
              }}
            >
              <FaSearch size={16} />
              <span>Search...</span>
            </button>
            
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
                marginLeft: '0.5rem',
              }}
            >
              <FaAngleLeft />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <button 
              onClick={() => {
                setIsSearchOpen(true);
              }}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                padding: '0.5rem',
              }}
            >
              <FaSearch size={20} />
            </button>
            
            <button 
              onClick={toggleSidebar}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                padding: '0.5rem',
              }}
            >
              <FaAngleRight />
            </button>
          </div>
        )}
        
        {/* Search Modal - Updated for better positioning */}
        {isSearchOpen && (
          <div 
            ref={searchRef}
            style={{
              position: 'fixed',
              top: 0,
              left: isCollapsed ? 70 : 240,
              right: 0,
              backgroundColor: 'white',
              zIndex: 1000,
              padding: '1rem',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              height: '100vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0 }}>Search</h2>
              <button
                onClick={clearSearch}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                }}
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSearch} style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Search contacts, calls, tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    flex: 1,
                  }}
                  autoFocus
                />
                
                <button
                  type="submit"
                  style={{
                    backgroundColor: theme.colors.brand.primary,
                    color: 'white',
                    padding: '0.75rem 1rem',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                  disabled={searching}
                >
                  {searching ? (
                    <span>Searching...</span>
                  ) : (
                    <span>Search</span>
                  )}
                </button>
              </div>
            </form>
            
            {/* Search Results */}
            {searchResults && (
              <SearchResults 
                results={searchResults} 
                onClose={clearSearch} 
              />
            )}
          </div>
        )}
      </div>
      
      {/* Navigation Items */}
      <nav style={{ padding: '1rem 0', flex: 1, overflowY: 'auto' }}>
        <ul style={{ 
          listStyle: 'none', 
          padding: 0, 
          margin: 0,
        }}>
          {navItems.map((item) => (
            <li key={item.href} style={{ marginBottom: '0.25rem' }}>
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
      
      {/* User Menu at Bottom */}
      <div 
        ref={userMenuRef}
        style={{
          padding: '1rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          marginTop: 'auto',
          position: 'relative',
        }}
      >
        <div 
          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            cursor: 'pointer',
            padding: '0.5rem',
            borderRadius: '4px',
            transition: 'background-color 0.2s ease',
            backgroundColor: isUserMenuOpen ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
            ':hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          {!isCollapsed ? (
            <>
              <span>{user?.firstName || 'User'}</span>
              <FaEllipsisV size={16} />
            </>
          ) : (
            <FaEllipsisV size={20} />
          )}
        </div>
        
        {/* User Menu Dropdown */}
        {isUserMenuOpen && (
          <div style={{
            position: 'absolute',
            bottom: isCollapsed ? 'auto' : '100%',  // Change from bottom to top for collapsed
            left: isCollapsed ? '70px' : '20px',
            top: isCollapsed ? '0' : 'auto',       // Add this for collapsed state
            backgroundColor: 'white',
            borderRadius: '4px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            width: '200px',
            zIndex: 1010,
          }}>
            <div 
              style={{ 
                padding: '0.75rem 1rem', 
                borderBottom: '1px solid #eee',
                color: theme.colors.brand.text,
              }}
            >
              <div style={{ fontWeight: 'bold' }}>{user?.firstName} {user?.lastName}</div>
              <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>{user?.email}</div>
            </div>
            
            <Link 
              href="/settings"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                color: theme.colors.brand.text,
                textDecoration: 'none',
                transition: 'background-color 0.2s ease',
                ':hover': {
                  backgroundColor: '#f8f9fa'
                }
              }}
            >
              <FaCog size={16} />
              <span>Settings</span>
            </Link>
            
            <div 
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                color: theme.colors.brand.text,
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
                ':hover': {
                  backgroundColor: '#f8f9fa'
                }
              }}
            >
              <FaSignOutAlt size={16} />
              <span>Logout</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}