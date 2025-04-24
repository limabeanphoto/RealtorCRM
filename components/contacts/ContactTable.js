import React, { useState, useEffect } from 'react';
import { 
  FaSearch, 
  FaFilter, 
  FaEllipsisV, 
  FaAngleDown, 
  FaAngleUp, 
  FaPhone, 
  FaTasks, 
  FaEdit, 
  FaTrash, 
  FaExternalLinkAlt 
} from 'react-icons/fa';
import theme from '../../styles/theme';
import ContactRow from './ContactRow';
import Button from '../common/Button';

const ContactTable = ({
  contacts,
  onEditContact,
  onLogCall,
  onAddTask,
  onDeleteContact,
  onContactUpdate,
  onReassignContact,
  loading,
  currentUser
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [expandedContactId, setExpandedContactId] = useState(null);
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  // Filter options - These could come from props too
  const filterOptions = [
    { id: 'all', label: 'All Contacts' },
    { id: 'open', label: 'Open', status: 'Open' },
    { id: 'active', label: 'Active', status: 'Active' },
    { id: 'closed', label: 'Closed', status: 'Closed' },
    { id: 'followUp', label: 'Follow Up', callOutcome: 'Follow Up' },
    { id: 'noAnswer', label: 'No Answer', callOutcome: 'No Answer' },
    { id: 'dealClosed', label: 'Deal Closed', callOutcome: 'Deal Closed' },
    { id: 'notInterested', label: 'Not Interested', callOutcome: 'Not Interested' }
  ];

  // Volume options
  const volumeOptions = [
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' }
  ];

  // Region options
  const regionOptions = [
    { value: 'OC', label: 'Orange County' },
    { value: 'LA', label: 'Los Angeles' },
    { value: 'SD', label: 'San Diego' },
    { value: 'SF', label: 'San Francisco' },
    { value: 'other', label: 'Other' }
  ];

  // Apply filters and search to contacts
  const filteredContacts = contacts.filter(contact => {
    // Text search on multiple fields
    const searchMatch = searchTerm === '' || 
      (contact.name && contact.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (contact.phone && contact.phone.includes(searchTerm)) ||
      (contact.company && contact.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (contact.region && contact.region.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filter by status or call outcome
    const filter = filterOptions.find(f => f.id === selectedFilter);
    const filterMatch = selectedFilter === 'all' || 
      (filter.status && contact.status === filter.status) ||
      (filter.callOutcome && contact.lastCallOutcome === filter.callOutcome);
    
    return searchMatch && filterMatch;
  });

  // Sort contacts based on current sort field and direction
  const sortedContacts = [...filteredContacts].sort((a, b) => {
    // Default values for null fields to ensure stable sorting
    const aValue = a[sortField] || '';
    const bValue = b[sortField] || '';

    // Handle different field types
    if (sortDirection === 'asc') {
      return aValue.toString().localeCompare(bValue.toString());
    } else {
      return bValue.toString().localeCompare(aValue.toString());
    }
  });

  // Handle sort header click
  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Toggle contact expansion
  const toggleExpand = (contactId) => {
    setExpandedContactId(expandedContactId === contactId ? null : contactId);
  };

  // Render sort indicator
  const renderSortIndicator = (field) => {
    if (sortField !== field) return null;
    
    return sortDirection === 'asc' 
      ? <FaAngleUp size={12} style={{ marginLeft: '4px' }} /> 
      : <FaAngleDown size={12} style={{ marginLeft: '4px' }} />;
  };

  return (
    <div className="contact-table-container">
      {/* Search and Filter Bar */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Search Input */}
        <div style={{ 
          position: 'relative',
          minWidth: '250px',
          flex: '1'
        }}>
          <FaSearch 
            style={{ 
              position: 'absolute', 
              left: '10px', 
              top: '50%', 
              transform: 'translateY(-50%)',
              color: '#aaa'
            }} 
          />
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 10px 10px 35px',
              borderRadius: theme.borderRadius.sm,
              border: '1px solid #ddd',
              fontSize: '0.9rem'
            }}
          />
        </div>

        {/* Filter Buttons */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          flexWrap: 'wrap'
        }}>
          <FaFilter style={{ color: theme.colors.brand.primary }} />
          <div style={{ 
            display: 'flex', 
            gap: '0.25rem',
            flexWrap: 'wrap'
          }}>
            {filterOptions.map(option => (
              <Button
                key={option.id}
                onClick={() => setSelectedFilter(option.id)}
                variant={selectedFilter === option.id ? 'primary' : 'outline'}
                size="small"
              >
                {option.label}
                {selectedFilter === option.id && filteredContacts.length > 0 && 
                  ` (${filteredContacts.length})`}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* The Contact Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="spinner"></div>
          <p>Loading contacts...</p>
        </div>
      ) : filteredContacts.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '2rem', 
          backgroundColor: '#f9f9f9',
          borderRadius: theme.borderRadius.md
        }}>
          <p>No contacts found matching your criteria</p>
          <Button 
            onClick={() => {
              setSearchTerm('');
              setSelectedFilter('all');
            }}
            style={{ marginTop: '1rem' }}
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <div style={{ 
          border: '1px solid #eee',
          borderRadius: theme.borderRadius.md,
          overflow: 'hidden'
        }}>
          {/* Table Header */}
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: '3fr 2fr 2fr 1fr 1fr 1fr 1fr',
            backgroundColor: '#f8f9fa',
            padding: '0.75rem 1rem',
            fontWeight: 'bold',
            borderBottom: '2px solid #eee'
          }}>
            <div 
              style={{ 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center' 
              }}
              onClick={() => handleSort('name')}
            >
              Name {renderSortIndicator('name')}
            </div>
            <div 
              style={{ 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center' 
              }}
              onClick={() => handleSort('company')}
            >
              Company {renderSortIndicator('company')}
            </div>
            <div>
              Contact Info
            </div>
            <div 
              style={{ 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center' 
              }}
              onClick={() => handleSort('volume')}
            >
              Volume {renderSortIndicator('volume')}
            </div>
            <div 
              style={{ 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center' 
              }}
              onClick={() => handleSort('region')}
            >
              Region {renderSortIndicator('region')}
            </div>
            <div 
              style={{ 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center' 
              }}
              onClick={() => handleSort('status')}
            >
              Status {renderSortIndicator('status')}
            </div>
            <div style={{ textAlign: 'center' }}>
              Actions
            </div>
          </div>

          {/* Table Body */}
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {sortedContacts.map(contact => (
              <ContactRow
                key={contact.id}
                contact={contact}
                expanded={expandedContactId === contact.id}
                onToggleExpand={() => toggleExpand(contact.id)}
                onEditContact={onEditContact}
                onLogCall={onLogCall}
                onAddTask={onAddTask}
                onDeleteContact={onDeleteContact}
                onContactUpdate={onContactUpdate}
                onReassignContact={onReassignContact}
                currentUser={currentUser}
                volumeOptions={volumeOptions}
                regionOptions={regionOptions}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Show count when filtered */}
      {filteredContacts.length > 0 && (
        <div style={{ 
          textAlign: 'right', 
          marginTop: '1rem', 
          fontSize: '0.9rem', 
          color: theme.colors.brand.text 
        }}>
          Showing {filteredContacts.length} of {contacts.length} contacts
        </div>
      )}
    </div>
  );
};

export default ContactTable;