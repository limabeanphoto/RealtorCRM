import React from 'react';
import { useForm } from '../common/useForm';
import Button from '../common/Button';
import theme from '../../styles/theme';

const ContactForm = ({ onSubmit, initialData = {}, onCancel }) => {
  // Use our custom form hook
  const { values, handleChange, createSubmitHandler } = useForm({
    name: '',
    email: '',
    phone: '',
    company: '',
    notes: '',
    profileLink: '',
    volume: '',
    region: '',
    ...initialData
  });
  
  // Create submit handler using the utility from our hook
  const handleSubmit = createSubmitHandler(onSubmit);

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
  
  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '600px', margin: '0 auto' }}>
      {/* Two Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Left Column - Basic Info */}
        <div>
          <h3 style={{ marginTop: 0, color: theme.colors.brand.primary }}>Contact Information</h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Name*
            </label>
            <input
              type="text"
              name="name"
              value={values.name}
              onChange={handleChange}
              required
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                borderRadius: theme.borderRadius.sm, 
                border: '1px solid #ddd' 
              }}
            />
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Email
            </label>
            <input
              type="email"
              name="email"
              value={values.email}
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
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Phone*
            </label>
            <input
              type="tel"
              name="phone"
              value={values.phone}
              onChange={handleChange}
              required
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                borderRadius: theme.borderRadius.sm, 
                border: '1px solid #ddd' 
              }}
            />
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Company
            </label>
            <input
              type="text"
              name="company"
              value={values.company}
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
        
        {/* Right Column - Additional Info */}
        <div>
          <h3 style={{ marginTop: 0, color: theme.colors.brand.primary }}>Additional Information</h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Profile Link (Realtor.com or Zillow)
            </label>
            <input
              type="url"
              name="profileLink"
              value={values.profileLink}
              onChange={handleChange}
              placeholder="https://www.realtor.com/realestateagents/..."
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                borderRadius: theme.borderRadius.sm, 
                border: '1px solid #ddd' 
              }}
            />
            <div style={{ fontSize: '0.8rem', color: theme.colors.brand.text, marginTop: '0.25rem' }}>
              Enter the URL to their Realtor.com or Zillow profile
            </div>
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Volume
            </label>
            <select
              name="volume"
              value={values.volume}
              onChange={handleChange}
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                borderRadius: theme.borderRadius.sm, 
                border: '1px solid #ddd' 
              }}
            >
              <option value="">-- Select Volume --</option>
              {volumeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Region
            </label>
            <select
              name="region"
              value={values.region}
              onChange={handleChange}
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                borderRadius: theme.borderRadius.sm, 
                border: '1px solid #ddd' 
              }}
            >
              <option value="">-- Select Region --</option>
              {regionOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Full Width - Notes */}
      <div style={{ marginBottom: '1.5rem', marginTop: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
          Notes
        </label>
        <textarea
          name="notes"
          value={values.notes}
          onChange={handleChange}
          style={{ 
            width: '100%', 
            padding: '0.75rem', 
            borderRadius: theme.borderRadius.sm, 
            border: '1px solid #ddd',
            minHeight: '100px'
          }}
          rows="4"
        />
      </div>
      
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
        {onCancel && (
          <Button
            type="button"
            onClick={onCancel}
            variant="outline"
            tooltip="Discard changes and close"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          tooltip={initialData.id ? 'Save changes to this contact' : 'Create this new contact'}
        >
          {initialData.id ? 'Update Contact' : 'Save Contact'}
        </Button>
      </div>
    </form>
  );
};

export default ContactForm;