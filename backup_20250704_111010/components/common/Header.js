import { useState, useRef, useEffect } from 'react';
import { FaSearch, FaBell, FaUser, FaEllipsisV, FaSignOutAlt, FaCog, FaTimes } from 'react-icons/fa';
import theme from '../../styles/theme';
import Link from 'next/link';
import Button from './Button';
import styles from './Header.module.css';
import SearchResults from '../search/SearchResults';

export default function Header() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

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
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLogout = () => {
    // Placeholder for logout functionality
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      
      // Close search results when clicking outside search area
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchResults(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
      </div>

      <div className={styles.searchContainer} ref={searchRef}>
        {/* Search Bar */}
        <form
          className={styles.searchForm}
          onSubmit={handleSearch}
        >
          {searching ? (
            <div style={{ color: theme.colors.brand.text }}>
              <svg width="16" height="16" viewBox="0 0 38 38" xmlns="http://www.w3.org/2000/svg" stroke="currentColor">
                <g fill="none" fillRule="evenodd">
                  <g transform="translate(1 1)" strokeWidth="2">
                    <circle strokeOpacity=".5" cx="18" cy="18" r="18"/>
                    <path d="M36 18c0-9.94-8.06-18-18-18">
                      <animateTransform 
                        attributeName="transform" 
                        type="rotate" 
                        from="0 18 18" 
                        to="360 18 18" 
                        dur="1s" 
                        repeatCount="indefinite"
                      />
                    </path>
                  </g>
                </g>
              </svg>
            </div>
          ) : (
            <FaSearch color={theme.colors.brand.text} />
          )}
          
          <input
            className={styles.searchInput}
            type='text'
            placeholder="Search contacts, calls, tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              border: 'none',
              backgroundColor: 'transparent',
              marginLeft: '0.5rem',
              width: '100%',
              color: theme.colors.brand.text,
            }}
          />
          
          {searchTerm && (
            <button 
              type="button" 
              onClick={clearSearch}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: theme.colors.brand.text
              }}
            >
              <FaTimes />
            </button>
          )}
        </form>
        
        {/* Search Results Popup */}
        {searchResults && (
          <SearchResults results={searchResults} onClose={() => setSearchResults(null)} />
        )}

        {/* User Menu */}
        <div className={styles.headerIcons}>
          <button className={styles.notificationButton}>
            <FaBell 
              color={theme.colors.brand.text} 
              size={20}
            />
            <span style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              backgroundColor: theme.colors.brand.primary,
              color: 'white',
              fontSize: '0.6rem',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              3
            </span>
          </button>
          
          {/* User Menu */}
          <div className={styles.userMenuContainer} ref={dropdownRef}>
            <div className={styles.userMenu} onClick={toggleDropdown}>
              <div className={styles.userAvatar}>
                <FaUser />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ color: theme.colors.brand.text }}>Team Member</span>
                <FaEllipsisV size={14} color={theme.colors.brand.text} />
              </div>
            </div>

            {/* Dropdown */}
            {isDropdownOpen && (
              <div className={styles.dropdown}>
                <div className={styles.dropdownItem} >
                  <Link href="/settings" style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
                    <FaCog />
                    <Button variant="ghost" size="small">
                      Account Settings
                    </Button>
                  </Link>
                </div>
                <div className={styles.dropdownItem} onClick={handleLogout}>
                  <FaSignOutAlt />
                  <Button variant="ghost" size="small">
                    Log Out
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}