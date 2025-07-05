import { useState, useEffect } from 'react';
import { 
  FaUser, FaCog, FaUsers, FaPlug, FaPhone, FaSync, FaCheck, FaTimes, 
  FaExclamationTriangle, FaSms, FaEye, FaEyeSlash, FaEdit, FaTrash, FaPlus 
} from 'react-icons/fa';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import theme from '../styles/theme';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Spinner from '../components/common/Spinner';

export default function Settings() {
  return (
    <ProtectedRoute>
      <div className="page-transition">
        <h1 style={{ marginBottom: '2rem' }}>Settings</h1>
        <ModernSettingsInterface />
      </div>
    </ProtectedRoute>
  );
}

const ModernSettingsInterface = () => {
  const [activeTab, setActiveTab] = useState('account');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        setUser(userData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading user data:', error);
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  const tabs = [
    { id: 'account', label: 'Account', icon: FaUser },
    { id: 'preferences', label: 'Preferences', icon: FaCog },
    { id: 'integrations', label: 'Integrations', icon: FaPlug },
    ...(user?.role === 'admin' ? [{ id: 'team', label: 'Team', icon: FaUsers }] : [])
  ];

  const tabContainerStyle = {
    backgroundColor: '#ffffff',
    borderRadius: theme.borderRadius.lg,
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    overflow: 'hidden'
  };

  const tabHeaderStyle = {
    display: 'flex',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb'
  };

  const tabButtonStyle = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '1rem 1.5rem',
    border: 'none',
    backgroundColor: isActive ? '#ffffff' : 'transparent',
    color: isActive ? theme.colors.brand.primary : '#6b7280',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: isActive ? '600' : '400',
    transition: 'all 0.2s ease',
    borderBottom: isActive ? `2px solid ${theme.colors.brand.primary}` : '2px solid transparent',
    ':hover': {
      backgroundColor: isActive ? '#ffffff' : '#f3f4f6'
    }
  });

  const tabContentStyle = {
    padding: '2rem',
    minHeight: '600px'
  };

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <Spinner />
          <p>Loading settings...</p>
        </div>
      </Card>
    );
  }

  return (
    <div style={tabContainerStyle}>
      {/* Tab Navigation */}
      <div style={tabHeaderStyle}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={tabButtonStyle(activeTab === tab.id)}
            onMouseEnter={(e) => {
              if (activeTab !== tab.id) {
                e.target.style.backgroundColor = '#f3f4f6';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.id) {
                e.target.style.backgroundColor = 'transparent';
              }
            }}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={tabContentStyle}>
        {activeTab === 'account' && <AccountTab />}
        {activeTab === 'preferences' && <PreferencesTab />}
        {activeTab === 'integrations' && <IntegrationsTab />}
        {activeTab === 'team' && user?.role === 'admin' && <TeamTab />}
      </div>
    </div>
  );
};

// Account Tab Component
const AccountTab = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    cellPhone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
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
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const token = localStorage.getItem('token');
        
        try {
          const response = await fetch(`/api/users/${userData.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();
          
          if (data.success) {
            const apiUserData = {
              firstName: data.data.firstName || '',
              lastName: data.data.lastName || '',
              email: data.data.email || '',
              cellPhone: data.data.cellPhone || ''
            };
            setFormData(prev => ({ ...prev, ...apiUserData }));
            setOriginalData(apiUserData);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading user data:', error);
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    setMessage({ text: '', type: '' });
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      setMessage({ text: 'Please enter a valid email address', type: 'error' });
      return false;
    }
    
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setMessage({ text: 'New passwords do not match', type: 'error' });
      return false;
    }
    
    if (formData.newPassword && !formData.currentPassword) {
      setMessage({ text: 'Current password is required to set a new password', type: 'error' });
      return false;
    }
    
    if (formData.newPassword && formData.newPassword.length < 8) {
      setMessage({ text: 'New password must be at least 8 characters long', type: 'error' });
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
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
      
      const updateData = {};
      
      if (formData.firstName !== originalData.firstName) updateData.firstName = formData.firstName;
      if (formData.lastName !== originalData.lastName) updateData.lastName = formData.lastName;
      if (formData.email !== originalData.email) updateData.email = formData.email;
      if (formData.cellPhone !== originalData.cellPhone) updateData.cellPhone = formData.cellPhone;
      
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
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedUser = {
          ...currentUser,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          cellPhone: formData.cellPhone
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        setOriginalData({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          cellPhone: formData.cellPhone
        });
        
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
        
        setMessage({ text: 'Account updated successfully!', type: 'success' });
      } else {
        setMessage({ text: `Error updating account: ${data.message}`, type: 'error' });
      }
    } catch (error) {
      console.error('Error updating account:', error);
      setMessage({ text: 'Error updating account. Please try again.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setPasswordVisible(prev => ({ ...prev, [field]: !prev[field] }));
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}><Spinner /></div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: theme.colors.brand.primary, marginBottom: '0.5rem' }}>Account Information</h2>
        <p style={{ color: '#6b7280', margin: 0 }}>Manage your profile and security settings</p>
      </div>

      <form onSubmit={handleSubmit}>
        {message.text && (
          <div style={{ 
            padding: '1rem',
            marginBottom: '1.5rem',
            borderRadius: theme.borderRadius.md,
            backgroundColor: message.type === 'error' ? '#fef2f2' : 
                             message.type === 'success' ? '#f0fdf4' :
                             message.type === 'info' ? '#eff6ff' : '#f9fafb',
            color: message.type === 'error' ? '#dc2626' : 
                   message.type === 'success' ? '#16a34a' :
                   message.type === 'info' ? '#2563eb' : '#374151',
            border: `1px solid ${message.type === 'error' ? '#fecaca' : 
                                 message.type === 'success' ? '#bbf7d0' :
                                 message.type === 'info' ? '#bfdbfe' : '#e5e7eb'}`
          }}>
            {message.text}
          </div>
        )}

        {/* Profile Section */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', color: '#374151' }}>Profile Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                style={{ 
                  width: '100%', 
                  padding: '0.75rem',
                  borderRadius: theme.borderRadius.md,
                  border: '1px solid #d1d5db',
                  fontSize: '0.9rem',
                  transition: 'border-color 0.2s ease',
                  ':focus': {
                    borderColor: theme.colors.brand.primary,
                    outline: 'none'
                  }
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                style={{ 
                  width: '100%', 
                  padding: '0.75rem',
                  borderRadius: theme.borderRadius.md,
                  border: '1px solid #d1d5db',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              style={{ 
                width: '100%', 
                padding: '0.75rem',
                borderRadius: theme.borderRadius.md,
                border: '1px solid #d1d5db',
                fontSize: '0.9rem'
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
              Cell Phone
            </label>
            <input
              type="tel"
              name="cellPhone"
              value={formData.cellPhone}
              onChange={handleChange}
              style={{ 
                width: '100%', 
                padding: '0.75rem',
                borderRadius: theme.borderRadius.md,
                border: '1px solid #d1d5db',
                fontSize: '0.9rem'
              }}
            />
          </div>
        </div>

        {/* Security Section */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', color: '#374151' }}>Security</h3>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Leave password fields blank if you don't want to change your password.
          </p>
          
          {formData.newPassword && (
            <div style={{
              padding: '1rem',
              backgroundColor: '#f9fafb',
              borderRadius: theme.borderRadius.md,
              marginBottom: '1rem',
              fontSize: '0.9rem'
            }}>
              <p style={{ margin: 0, fontWeight: '500' }}>Password Requirements:</p>
              <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem' }}>
                <li style={{ color: formData.newPassword.length >= 8 ? '#16a34a' : '#6b7280' }}>
                  At least 8 characters
                </li>
                <li style={{ color: /[A-Z]/.test(formData.newPassword) ? '#16a34a' : '#6b7280' }}>
                  At least one uppercase letter
                </li>
                <li style={{ color: /[0-9]/.test(formData.newPassword) ? '#16a34a' : '#6b7280' }}>
                  At least one number
                </li>
              </ul>
            </div>
          )}
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
              Current Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={passwordVisible.current ? 'text' : 'password'}
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                style={{ 
                  width: '100%', 
                  padding: '0.75rem',
                  paddingRight: '3rem',
                  borderRadius: theme.borderRadius.md,
                  border: '1px solid #d1d5db',
                  fontSize: '0.9rem'
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
                  color: '#6b7280'
                }}
              >
                {passwordVisible.current ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={passwordVisible.new ? 'text' : 'password'}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem',
                    paddingRight: '3rem',
                    borderRadius: theme.borderRadius.md,
                    border: '1px solid #d1d5db',
                    fontSize: '0.9rem'
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
                    color: '#6b7280'
                  }}
                >
                  {passwordVisible.new ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                Confirm New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={passwordVisible.confirm ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem',
                    paddingRight: '3rem',
                    borderRadius: theme.borderRadius.md,
                    border: '1px solid #d1d5db',
                    fontSize: '0.9rem'
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
                    color: '#6b7280'
                  }}
                >
                  {passwordVisible.confirm ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
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
    </div>
  );
};

// Preferences Tab Component
const PreferencesTab = () => {
  const [formData, setFormData] = useState({
    dailyCallGoal: 30,
    dailyDealGoal: 5,
    dailyContactGoal: 10
  });

  const [originalData, setOriginalData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const token = localStorage.getItem('token');
        
        try {
          const response = await fetch(`/api/users/${userData.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();
          
          if (data.success) {
            const apiUserData = {
              dailyCallGoal: data.data.dailyCallGoal || 30,
              dailyDealGoal: data.data.dailyDealGoal || 5,
              dailyContactGoal: data.data.dailyContactGoal || 10
            };
            setFormData(apiUserData);
            setOriginalData(apiUserData);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading user data:', error);
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
  };

  const validateForm = () => {
    setMessage({ text: '', type: '' });
    
    if (formData.dailyCallGoal < 1 || formData.dailyCallGoal > 200) {
      setMessage({ text: 'Daily call goal must be between 1 and 200', type: 'error' });
      return false;
    }
    
    if (formData.dailyDealGoal < 1 || formData.dailyDealGoal > 50) {
      setMessage({ text: 'Daily deal goal must be between 1 and 50', type: 'error' });
      return false;
    }
    
    if (formData.dailyContactGoal < 1 || formData.dailyContactGoal > 100) {
      setMessage({ text: 'Daily contact goal must be between 1 and 100', type: 'error' });
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const hasChanges = 
      formData.dailyCallGoal !== originalData.dailyCallGoal ||
      formData.dailyDealGoal !== originalData.dailyDealGoal ||
      formData.dailyContactGoal !== originalData.dailyContactGoal;
    
    if (!hasChanges) {
      setMessage({ text: 'No changes to save', type: 'info' });
      return;
    }
    
    setSaving(true);
    
    try {
      const userId = JSON.parse(localStorage.getItem('user') || '{}').id;
      const token = localStorage.getItem('token');
      
      const updateData = {};
      if (formData.dailyCallGoal !== originalData.dailyCallGoal) updateData.dailyCallGoal = formData.dailyCallGoal;
      if (formData.dailyDealGoal !== originalData.dailyDealGoal) updateData.dailyDealGoal = formData.dailyDealGoal;
      if (formData.dailyContactGoal !== originalData.dailyContactGoal) updateData.dailyContactGoal = formData.dailyContactGoal;
      
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
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedUser = {
          ...currentUser,
          dailyCallGoal: formData.dailyCallGoal,
          dailyDealGoal: formData.dailyDealGoal,
          dailyContactGoal: formData.dailyContactGoal
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        window.dispatchEvent(new CustomEvent('userSettingsUpdated'));
        
        setOriginalData({
          dailyCallGoal: formData.dailyCallGoal,
          dailyDealGoal: formData.dailyDealGoal,
          dailyContactGoal: formData.dailyContactGoal
        });
        
        setMessage({ text: 'Preferences updated successfully!', type: 'success' });
      } else {
        setMessage({ text: `Error updating preferences: ${data.message}`, type: 'error' });
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      setMessage({ text: 'Error updating preferences. Please try again.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}><Spinner /></div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: theme.colors.brand.primary, marginBottom: '0.5rem' }}>Preferences</h2>
        <p style={{ color: '#6b7280', margin: 0 }}>Configure your daily goals and application preferences</p>
      </div>

      <form onSubmit={handleSubmit}>
        {message.text && (
          <div style={{ 
            padding: '1rem',
            marginBottom: '1.5rem',
            borderRadius: theme.borderRadius.md,
            backgroundColor: message.type === 'error' ? '#fef2f2' : 
                             message.type === 'success' ? '#f0fdf4' :
                             message.type === 'info' ? '#eff6ff' : '#f9fafb',
            color: message.type === 'error' ? '#dc2626' : 
                   message.type === 'success' ? '#16a34a' :
                   message.type === 'info' ? '#2563eb' : '#374151',
            border: `1px solid ${message.type === 'error' ? '#fecaca' : 
                                 message.type === 'success' ? '#bbf7d0' :
                                 message.type === 'info' ? '#bfdbfe' : '#e5e7eb'}`
          }}>
            {message.text}
          </div>
        )}

        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', color: '#374151' }}>Daily Goals</h3>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Set your personal daily targets to track progress on your dashboard.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                Daily Call Goal
              </label>
              <input
                type="number"
                name="dailyCallGoal"
                value={formData.dailyCallGoal}
                onChange={handleChange}
                min="1"
                max="200"
                style={{ 
                  width: '100%', 
                  padding: '0.75rem',
                  borderRadius: theme.borderRadius.md,
                  border: '1px solid #d1d5db',
                  fontSize: '0.9rem'
                }}
              />
              <small style={{ color: '#6b7280', fontSize: '0.8rem', display: 'block', marginTop: '0.25rem' }}>
                How many calls do you want to make per day?
              </small>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                Daily Deal Goal
              </label>
              <input
                type="number"
                name="dailyDealGoal"
                value={formData.dailyDealGoal}
                onChange={handleChange}
                min="1"
                max="50"
                style={{ 
                  width: '100%', 
                  padding: '0.75rem',
                  borderRadius: theme.borderRadius.md,
                  border: '1px solid #d1d5db',
                  fontSize: '0.9rem'
                }}
              />
              <small style={{ color: '#6b7280', fontSize: '0.8rem', display: 'block', marginTop: '0.25rem' }}>
                Target number of deals to close per day
              </small>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                Daily Contact Goal
              </label>
              <input
                type="number"
                name="dailyContactGoal"
                value={formData.dailyContactGoal}
                onChange={handleChange}
                min="1"
                max="100"
                style={{ 
                  width: '100%', 
                  padding: '0.75rem',
                  borderRadius: theme.borderRadius.md,
                  border: '1px solid #d1d5db',
                  fontSize: '0.9rem'
                }}
              />
              <small style={{ color: '#6b7280', fontSize: '0.8rem', display: 'block', marginTop: '0.25rem' }}>
                New contacts to add each day
              </small>
            </div>
          </div>
          
          <div style={{
            padding: '1rem',
            backgroundColor: '#eff6ff',
            borderRadius: theme.borderRadius.md,
            marginTop: '1.5rem',
            fontSize: '0.9rem'
          }}>
            <p style={{ margin: '0', fontWeight: '500', color: '#1e40af' }}>💡 Pro Tip:</p>
            <p style={{ margin: '0.5rem 0 0 0', color: '#1e40af' }}>
              Set realistic but challenging goals. These targets will show up on your dashboard to help track your daily progress.
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
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
    </div>
  );
};

// Integrations Tab Component  
const IntegrationsTab = () => {
  const [user, setUser] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncingTo, setSyncingTo] = useState(false);
  const [syncingFrom, setSyncingFrom] = useState(false);
  const [setupingWebhooks, setSetupingWebhooks] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [apiKey, setApiKey] = useState('');
  const [apiKeyVisible, setApiKeyVisible] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        setUser(userData);
        setApiKey(userData.openPhoneApiKey || '');
        
        if (userData.openPhoneApiKey) {
          await testConnection();
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading user data:', error);
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  const testConnection = async () => {
    setTesting(true);
    try {
      const response = await fetch('/api/openphone?action=test-connection', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      const result = await response.json();
      setConnectionStatus(result);
      
      if (result.success) {
        setMessage({ text: 'OpenPhone connection successful!', type: 'success' });
      } else {
        setMessage({ text: `Connection failed: ${result.error}`, type: 'error' });
      }
    } catch (error) {
      setConnectionStatus({ success: false, error: 'Network error' });
      setMessage({ text: 'Failed to test connection', type: 'error' });
    } finally {
      setTesting(false);
    }
  };

  const handleApiKeySubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const userId = JSON.parse(localStorage.getItem('user') || '{}').id;
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ openPhoneApiKey: apiKey })
      });
      
      const data = await response.json();
      
      if (data.success) {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedUser = { ...currentUser, openPhoneApiKey: apiKey };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        
        setMessage({ text: 'API key saved successfully!', type: 'success' });
        
        if (apiKey) {
          await testConnection();
        }
      } else {
        setMessage({ text: `Error saving API key: ${data.message}`, type: 'error' });
      }
    } catch (error) {
      console.error('Error saving API key:', error);
      setMessage({ text: 'Error saving API key. Please try again.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const syncContactsToOpenPhone = async () => {
    setSyncingTo(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await fetch('/api/openphone?action=sync-contacts-to-openphone', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      const result = await response.json();

      if (result.success) {
        const { total, synced, failed } = result.results;
        setMessage({
          text: `Sync completed: ${synced}/${total} contacts synced to OpenPhone${failed > 0 ? `, ${failed} failed` : ''}`,
          type: failed > 0 ? 'warning' : 'success'
        });
      } else {
        setMessage({ text: `Sync failed: ${result.error}`, type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'Failed to sync contacts', type: 'error' });
    } finally {
      setSyncingTo(false);
    }
  };

  const syncContactsFromOpenPhone = async () => {
    setSyncingFrom(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await fetch('/api/openphone?action=sync-contacts-from-openphone', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      const result = await response.json();

      if (result.success) {
        const { total, created, updated } = result.results;
        setMessage({
          text: `Sync completed: ${created} new contacts created, ${updated} contacts updated from ${total} OpenPhone contacts`,
          type: 'success'
        });
      } else {
        setMessage({ text: `Sync failed: ${result.error}`, type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'Failed to sync contacts', type: 'error' });
    } finally {
      setSyncingFrom(false);
    }
  };

  const setupWebhooks = async () => {
    setSetupingWebhooks(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await fetch('/api/openphone?action=setup-webhooks', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      const result = await response.json();

      if (result.success) {
        setMessage({
          text: 'Webhooks configured successfully! Call logging will now work automatically.',
          type: 'success'
        });
      } else {
        setMessage({ text: `Webhook setup failed: ${result.error}`, type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'Failed to setup webhooks', type: 'error' });
    } finally {
      setSetupingWebhooks(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}><Spinner /></div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: theme.colors.brand.primary, marginBottom: '0.5rem' }}>Integrations</h2>
        <p style={{ color: '#6b7280', margin: 0 }}>Connect and manage your third-party integrations</p>
      </div>

      {message.text && (
        <div style={{
          padding: '0.75rem',
          marginBottom: '1rem',
          borderRadius: theme.borderRadius.md,
          backgroundColor: message.type === 'error' ? '#fef2f2' : 
                           message.type === 'success' ? '#f0fdf4' :
                           message.type === 'warning' ? '#fffbeb' : '#eff6ff',
          color: message.type === 'error' ? '#dc2626' : 
                 message.type === 'success' ? '#16a34a' :
                 message.type === 'warning' ? '#d97706' : '#2563eb',
          border: `1px solid ${message.type === 'error' ? '#fecaca' : 
                               message.type === 'success' ? '#bbf7d0' :
                               message.type === 'warning' ? '#fed7aa' : '#bfdbfe'}`,
          fontSize: '0.9rem'
        }}>
          {message.text}
        </div>
      )}

      {/* OpenPhone Integration */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaPhone color={theme.colors.brand.primary} size={18} />
            <h3 style={{ margin: 0, color: '#374151' }}>OpenPhone</h3>
            {connectionStatus?.success ? (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.25rem',
                padding: '0.125rem 0.5rem',
                backgroundColor: '#f0fdf4',
                borderRadius: theme.borderRadius.sm,
                fontSize: '0.75rem',
                color: '#16a34a'
              }}>
                <FaCheck size={10} />
                Connected
              </div>
            ) : connectionStatus?.success === false ? (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.25rem',
                padding: '0.125rem 0.5rem',
                backgroundColor: '#fef2f2',
                borderRadius: theme.borderRadius.sm,
                fontSize: '0.75rem',
                color: '#dc2626'
              }}>
                <FaTimes size={10} />
                Failed
              </div>
            ) : null}
          </div>
        </div>
        
        {/* API Key Configuration */}
        <div style={{ 
          padding: '1rem',
          backgroundColor: '#f9fafb',
          borderRadius: theme.borderRadius.md,
          border: '1px solid #e5e7eb',
          marginBottom: '1rem'
        }}>
          <form onSubmit={handleApiKeySubmit}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151', fontSize: '0.9rem' }}>
                  API Key
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={apiKeyVisible ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your OpenPhone API key..."
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem',
                      paddingRight: '3rem',
                      borderRadius: theme.borderRadius.md,
                      border: '1px solid #d1d5db',
                      fontSize: '0.9rem',
                      fontFamily: 'monospace'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setApiKeyVisible(!apiKeyVisible)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#6b7280'
                    }}
                  >
                    {apiKeyVisible ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                <small style={{ color: '#6b7280', fontSize: '0.75rem', display: 'block', marginTop: '0.25rem' }}>
                  Get your API key from OpenPhone Settings → API
                </small>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button
                  type="submit"
                  disabled={saving}
                  variant="primary"
                >
                  {saving ? 'Saving...' : 'Save'}
                </Button>
                {apiKey && (
                  <Button
                    type="button"
                    onClick={testConnection}
                    disabled={testing}
                    variant="secondary"
                  >
                    {testing ? 'Testing...' : 'Test'}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Integration Actions - Compact Layout */}
        {apiKey && connectionStatus?.success && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            {/* Contact Sync */}
            <div style={{
              padding: '1rem',
              backgroundColor: '#f9fafb',
              borderRadius: theme.borderRadius.md,
              border: '1px solid #e5e7eb'
            }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#374151', fontSize: '0.9rem' }}>Contact Sync</h4>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button
                  onClick={syncContactsToOpenPhone}
                  disabled={syncingTo}
                  variant="primary"
                  size="sm"
                  style={{ flex: 1 }}
                >
                  {syncingTo ? 'Syncing...' : 'To OpenPhone'}
                </Button>
                <Button
                  onClick={syncContactsFromOpenPhone}
                  disabled={syncingFrom}
                  variant="secondary"
                  size="sm"
                  style={{ flex: 1 }}
                >
                  {syncingFrom ? 'Syncing...' : 'From OpenPhone'}
                </Button>
              </div>
            </div>

            {/* Call Logging */}
            <div style={{
              padding: '1rem',
              backgroundColor: '#f9fafb',
              borderRadius: theme.borderRadius.md,
              border: '1px solid #e5e7eb'
            }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#374151', fontSize: '0.9rem' }}>Call Logging</h4>
              <Button
                onClick={setupWebhooks}
                disabled={setupingWebhooks}
                variant="primary"
                size="sm"
                style={{ width: '100%' }}
              >
                {setupingWebhooks ? 'Setting up...' : 'Setup Webhooks'}
              </Button>
            </div>
          </div>
        )}

        {/* Available Features - Compact */}
        {apiKey && connectionStatus?.success && (
          <div style={{
            padding: '1rem',
            backgroundColor: '#f9fafb',
            borderRadius: theme.borderRadius.md,
            border: '1px solid #e5e7eb'
          }}>
            <h4 style={{ margin: '0 0 0.75rem 0', color: '#374151', fontSize: '0.9rem' }}>Available Features</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280' }}>
                <FaPhone color={theme.colors.brand.primary} size={12} />
                <span>Click-to-Call</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280' }}>
                <FaSync color={theme.colors.brand.primary} size={12} />
                <span>Auto Call Logging</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280' }}>
                <FaSms color={theme.colors.brand.primary} size={12} />
                <span>SMS Integration</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280' }}>
                <FaCheck color={theme.colors.brand.primary} size={12} />
                <span>Post-Call Popups</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Future Integrations Placeholder */}
      <div style={{
        padding: '1rem',
        backgroundColor: '#f9fafb',
        borderRadius: theme.borderRadius.md,
        border: '1px solid #e5e7eb',
        textAlign: 'center',
        color: '#6b7280'
      }}>
        <h4 style={{ marginBottom: '0.25rem', color: '#374151', fontSize: '0.9rem' }}>More Integrations Coming Soon</h4>
        <p style={{ fontSize: '0.8rem', margin: 0 }}>
          Gmail, Outlook, Salesforce, and more integrations in development.
        </p>
      </div>
    </div>
  );
};

// Team Tab Component
const TeamTab = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.data);
      } else {
        setMessage({ text: 'Failed to load users', type: 'error' });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage({ text: 'Error loading users', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUsers(prev => prev.filter(user => user.id !== userId));
        setMessage({ text: 'User deleted successfully', type: 'success' });
      } else {
        setMessage({ text: 'Failed to delete user', type: 'error' });
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      setMessage({ text: 'Error deleting user', type: 'error' });
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}><Spinner /></div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ color: theme.colors.brand.primary, marginBottom: '0.5rem' }}>Team Management</h2>
          <p style={{ color: '#6b7280', margin: 0 }}>Manage your team members and their permissions</p>
        </div>
        <Button
          variant="primary"
          onClick={() => alert('User management functionality has been moved to the Team tab in Settings. You are already here! Full user creation/editing will be implemented in a future update.')}
        >
          <FaPlus style={{ marginRight: '0.5rem' }} />
          Add New User
        </Button>
      </div>

      {message.text && (
        <div style={{ 
          padding: '1rem',
          marginBottom: '1.5rem',
          borderRadius: theme.borderRadius.md,
          backgroundColor: message.type === 'error' ? '#fef2f2' : '#f0fdf4',
          color: message.type === 'error' ? '#dc2626' : '#16a34a',
          border: `1px solid ${message.type === 'error' ? '#fecaca' : '#bbf7d0'}`
        }}>
          {message.text}
        </div>
      )}

      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: theme.borderRadius.md,
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Name</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Email</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Role</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Phone</th>
              <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '1rem', color: '#374151' }}>
                  {user.firstName} {user.lastName}
                </td>
                <td style={{ padding: '1rem', color: '#6b7280' }}>
                  {user.email}
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: theme.borderRadius.sm,
                    fontSize: '0.8rem',
                    fontWeight: '500',
                    backgroundColor: user.role === 'admin' ? '#fef3c7' : '#e0e7ff',
                    color: user.role === 'admin' ? '#92400e' : '#3730a3'
                  }}>
                    {user.role === 'admin' ? 'Admin' : 'Member'}
                  </span>
                </td>
                <td style={{ padding: '1rem', color: '#6b7280' }}>
                  {user.assignedCallNumber || 'Not assigned'}
                </td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => alert('Edit user functionality will be implemented in a future update. For now, users can edit their own profiles in the Account tab.')}
                    >
                      <FaEdit />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id)}
                      style={{ color: '#dc2626' }}
                    >
                      <FaTrash />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {users.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
            No users found. Add your first team member to get started.
          </div>
        )}
      </div>
    </div>
  );
};