import { useState, useEffect } from 'react';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import theme from '../styles/theme';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Spinner from '../components/common/Spinner';

export default function AccountSettings() {
  return (
    <ProtectedRoute>
      <div className="page-transition">
        <h1>Account Settings</h1>
        <SettingsForm />
      </div>
    </ProtectedRoute>
  );
}

const SettingsForm = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    cellPhone: '',
  });

  const [originalData, setOriginalData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [passwordVisible, setPasswordVisible] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        // Get user from localStorage as a fallback
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        
        // Attempt to fetch from API
        const token = localStorage.getItem('token');
        try {
          const response = await fetch(`/api/users/${userData.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          const data = await response.json();
          
          if (data.success) {
            // Format the user data
            const apiUserData = {
              firstName: data.data.firstName || '',
              lastName: data.data.lastName || '',
              email: data.data.email || '',
              cellPhone: data.data.cellPhone || '',
            };
            
            setFormData(prev => ({ 
              ...prev,
              ...apiUserData
            }));
            
            setOriginalData(apiUserData);
          } else {
            // If API fails, use localStorage data as fallback
            setFormData(prev => ({
              ...prev,
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              email: userData.email || '',
              cellPhone: userData.cellPhone || '',
            }));
            
            setOriginalData({
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              email: userData.email || '',
              cellPhone: userData.cellPhone || '',
            });
          }
        } catch (error) {
          console.error('Error fetching user data from API:', error);
          // Use localStorage as fallback
          setFormData(prev => ({
            ...prev,
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            email: userData.email || '',
            cellPhone: userData.cellPhone || '',
          }));
          
          setOriginalData({
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            email: userData.email || '',
            cellPhone: userData.cellPhone || '',
          });
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading user data:', error);
        setMessage({ text: 'Error loading user data', type: 'error' });
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    // Reset message
    setMessage({ text: '', type: '' });
    
    // Check if email is valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      setMessage({ text: 'Please enter a valid email address', type: 'error' });
      return false;
    }
    
    // Check if passwords match when changing password
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setMessage({ text: 'New passwords do not match', type: 'error' });
      return false;
    }
    
    // Check if current password is provided when setting new password
    if (formData.newPassword && !formData.currentPassword) {
      setMessage({ text: 'Current password is required to set a new password', type: 'error' });
      return false;
    }
    
    // Check if new password meets requirements
    if (formData.newPassword && formData.newPassword.length < 8) {
      setMessage({ text: 'New password must be at least 8 characters long', type: 'error' });
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Check if anything has changed
    const hasProfileChanges = 
      formData.firstName !== originalData.firstName ||
      formData.lastName !== originalData.lastName ||
      formData.email !== originalData.email ||
      formData.cellPhone !== originalData.cellPhone;
      
    const hasPasswordChange = !!formData.newPassword;
    
    if (!hasProfileChanges && !hasPasswordChange) {
      setMessage({ text: 'No changes to save', type: 'info' });
      return;
    }
    
    setSaving(true);
    
    try {
      const userId = JSON.parse(localStorage.getItem('user') || '{}').id;
      const token = localStorage.getItem('token');
      
      // Only include fields that have changed
      const updateData = {};
      
      if (formData.firstName !== originalData.firstName) updateData.firstName = formData.firstName;
      if (formData.lastName !== originalData.lastName) updateData.lastName = formData.lastName;
      if (formData.email !== originalData.email) updateData.email = formData.email;
      if (formData.cellPhone !== originalData.cellPhone) updateData.cellPhone = formData.cellPhone;
      
      // Add password fields if changing password
      if (hasPasswordChange) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }
      
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update local storage user data
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedUser = {
          ...currentUser,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Update original data to reflect saved changes
        setOriginalData({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          cellPhone: formData.cellPhone,
        });
        
        // Clear password fields
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
        
        setMessage({ text: 'Settings updated successfully!', type: 'success' });
      } else {
        setMessage({ text: `Error updating settings: ${data.message}`, type: 'error' });
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      setMessage({ text: 'Error updating settings. Please try again.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setPasswordVisible(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <Spinner />
          <p>Loading account information...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        {message.text && (
          <div style={{ 
            padding: '0.75rem',
            marginBottom: '1.5rem',
            borderRadius: theme.borderRadius.md,
            backgroundColor: message.type === 'error' ? '#f8d7da' : 
                             message.type === 'success' ? '#d4edda' :
                             message.type === 'info' ? '#cce5ff' : '#f8f9fa',
            color: message.type === 'error' ? '#721c24' : 
                   message.type === 'success' ? '#155724' :
                   message.type === 'info' ? '#004085' : '#383d41',
            border: `1px solid ${message.type === 'error' ? '#f5c6cb' : 
                                 message.type === 'success' ? '#c3e6cb' :
                                 message.type === 'info' ? '#b8daff' : '#d6d8db'}`
          }}>
            {message.text}
          </div>
        )}

        <div style={{ marginBottom: '1.5rem' }}>
          <h2>Profile Information</h2>
          <p style={{ color: theme.colors.brand.text, fontSize: '0.9rem', marginBottom: '1rem' }}>
            Update your account information and how we contact you.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label htmlFor="firstName" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                style={{ 
                  width: '100%', 
                  padding: '0.75rem',
                  borderRadius: theme.borderRadius.sm,
                  border: '1px solid #ddd'
                }}
              />
            </div>
            
            <div>
              <label htmlFor="lastName" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                style={{ 
                  width: '100%', 
                  padding: '0.75rem',
                  borderRadius: theme.borderRadius.sm,
                  border: '1px solid #ddd'
                }}
              />
            </div>
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              style={{ 
                width: '100%', 
                padding: '0.75rem',
                borderRadius: theme.borderRadius.sm,
                border: '1px solid #ddd'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="cellPhone" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Cell Phone
            </label>
            <input
              type="tel"
              id="cellPhone"
              name="cellPhone"
              value={formData.cellPhone}
              onChange={handleChange}
              style={{ 
                width: '100%', 
                padding: '0.75rem',
                borderRadius: theme.borderRadius.sm,
                border: '1px solid #ddd'
              }}
            />
          </div>
        </div>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <h2>Change Password</h2>
          <p style={{ color: theme.colors.brand.text, fontSize: '0.9rem', marginBottom: '1rem' }}>
            Leave these fields blank if you don't want to change your password.
          </p>
          
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="currentPassword" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Current Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={passwordVisible.current ? 'text' : 'password'}
                id="currentPassword"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                style={{ 
                  width: '100%', 
                  padding: '0.75rem',
                  borderRadius: theme.borderRadius.sm,
                  border: '1px solid #ddd'
                }}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('current')}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: theme.colors.brand.primary
                }}
              >
                {passwordVisible.current ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label htmlFor="newPassword" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={passwordVisible.new ? 'text' : 'password'}
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem',
                    borderRadius: theme.borderRadius.sm,
                    border: '1px solid #ddd'
                  }}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: theme.colors.brand.primary
                  }}
                >
                  {passwordVisible.new ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            
            <div>
              <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Confirm New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={passwordVisible.confirm ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem',
                    borderRadius: theme.borderRadius.sm,
                    border: '1px solid #ddd'
                  }}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: theme.colors.brand.primary
                  }}
                >
                  {passwordVisible.confirm ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
          </div>
          
          {formData.newPassword && (
            <div style={{
              padding: '0.75rem',
              backgroundColor: '#f8f9fa',
              borderRadius: theme.borderRadius.sm,
              marginBottom: '1rem',
              fontSize: '0.9rem'
            }}>
              <p style={{ margin: 0, fontWeight: 'bold' }}>Password Requirements:</p>
              <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                <li style={{ marginBottom: '0.25rem', color: formData.newPassword.length >= 8 ? theme.colors.brand.primary : theme.colors.brand.text }}>
                  At least 8 characters
                </li>
                <li style={{ marginBottom: '0.25rem', color: /[A-Z]/.test(formData.newPassword) ? theme.colors.brand.primary : theme.colors.brand.text }}>
                  At least one uppercase letter
                </li>
                <li style={{ marginBottom: '0.25rem', color: /[0-9]/.test(formData.newPassword) ? theme.colors.brand.primary : theme.colors.brand.text }}>
                  At least one number
                </li>
              </ul>
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
          <Button
            type="submit"
            disabled={saving}
            variant="primary"
            style={{ minWidth: '120px' }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Card>
  );
};