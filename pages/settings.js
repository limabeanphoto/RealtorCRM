import React, { useState } from 'react'
import ProtectedRoute from '../components/auth/ProtectedRoute'


const AccountSettings = () => {
  return (
    <ProtectedRoute>
      <div className="container mx-auto p-4 max-w-2xl">
         <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
        <SettingsForm />
      </div>
    </ProtectedRoute>
  )
}

const SettingsForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
  });
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
    <ProtectedRoute><form onSubmit={handleSubmit} className="space-y-4">
          {message && <div className="text-red-500">{message}</div>}
          {/* Name Field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input type="text" id="name" name="name" className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              value={formData.name} onChange={handleChange} />
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" id="email" name="email" className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" value={formData.email} onChange={handleChange}/>
          </div>

          {/* Current Password Field */}
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">Current Password</label>
            <input type="password" id="currentPassword" name="currentPassword" className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
          </div>

          {/* New Password Field */}
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <input type="password" id="newPassword" name="newPassword" className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
               value={formData.newPassword} onChange={handleChange} />
          </div>

          {/* Submit Button */}
          <div>
            <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Save Changes
            </button>
          </div>
        </form> 
        </ProtectedRoute>  
  )
}
export default AccountSettings