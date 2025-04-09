import { useState } from 'react';
import { FaSearch, FaBell, FaUser, FaEllipsisV } from 'react-icons/fa';
import theme from '../../styles/theme';

export default function Header() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const handleSearch = (e) => {
    e.preventDefault();
    // Implement search functionality here
    console.log('Searching for:', searchTerm);
  };
  
  return (
    <header style={{
      backgroundColor: 'white',
      padding: '1rem 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: theme.shadows.sm,
      marginBottom: '2rem',
    }}>
      {/* Search Bar */}
      <form 
        onSubmit={handleSearch}
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: theme.colors.brand.background,
          borderRadius: theme.borderRadius.md,
          padding: '0.5rem 1rem',
          width: '100%',
          maxWidth: '500px',
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
            border: 'none',
            backgroundColor: 'transparent',
            marginLeft: '0.5rem',
            outline: 'none',
            width: '100%',
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
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          cursor: 'pointer',
        }}>
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
      </div>
    </header>
  );
}