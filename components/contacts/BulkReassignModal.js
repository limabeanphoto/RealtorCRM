// components/contacts/BulkReassignModal.js
import { useState, useEffect } from 'react';
import BaseModal from '../common/BaseModal';
import Button from '../common/Button';
import theme from '../../styles/theme';
import { FaUser, FaCheck, FaExclamationTriangle } from 'react-icons/fa';

export default function BulkReassignModal({ 
  isOpen, 
  onClose, 
  selectedContacts, 
  onReassign 
}) {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [newStatus, setNewStatus] = useState('Active');
  const [volume, setVolume] = useState('');
  const [region, setRegion] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Volume and region options
  const volumeOptions = [
    { value: '', label: '-- No Change --' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' }
  ];

  const regionOptions = [
    { value: '', label: '-- No Change --' },
    { value: 'OC', label: 'Orange County' },
    { value: 'LA', label: 'Los Angeles' },
    { value: 'SD', label: 'San Diego' },
    { value: 'SF', label: 'San Francisco' },
    { value: 'other', label: 'Other' }
  ];

  // Fetch available users (team members)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/users', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const data = await response.json();
        
        if (data.success) {
          // Filter for member users only
          const memberUsers = data.data.filter(user => user.role === 'member');
          setUsers(memberUsers);
        } else {
          setError('Failed to load team members');
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Error loading team members');
        setLoading(false);
      }
    };
    
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  // Handle bulk reassignment
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedUserId || selectedUserId === 'unassign') {
      setError('Please select a team member to assign contacts to');
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      
      // Process each selected contact
      const reassignPromises = Array.from(selectedContacts).map(contactId => 
        fetch('/api/contacts/assign', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            contactId,
            userId: selectedUserId,
            newStatus,
            volume: volume || undefined,
            region: region || undefined
          })
        })
      );
      
      // Wait for all assignments to complete
      const responses = await Promise.all(reassignPromises);
      
      // Check for errors
      const errorResponses = responses.filter(response => !response.ok);
      
      if (errorResponses.length > 0) {
        setError(`Failed to reassign ${errorResponses.length} contacts`);
      } else {
        // Notify parent component of successful reassignment
        if (onReassign) {
          onReassign();
        }
        
        // Close modal
        onClose();
      }
    } catch (error) {
      console.error('Error reassigning contacts:', error);
      setError('An error occurred while reassigning contacts');
    } finally {
      setSubmitting(false);
    }
  };

  // Modal footer with action buttons
  const footerContent = (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
      <Button
        onClick={onClose}
        variant="outline"
        disabled={submitting}
      >
        Cancel
      </Button>
      <Button
        onClick={handleSubmit}
        variant="primary"
        disabled={!selectedUserId || submitting || loading}
      >
        {submitting ? 'Reassigning...' : `Reassign ${selectedContacts.size} Contacts`}
      </Button>
    </div>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Bulk Reassign Contacts"
      footerContent={footerContent}
      maxWidth="600px"
    >
      <div style={{ padding: '1rem' }}>
        {/* Contact count summary */}
        <div style={{ 
          backgroundColor: '#f0f9ff',
          padding: '1rem',
          borderRadius: theme.borderRadius.sm,
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <FaCheck size={18} color={theme.colors.brand.primary} />
          <span>
            <strong>{selectedContacts.size}</strong> contact{selectedContacts.size !== 1 ? 's' : ''} selected for reassignment
          </span>
        </div>

        {error && (
          <div style={{ 
            padding: '1rem', 
            marginBottom: '1rem',
            backgroundColor: '#fee2e2', 
            color: '#dc2626', 
            borderRadius: theme.borderRadius.sm,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <FaExclamationTriangle />
            {error}
          </div>
        )}
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            Loading team members...
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Team Member Selection */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: 'bold' 
              }}>
                Assign To: *
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                required
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  borderRadius: theme.borderRadius.sm,
                  border: '1px solid #ddd'
                }}
              >
                <option value="">-- Select Team Member --</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Status Selection */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: 'bold' 
              }}>
                New Status: *
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                required
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  borderRadius: theme.borderRadius.sm,
                  border: '1px solid #ddd'
                }}
              >
                <option value="Active">Active</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
            
            {/* Volume Selection */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: 'bold' 
              }}>
                Volume (optional):
              </label>
              <select
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  borderRadius: theme.borderRadius.sm,
                  border: '1px solid #ddd'
                }}
              >
                {volumeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Region Selection */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: 'bold' 
              }}>
                Region (optional):
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  borderRadius: theme.borderRadius.sm,
                  border: '1px solid #ddd'
                }}
              >
                {regionOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Info Message */}
            <div style={{ 
              backgroundColor: '#f8f9fa',
              padding: '1rem',
              borderRadius: theme.borderRadius.sm,
              marginTop: '1rem',
              fontSize: '0.9rem',
              color: theme.colors.brand.text
            }}>
              <p style={{ margin: '0' }}>
                Selected contacts will be reassigned to the chosen team member with the specified status. 
                {volume || region ? ' Volume and region will be updated for all selected contacts.' : ''}
              </p>
            </div>
          </form>
        )}
      </div>
    </BaseModal>
  );
}