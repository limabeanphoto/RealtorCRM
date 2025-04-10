import { useState, useRef, useEffect } from 'react';
import { FaSearch, FaBell, FaUser, FaEllipsisV, FaSignOutAlt, FaCog } from 'react-icons/fa';
import theme from '../../styles/theme';
import Button from './Button';
import styles from './Header.module.css';

export default function Header() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleSearch = (e) => {
    e.preventDefault();
    // Implement search functionality here
    console.log('Searching for:', searchTerm);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLogout = () => {
    // Placeholder for logout functionality
    console.log('Logging out...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // router.push('/login');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
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

        <div className={styles.searchContainer}>
      

      {/* Search Bar */}
      <form 
        onSubmit={handleSearch}
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: theme.colors.brand.background,
          borderRadius: theme.borderRadius.sm,
          width: '100%',
          maxWidth: '400px',
          padding: '0.5rem',
          border: '1px solid #e2e8f0',
        }}
      >
        <FaSearch color={theme.colors.brand.text} />
        <input 
          type="text"
          placeholder="Search contacts, calls, tasks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            border:'none',
            backgroundColor:'transparent',
            marginLeft: '0.5rem',
            width:'100%',
            color: theme.colors.brand.text,
            }}
        />
      </form>
      
      {/* User Menu */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
      }}>
        <button style={{
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
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
                <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: theme.colors.brand.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                }}>
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
              <div className={styles.dropdownItem}>
                <FaCog />
                <Button variant="ghost" size="small">
                  Settings
                </Button>
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