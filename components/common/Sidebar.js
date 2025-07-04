// Updated components/common/Sidebar.js - Part 1
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
  FaBars,
  FaUsersCog,
  FaChartLine
} from 'react-icons/fa';
import SearchResults from '../search/SearchResults';

export default function Sidebar({ isCollapsed, toggleSidebar, isMobile = false, isOverlay = false }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [user, setUser] = useState(null);
  const searchRef = useRef(null);
  const userMenuRef = useRef(null);
  const userMenuTriggerRef = useRef(null);
  
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
      {
        href: isAdmin ? '/admin/dashboard' : '/',
        label: 'Dashboard',
        icon: <FaHome size={18} />
      },
      { href: '/ContactsPage', label: 'Contacts', icon: <FaUsers size={18} /> },
      { href: '/calls', label: 'Calls', icon: <FaPhone size={18} /> },
      { href: '/tasks', label: 'Tasks', icon: <FaTasks size={18} /> },
      { href: '/stats', label: 'Analytics', icon: <FaChartBar size={18} /> },
    ];
    
    // Add Team Analytics for admins only
    if (isAdmin) {
      items.push({
        href: '/admin/team-analytics',
        label: 'Team Analytics',
        icon: <FaChartLine size={18} />
      });
    }
    
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
      
      if (userMenuRef.current && !userMenuRef.current.contains(event.target) && 
          userMenuTriggerRef.current && !userMenuTriggerRef.current.contains(event.target)) {
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
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Top section with branding, toggle and search */}
      <div style={{
        padding: theme.spacing[4],
        display: 'flex',
        alignItems: 'center',
        justifyContent: isCollapsed && !isMobile ? 'center' : 'space-between',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        minHeight: '72px', // Consistent header height
      }}>
        {/* Logo/Brand Area */}
        {!isCollapsed && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing[2],
            fontSize: theme.typography.fontSize.lg,
            fontWeight: theme.typography.fontWeight.semibold,
            letterSpacing: theme.typography.letterSpacing.tight,
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: theme.borderRadius.md,
              backgroundColor: theme.colors.brand.highlight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.colors.brand.primary,
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.bold,
            }}>
              CRM
            </div>
            {!isMobile && <span>Realtor CRM</span>}
          </div>
        )}
        
        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing[2],
        }}>
          {!isCollapsed ? (
            <>
              <button 
                onClick={() => setIsSearchOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing[2],
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  border: 'none',
                  borderRadius: theme.borderRadius.md,
                  padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
                  cursor: 'pointer',
                  fontSize: theme.typography.fontSize.sm,
                  transition: `all ${theme.animation.duration.fast} ${theme.animation.easing.inOut}`,
                  minHeight: '40px',
                  flex: 1,
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
              >
                <FaSearch size={16} />
                <span>Search...</span>
              </button>
              
              {!isMobile && (
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
                    padding: theme.spacing[2],
                    borderRadius: theme.borderRadius.md,
                    transition: `background-color ${theme.animation.duration.fast} ${theme.animation.easing.inOut}`,
                    minHeight: '40px',
                    minWidth: '40px',
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <FaAngleLeft size={18} />
                </button>
              )}
            </>
          ) : (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: theme.spacing[2],
              width: '100%',
            }}>
              <button 
                onClick={() => setIsSearchOpen(true)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  padding: theme.spacing[2],
                  borderRadius: theme.borderRadius.md,
                  transition: `background-color ${theme.animation.duration.fast} ${theme.animation.easing.inOut}`,
                  minHeight: '40px',
                  minWidth: '40px',
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
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
                  padding: theme.spacing[2],
                  borderRadius: theme.borderRadius.md,
                  transition: `background-color ${theme.animation.duration.fast} ${theme.animation.easing.inOut}`,
                  minHeight: '40px',
                  minWidth: '40px',
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <FaAngleRight size={18} />
              </button>
            </div>
          )}
        </div>
        
        {/* Enhanced Search Modal */}
        {isSearchOpen && (
          <div 
            ref={searchRef}
            style={{
              position: 'fixed',
              top: 0,
              left: isMobile ? 0 : (isCollapsed ? 70 : 240),
              right: 0,
              backgroundColor: 'white',
              zIndex: theme.zIndex.modal,
              display: 'flex',
              flexDirection: 'column',
              height: '100vh',
              overflowY: 'auto',
              boxShadow: theme.shadows.xl,
              // Modern backdrop blur
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          >
            {/* Search Header */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: theme.spacing[6],
              borderBottom: `1px solid ${theme.colors.neutral[200]}`,
              backgroundColor: 'white',
              position: 'sticky',
              top: 0,
              zIndex: 1,
            }}>
              <h2 style={{ 
                margin: 0,
                fontSize: theme.typography.fontSize['2xl'],
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.brand.primary,
              }}>
                Search
              </h2>
              <button
                onClick={clearSearch}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: theme.typography.fontSize['2xl'],
                  cursor: 'pointer',
                  color: theme.colors.neutral[500],
                  padding: theme.spacing[2],
                  borderRadius: theme.borderRadius.md,
                  transition: `all ${theme.animation.duration.fast} ${theme.animation.easing.inOut}`,
                  minHeight: '44px',
                  minWidth: '44px',
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = theme.colors.neutral[100];
                  e.target.style.color = theme.colors.neutral[700];
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = theme.colors.neutral[500];
                }}
              >
                &times;
              </button>
            </div>
            
            {/* Search Form */}
            <div style={{ padding: theme.spacing[6] }}>
              <form onSubmit={handleSearch} style={{ marginBottom: theme.spacing[6] }}>
                <div style={{ 
                  display: 'flex', 
                  gap: theme.spacing[3],
                  flexDirection: isMobile ? 'column' : 'row',
                }}>
                  <input
                    type="text"
                    placeholder="Search contacts, calls, tasks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      padding: theme.spacing[3],
                      borderRadius: theme.borderRadius.lg,
                      border: `2px solid ${theme.colors.neutral[200]}`,
                      flex: 1,
                      fontSize: theme.typography.fontSize.base,
                      fontFamily: theme.typography.fontFamily.primary,
                      transition: `border-color ${theme.animation.duration.fast} ${theme.animation.easing.inOut}`,
                      outline: 'none',
                    }}
                    onFocus={(e) => e.target.style.borderColor = theme.colors.brand.primary}
                    onBlur={(e) => e.target.style.borderColor = theme.colors.neutral[200]}
                    autoFocus
                  />
                  
                  <button
                    type="submit"
                    style={{
                      backgroundColor: theme.colors.brand.primary,
                      color: 'white',
                      padding: `${theme.spacing[3]} ${theme.spacing[6]}`,
                      border: 'none',
                      borderRadius: theme.borderRadius.lg,
                      cursor: 'pointer',
                      fontSize: theme.typography.fontSize.base,
                      fontWeight: theme.typography.fontWeight.medium,
                      transition: `all ${theme.animation.duration.fast} ${theme.animation.easing.inOut}`,
                      minHeight: '44px',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = theme.colors.primary[600]}
                    onMouseLeave={(e) => e.target.style.backgroundColor = theme.colors.brand.primary}
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
          </div>
        )}
      </div>
      
      {/* Enhanced Navigation Items */}
      <nav style={{ 
        padding: `${theme.spacing[4]} 0`, 
        flex: 1, 
        overflowY: 'auto',
        // Custom scrollbar
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(255, 255, 255, 0.3) transparent',
      }}>
        <ul style={{ 
          listStyle: 'none', 
          padding: 0, 
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: theme.spacing[1],
        }}>
          {navItems.map((item) => (
            <li key={item.href}>
              <Link 
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: isCollapsed ? 
                    `${theme.spacing[3]} ${theme.spacing[4]}` : 
                    `${theme.spacing[3]} ${theme.spacing[6]}`,
                  margin: isCollapsed ? 
                    `0 ${theme.spacing[2]}` : 
                    `0 ${theme.spacing[4]}`,
                  textDecoration: 'none',
                  color: 'white',
                  backgroundColor: isActive(item.href) 
                    ? 'rgba(255, 255, 255, 0.2)' 
                    : 'transparent',
                  borderRadius: theme.borderRadius.lg,
                  transition: `all ${theme.animation.duration.fast} ${theme.animation.easing.inOut}`,
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: isActive(item.href) 
                    ? theme.typography.fontWeight.medium 
                    : theme.typography.fontWeight.normal,
                  position: 'relative',
                  minHeight: '44px', // Better touch target
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  ...(isActive(item.href) && {
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  }),
                }}
                onMouseEnter={(e) => {
                  if (!isActive(item.href)) {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(item.href)) {
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {/* Active indicator */}
                {isActive(item.href) && (
                  <div style={{
                    position: 'absolute',
                    left: isCollapsed ? '50%' : '0',
                    top: '50%',
                    transform: isCollapsed ? 'translateX(-50%) translateY(-50%)' : 'translateY(-50%)',
                    width: isCollapsed ? '4px' : '4px',
                    height: isCollapsed ? '4px' : '60%',
                    backgroundColor: theme.colors.brand.highlight,
                    borderRadius: '2px',
                    ...(isCollapsed && {
                      left: '4px',
                      transform: 'translateY(-50%)',
                    }),
                  }}
                />
                )}
                
                <span style={{ 
                  marginRight: isCollapsed ? 0 : theme.spacing[3],
                  fontSize: theme.typography.fontSize.lg,
                  display: 'flex',
                  alignItems: 'center',
                  color: isActive(item.href) ? theme.colors.brand.highlight : 'white',
                }}>
                  {item.icon}
                </span>
                
                {!isCollapsed && (
                  <span style={{
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: 'inherit',
                    letterSpacing: theme.typography.letterSpacing.normal,
                  }}>
                    {item.label}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* Enhanced User Menu at Bottom */}
      <div style={{
        padding: theme.spacing[4],
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        marginTop: 'auto',
        position: 'relative',
      }}>
        <div 
          ref={userMenuTriggerRef}
          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            cursor: 'pointer',
            padding: theme.spacing[3],
            borderRadius: theme.borderRadius.lg,
            transition: `all ${theme.animation.duration.fast} ${theme.animation.easing.inOut}`,
            backgroundColor: isUserMenuOpen ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
            minHeight: '44px', // Better touch target
            border: '1px solid transparent',
          }}
          onMouseEnter={(e) => {
            if (!isUserMenuOpen) {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isUserMenuOpen) {
              e.target.style.backgroundColor = 'transparent';
            }
          }}
        >
          {!isCollapsed ? (
            <>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing[2],
                flex: 1,
              }}>
                {/* User Avatar */}
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: theme.borderRadius.full,
                  backgroundColor: theme.colors.brand.highlight,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: theme.colors.brand.primary,
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.semibold,
                }}>
                  {(user?.firstName?.[0] || 'U').toUpperCase()}
                </div>
                
                {/* User Info */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                  minWidth: 0, // Prevent text overflow
                }}>
                  <span style={{
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.medium,
                    color: 'white',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {user?.firstName || 'User'}
                  </span>
                  {user?.role && (
                    <span style={{
                      fontSize: theme.typography.fontSize.xs,
                      color: 'rgba(255, 255, 255, 0.7)',
                      textTransform: 'capitalize',
                    }}>
                      {user.role}
                    </span>
                  )}
                </div>
              </div>
              
              <FaEllipsisV size={16} style={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                flexShrink: 0,
              }} />
            </>
          ) : (
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: theme.borderRadius.full,
              backgroundColor: theme.colors.brand.highlight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.colors.brand.primary,
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.semibold,
            }}>
              {(user?.firstName?.[0] || 'U').toUpperCase()}
            </div>
          )}
        </div>
      </div>
      
      {/* Enhanced User Menu Dropdown */}
      {isUserMenuOpen && (
        <div
          ref={userMenuRef}
          style={{
            position: 'fixed',
            bottom: isMobile ? 
              theme.spacing[4] :
              window.innerHeight - (userMenuTriggerRef.current?.getBoundingClientRect().top || 0) - 8,
            left: isMobile ? 
              theme.spacing[4] :
              isCollapsed ? 
                (userMenuTriggerRef.current?.getBoundingClientRect().left || 0) + 70 :
                (userMenuTriggerRef.current?.getBoundingClientRect().left || 0) + 20,
            right: isMobile ? theme.spacing[4] : 'auto',
            backgroundColor: 'white',
            borderRadius: theme.borderRadius.xl,
            boxShadow: theme.shadows['2xl'],
            width: isMobile ? 'auto' : '240px',
            zIndex: theme.zIndex.popover,
            border: `1px solid ${theme.colors.neutral[200]}`,
            overflow: 'hidden',
            // Modern backdrop blur
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          {/* User Info Header */}
          <div 
            style={{ 
              padding: theme.spacing[4],
              borderBottom: `1px solid ${theme.colors.neutral[200]}`,
              backgroundColor: `${theme.colors.neutral[50]}`,
            }}
          >
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing[3],
              marginBottom: theme.spacing[2],
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: theme.borderRadius.full,
                backgroundColor: theme.colors.brand.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.semibold,
              }}>
                {(user?.firstName?.[0] || 'U').toUpperCase()}
              </div>
              
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                  fontWeight: theme.typography.fontWeight.semibold,
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.neutral[900],
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {user?.firstName} {user?.lastName}
                </div>
                <div style={{ 
                  fontSize: theme.typography.fontSize.xs,
                  color: theme.colors.neutral[500],
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {user?.email}
                </div>
              </div>
            </div>
            
            {user?.role && (
              <div style={{
                display: 'inline-block',
                padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
                backgroundColor: theme.colors.brand.primary,
                color: 'white',
                fontSize: theme.typography.fontSize.xs,
                fontWeight: theme.typography.fontWeight.medium,
                borderRadius: theme.borderRadius.full,
                textTransform: 'capitalize',
              }}>
                {user.role}
              </div>
            )}
          </div>
          
          {/* Menu Items */}
          <div style={{ padding: theme.spacing[2] }}>
            <Link 
              href="/settings"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing[3],
                padding: theme.spacing[3],
                color: theme.colors.neutral[700],
                textDecoration: 'none',
                borderRadius: theme.borderRadius.lg,
                transition: `all ${theme.animation.duration.fast} ${theme.animation.easing.inOut}`,
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                minHeight: '44px',
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = theme.colors.neutral[100];
                e.target.style.color = theme.colors.neutral[900];
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = theme.colors.neutral[700];
              }}
            >
              <FaCog size={16} />
              <span>Settings</span>
            </Link>
            
            {/* Manage Users link for admins only */}
            {user && user.role === 'admin' && (
              <Link 
                href="/admin/users"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing[3],
                  padding: theme.spacing[3],
                  color: theme.colors.neutral[700],
                  textDecoration: 'none',
                  borderRadius: theme.borderRadius.lg,
                  transition: `all ${theme.animation.duration.fast} ${theme.animation.easing.inOut}`,
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  minHeight: '44px',
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = theme.colors.neutral[100];
                  e.target.style.color = theme.colors.neutral[900];
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = theme.colors.neutral[700];
                }}
              >
                <FaUsersCog size={16} />
                <span>Manage Users</span>
              </Link>
            )}
            
            <div 
              style={{
                margin: `${theme.spacing[2]} 0`,
                height: '1px',
                backgroundColor: theme.colors.neutral[200],
              }}
            />
            
            <div
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing[3],
                padding: theme.spacing[3],
                color: theme.colors.error[600],
                cursor: 'pointer',
                borderRadius: theme.borderRadius.lg,
                transition: `all ${theme.animation.duration.fast} ${theme.animation.easing.inOut}`,
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                minHeight: '44px',
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = theme.colors.error[50];
                e.target.style.color = theme.colors.error[700];
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = theme.colors.error[600];
              }}
            >
              <FaSignOutAlt size={16} />
              <span>Logout</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}