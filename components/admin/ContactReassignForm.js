// components/admin/ContactReassignForm.js
import { useState, useEffect } from 'react';
import Button from '../common/Button';
import theme from '../../styles/theme';

export default function ContactReassignForm({ 
  contact, 
  onCancel, 
  onSuccess 
}) {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [status, setStatus] = useState(contact?.status || 'Active');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Fetch available users
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
          setUsers(data.data);
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
    
    fetchUsers();
  }, []);
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      
      // Determine if this is an unassignment
      const isUnassigning = selectedUserId === 'unassign';
      
      const response = await fetch('/api/contacts/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          contactId: contact.id,
          userId: isUnassigning ? null : selectedUserId,
          newStatus: isUnassigning ? 'Open' : status // If unassigning, set to Open; otherwise use selected status
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        if (onSuccess) {
          onSuccess(data.data);
        }
      } else {
        setError(data.message || 'Failed to reassign contact');
      }
    } catch (err) {
      console.error('Error reassigning contact:', err);
      setError('Error reassigning contact');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div style={{ padding: '1rem', textAlign: 'center' }}>
        Loading team members...
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} style={{ padding: '1rem' }}>
      <h3 style={{ marginTop: 0 }}>Reassign Contact</h3>
      
      {contact && (
        <div style={{ 
          marginBottom: '1rem', 
          padding: '0.75rem', 
          backgroundColor: '#f8f9fa', 
          borderRadius: theme.borderRadius.sm,
          border: '1px solid #eee'
        }}>
          <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>{contact.name}</p>
          <p style={{ margin: '0', fontSize: '0.9rem' }}>
            Current status: <span style={{ fontWeight: 'bold' }}>{contact.status}</span>
            {contact.assignedToUser && (
              <> • Assigned to: <span style={{ fontWeight: 'bold' }}>
                {contact.assignedToUser.firstName} {contact.assignedToUser.lastName}
              </span></>
            )}
          </p>
        </div>
      )}
      
      {error && (
        <div style={{ 
          padding: '0.75rem', 
          marginBottom: '1rem',
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          borderRadius: theme.borderRadius.sm
        }}>
          {error}
        </div>
      )}
      
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Assign To:
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
              {user.firstName} {user.lastName} ({user.role})
            </option>
          ))}
          <option value="unassign">Unassign (Make Open)</option>
        </select>
      </div>
      
      {/* Only show status selection when assigning to a user (not unassigning) */}
      {selectedUserId && selectedUserId !== 'unassign' && (
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Status:
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
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
      )}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </Button>
        
        <Button
          type="submit"
          variant="primary"
          disabled={!selectedUserId || submitting}
        >
          {submitting ? 'Processing...' : (
            selectedUserId === 'unassign' ? 'Unassign Contact' : 'Reassign Contact'
          )}
        </Button>
      </div>
    </form>
  );
}