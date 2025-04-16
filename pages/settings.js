import React, { useState, useEffect } from 'react'
import ProtectedRoute from '../components/auth/ProtectedRoute'

const AccountSettings = () => {
  return (
    <ProtectedRoute>      
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
          <SettingsForm />
        </div>
    </ProtectedRoute>
  )
}

const SettingsForm = () => {
  const [formData, setFormData] = useState({   
    currentPassword: '',
    newPassword: '',
  });

  const [initialFormData, setInitialFormData] = useState({
    name: '',
    email: '',
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/users/settings', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (data.success) {
          setInitialFormData(data.data);
          setFormData(prev => ({ ...prev, name: data.data.name, email: data.data.email }));
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    fetchUserData();
  }, []);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        setMessage('Settings updated successfully!');
      } else {
        setMessage('Error updating settings: ' + data.message);
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      setMessage('Error updating settings.');
    }
  };
  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '500px', margin: '0 auto' }}>
          {message && <div style={{ color: 'red', marginBottom: '1rem' }}>{message}</div>}
          {/* Name Field */}
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="name" style={{ display: 'block', marginBottom: '0.5rem' }}>
              Name
            </label>          
            <input 
              type="text" 
              id="name" 
              name="name" 
              value={formData.name}
                onChange={handleChange} 
              style={{ width: '100%', padding: '0.5rem' }} 
            />
          </div>

          {/* Email Field */}
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem' }}>Email</label>
            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} style={{ width: '100%', padding: '0.5rem' }} />
          </div>

          {/* Current Password Field */}
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="currentPassword" style={{ display: 'block', marginBottom: '0.5rem' }}>Current Password</label>
            <input type="password" id="currentPassword" name="currentPassword" style={{ width: '100%', padding: '0.5rem' }} />
          </div>

          {/* New Password Field */}
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="newPassword" style={{ display: 'block', marginBottom: '0.5rem' }}>
              New Password
            </label>
            <input 
              type="password" 
              id="newPassword" 
              name="newPassword" 
              value={formData.newPassword} 
              onChange={handleChange} 
              style={{ width: '100%', padding: '0.5rem' }} 
            />
          </div>

          {/* Submit Button */}
          <div style={{ marginBottom: '1rem' }}>
            <button
                type="submit"
                style={{backgroundColor: '#4a69bd', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
              >
                Save Changes
            </button>
          </div>
        </form> 
  
  )
}
export default AccountSettings