// components/contacts/ContactTable.js - Optimized with React.memo and performance improvements
import React, { useState, useMemo, useCallback, memo } from 'react';
import { 
  FaSearch, 
  FaFilter, 
  FaAngleDown, 
  FaAngleUp,
  FaTrash,
  FaUserAlt,
  FaCheck
} from 'react-icons/fa';
import theme from '../../styles/theme';
import ContactRow from './ContactRow';
import Button from '../common/Button';
import BulkReassignModal from './BulkReassignModal';

const ContactTable = memo(({
  contacts,
  onEditContact,
  onLogCall,
  onAddTask,
  onDeleteContact,
  onContactUpdate,
  onReassignContact,
  onEditTask,
  onTaskStatusChange,
  loading,
  currentUser,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [expandedContactId, setExpandedContactId] = useState(null);
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedContacts, setSelectedContacts] = useState(new Set());
  const [bulkActionDropdownOpen, setBulkActionDropdownOpen] = useState(false);
  const [showBulkReassignModal, setShowBulkReassignModal] = useState(false);

  // Filter options
  const filterOptions = [
    { id: 'all', label: 'All Contacts' },
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

  // Function to get owner display name
  const getOwnerDisplay = (contact) => {
    if (contact.status === 'Open') {
      return 'Open';
    } else if (contact.assignedToUser) {
      return `${contact.assignedToUser.firstName} ${contact.assignedToUser.lastName}`;
    } else if (contact.assignedTo) {
      return 'Assigned';
    } else {
      return 'Open';
    }
  };

  // Memoized filtered contacts for performance
  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      const searchMatch = searchTerm === '' || 
        (contact.name && contact.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (contact.phone && contact.phone.includes(searchTerm)) ||
        (contact.company && contact.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (contact.region && contact.region.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Hide "Not Interested" contacts from "All Contacts" filter
      if (selectedFilter === 'all' && contact.lastCallOutcome === 'Not Interested') {
        return false;
      }
      
      const filter = filterOptions.find(f => f.id === selectedFilter);
      const filterMatch = selectedFilter === 'all' || 
        (filter.callOutcome && contact.lastCallOutcome === filter.callOutcome);
      
      return searchMatch && filterMatch;
    });
  }, [contacts, searchTerm, selectedFilter]);

  // Memoized sorted contacts for performance
  const sortedContacts = useMemo(() => {
    return [...filteredContacts].sort((a, b) => {
      let aValue = a[sortField] || '';
      let bValue = b[sortField] || '';
      
      // Special handling for assignedTo field
      if (sortField === 'assignedTo') {
        aValue = getOwnerDisplay(a);
        bValue = getOwnerDisplay(b);
      }

      if (sortDirection === 'asc') {
        return aValue.toString().localeCompare(bValue.toString());
      } else {
        return bValue.toString().localeCompare(aValue.toString());
      }
    });
  }, [filteredContacts, sortField, sortDirection]);

  // Memoized callback functions for performance
  const handleSort = useCallback((field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField, sortDirection]);

  const toggleExpand = useCallback((contactId) => {
    setExpandedContactId(expandedContactId === contactId ? null : contactId);
  }, [expandedContactId]);

  const handleSelectAll = useCallback(() => {
    if (selectedContacts.size === sortedContacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(sortedContacts.map(contact => contact.id)));
    }
  }, [selectedContacts.size, sortedContacts]);

  // Handle individual contact selection
  const handleSelectContact = (contactId) => {
    const newSelectedContacts = new Set(selectedContacts);
    if (newSelectedContacts.has(contactId)) {
      newSelectedContacts.delete(contactId);
    } else {
      newSelectedContacts.add(contactId);
    }
    setSelectedContacts(newSelectedContacts);
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedContacts.size === 0) return;
    
    const confirmMessage = `Are you sure you want to delete ${selectedContacts.size} contact${selectedContacts.size > 1 ? 's' : ''}? This action cannot be undone.`;
    if (!window.confirm(confirmMessage)) return;

    // Process deletions
    const deletePromises = Array.from(selectedContacts).map(contactId => 
      onDeleteContact(contactId)
    );

    try {
      await Promise.all(deletePromises);
      setSelectedContacts(new Set());
      setBulkActionDropdownOpen(false);
    } catch (error) {
      console.error('Error during bulk delete:', error);
      alert('Some contacts could not be deleted. Please try again.');
    }
  };

  // Handle bulk reassign
  const handleBulkReassign = () => {
    if (selectedContacts.size === 0) return;
    
    setBulkActionDropdownOpen(false);
    setShowBulkReassignModal(true);
  };
  
  // Handle successful bulk reassignment
  const handleBulkReassignComplete = () => {
    setSelectedContacts(new Set());
    setShowBulkReassignModal(false);
    
    // Refresh contacts list if a refresh function is provided
    if (onRefresh) {
      onRefresh();
    }
  };

  // Render sort indicator
  const renderSortIndicator = (field) => {
    if (sortField !== field) return null;
    
    return sortDirection === 'asc' 
      ? <FaAngleUp size={12} style={{ marginLeft: '4px' }} /> 
      : <FaAngleDown size={12} style={{ marginLeft: '4px' }} />;
  };

  return (
    <div className="contact-table-container" style={{ 
      width: '100%', 
      margin: 0, 
      padding: 0,
      minHeight: '100%',
      position: 'relative'
    }}>
      {/* Search and Filter Bar */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem',
        padding: '0 0.5rem'
      }}>
        {/* Search Input */}
        <div style={{ 
          position: 'relative',
          minWidth: '200px',
          flex: '1 1 300px',
          maxWidth: '500px'
        }}>
          <FaSearch 
            style={{ 
              position: 'absolute', 
              left: '12px', 
              top: '50%', 
              transform: 'translateY(-50%)',
              color: '#aaa',
              fontSize: '1rem'
            }} 
          />
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 12px 12px 42px',
              borderRadius: theme.borderRadius.sm,
              border: '1px solid #ddd',
              fontSize: '1rem'
            }}
          />
        </div>

        {/* Filter Buttons */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem',
          flexWrap: 'wrap'
        }}>
          <FaFilter style={{ color: theme.colors.brand.primary, fontSize: '1.1rem' }} />
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem',
            flexWrap: 'wrap'
          }}>
            {filterOptions.map(option => (
              <Button
                key={option.id}
                onClick={() => setSelectedFilter(option.id)}
                variant={selectedFilter === option.id ? 'primary' : 'outline'}
                size="small"
                tooltip={`Filter by ${option.label}`}
                style={{ 
                  padding: '0.6rem 1rem',
                  fontSize: '0.95rem'
                }}
              >
                {option.label}
                {selectedFilter === option.id && filteredContacts.length > 0 && 
                  ` (${filteredContacts.length})`}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar - Appears when contacts are selected */}
      {selectedContacts.size > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '1rem',
          backgroundColor: '#f8f9fa',
          borderRadius: theme.borderRadius.sm,
          marginBottom: '1rem',
          gap: '1rem'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            color: theme.colors.brand.primary,
            fontWeight: 'bold'
          }}>
            <FaCheck size={14} />
            {selectedContacts.size} selected
          </div>
          
          <div style={{ position: 'relative' }}>
            <Button
              onClick={() => setBulkActionDropdownOpen(!bulkActionDropdownOpen)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem' 
              }}
            >
              Bulk Actions <FaAngleDown size={14} />
            </Button>
            
            {bulkActionDropdownOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '0.25rem',
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: theme.borderRadius.sm,
                boxShadow: theme.shadows.sm,
                minWidth: '150px',
                zIndex: 10
              }}>
                <div
                  onClick={handleBulkDelete}
                  style={{
                    padding: '0.75rem 1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: '#e74c3c',
                    borderBottom: '1px solid #eee'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  <FaTrash size={14} /> Delete
                </div>
                
                {currentUser && currentUser.role === 'admin' && (
                  <div
                    onClick={handleBulkReassign}
                    style={{
                      padding: '0.75rem 1rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: theme.colors.brand.primary
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                  >
                    <FaUserAlt size={14} /> Reassign
                  </div>
                )}
              </div>
            )}
          </div>
          
          <Button
            variant="outline"
            onClick={() => setSelectedContacts(new Set())}
            style={{ marginLeft: 'auto' }}
          >
            Clear Selection
          </Button>
        </div>
      )}

      {/* The Contact Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner"></div>
          <p style={{ fontSize: '1.1rem', marginTop: '1rem' }}>Loading contacts...</p>
        </div>
      ) : filteredContacts.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem', 
          backgroundColor: '#f9f9f9',
          borderRadius: theme.borderRadius.md,
          margin: '0'
        }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>No contacts found matching your criteria</p>
          <Button 
            onClick={() => {
              setSearchTerm('');
              setSelectedFilter('all');
            }}
            style={{ 
              marginTop: '1rem',
              padding: '0.75rem 1.5rem',
              fontSize: '1rem'
            }}
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <div style={{ 
          overflowX: 'auto',
          width: '100%',
          margin: 0
        }}>
          <div style={{ 
            border: '1px solid #eee',
            borderRadius: theme.borderRadius.md,
            minWidth: '1100px',
            margin: 0,
            backgroundColor: 'white',
            overflow: 'visible', 
            boxShadow: theme.shadows.sm
          }}>
            {/* Table Header - Adjusted grid layout to match ContactRow */}
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: '40px minmax(150px, 2fr) minmax(120px, 1.5fr) minmax(150px, 2fr) minmax(100px, 1fr) minmax(100px, 1fr) minmax(100px, 1fr) minmax(120px, 1.5fr) 30px',
              backgroundColor: '#f8f9fa',
              padding: '1rem 1.5rem',
              borderBottom: '2px solid #eee',
              fontSize: '0.95rem',
              fontWeight: '600',
              color: theme.colors.brand.text,
              width: '100%'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <input
                  type="checkbox"
                  checked={selectedContacts.size === sortedContacts.length && sortedContacts.length > 0}
                  onChange={handleSelectAll}
                  style={{ cursor: 'pointer' }}
                  title="Select all contacts"
                />
              </div>
              <div 
                style={{ 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center'
                }}
                onClick={() => handleSort('name')}
                title="Sort by name"
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
                title="Sort by company"
              >
                Company {renderSortIndicator('company')}
              </div>
              <div title="Contact information">
                Contact Info
              </div>
              <div 
                style={{ 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center'
                }}
                onClick={() => handleSort('volume')}
                title="Sort by volume"
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
                title="Sort by region"
              >
                Region {renderSortIndicator('region')}
              </div>
              <div 
                style={{ 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center'
                }}
                onClick={() => handleSort('lastCallOutcome')}
                title="Sort by call outcome"
              >
                Status {renderSortIndicator('lastCallOutcome')}
              </div>
              {/* Owner column */}
              <div 
                style={{ 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center'
                }}
                onClick={() => handleSort('assignedTo')}
                title="Sort by owner"
              >
                Owner {renderSortIndicator('assignedTo')}
              </div>
              <div style={{ textAlign: 'center' }}>
                
              </div>
            </div>

            {/* Table Body */}
            <div>
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
                  onEditTask={onEditTask}
                  onTaskStatusChange={onTaskStatusChange}
                  currentUser={currentUser}
                  volumeOptions={volumeOptions}
                  regionOptions={regionOptions}
                  isSelected={selectedContacts.has(contact.id)}
                  onSelectContact={handleSelectContact}
                  getOwnerDisplay={getOwnerDisplay}
                />
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Show count when filtered */}
      {filteredContacts.length > 0 && (
        <div style={{ 
          textAlign: 'right', 
          marginTop: '1.5rem', 
          fontSize: '1rem', 
          color: theme.colors.brand.text,
          padding: '0 0.5rem',
          fontWeight: '500'
        }}>
          Showing {filteredContacts.length} of {contacts.length} contacts
        </div>
      )}
      
      {/* Bulk Reassign Modal */}
      {currentUser && currentUser.role === 'admin' && (
        <BulkReassignModal
          isOpen={showBulkReassignModal}
          onClose={() => setShowBulkReassignModal(false)}
          selectedContacts={selectedContacts}
          onReassign={handleBulkReassignComplete}
        />
      )}
    </div>
  );
});

ContactTable.displayName = 'ContactTable';

export default ContactTable;