// components/contacts/ScrapeContactModal.js
import { useState } from 'react';
import BaseModal from '../common/BaseModal';
import Button from '../common/Button';
import theme from '../../styles/theme';
import { FaExternalLinkAlt, FaExclamationTriangle, FaCheck, FaSpinner } from 'react-icons/fa';

const ScrapeContactModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  onViewExistingContact
}) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [contactData, setContactData] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

  // Handle URL change
  const handleUrlChange = (e) => {
    setUrl(e.target.value);
    // Clear any previous errors/success when user starts typing
    setError('');
    setSuccess('');
    setValidationErrors([]);
  };

  // Validate the URL
  const validateUrl = (url) => {
    if (!url || url.trim() === '') {
      setError('Please enter a URL');
      return false;
    }

    try {
      const parsedUrl = new URL(url);
      if (!parsedUrl.hostname.includes('realtor.com')) {
        setError('Only Realtor.com profile URLs are currently supported');
        return false;
      }

      if (!parsedUrl.pathname.includes('/realestateagents/')) {
        setError('URL must be a Realtor.com agent profile');
        return false;
      }

      return true;
    } catch (e) {
      setError('Please enter a valid URL');
      return false;
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous state
    setError('');
    setSuccess('');
    setValidationErrors([]);
    setContactData(null);
    setDuplicates([]);
    setShowDuplicateWarning(false);
    
    // Validate URL
    if (!validateUrl(url)) {
      return;
    }
    
    setLoading(true);
    
    try {
      // First, scrape the contact information
      const scrapeResponse = await fetch('/api/contacts/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ url })
      });
      
      const scrapeData = await scrapeResponse.json();
      
      if (!scrapeData.success) {
        setError(scrapeData.message || 'Failed to scrape contact information');
        setLoading(false);
        return;
      }
      
      // Validate the scraped data
      const errors = validateContactData(scrapeData.data);
      
      if (errors.length > 0) {
        setValidationErrors(errors);
        setLoading(false);
        return;
      }
      
      // Set the contact data
      setContactData(scrapeData.data);
      setSuccess('Successfully scraped contact information!');
      
      // Try to create the contact
      const formData = {
        name: scrapeData.data.name,
        email: scrapeData.data.email || '',
        phone: scrapeData.data.phone,
        company: scrapeData.data.company || '',
        profileLink: scrapeData.data.profileLink || url
      };
      
      if (onSubmit) {
        const result = await onSubmit(formData);
        
        // Check if duplicates were found
        if (result && !result.success && result.duplicates) {
          setDuplicates(result.duplicates);
          setShowDuplicateWarning(true);
        } else if (result && result.success) {
          // Close the modal on success
          setTimeout(() => onClose(), 1500);
        }
      }
    } catch (error) {
      console.error('Error scraping contact:', error);
      setError('An error occurred while scraping the contact information');
    } finally {
      setLoading(false);
    }
  };
  
  // Validate the scraped contact data
  const validateContactData = (data) => {
    const errors = [];
    
    if (!data.name || data.name.trim() === '') {
      errors.push('Name is missing');
    }
    
    if (!data.phone || data.phone.trim() === '') {
      errors.push('Phone number is missing');
    } else {
      // Simple phone validation
      const phoneRegex = /^\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})$/;
      if (!phoneRegex.test(data.phone)) {
        errors.push('Phone number format is invalid');
      }
    }
    
    // Email validation if email is present
    if (data.email && data.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        errors.push('Email format is invalid');
      }
    }
    
    return errors;
  };
  
  // Handle viewing an existing contact
  const handleViewExistingContact = (contact) => {
    setShowDuplicateWarning(false);
    if (onViewExistingContact) {
      onViewExistingContact(contact);
    }
    onClose();
  };
  
  // Handle creating a contact anyway (despite duplicates)
  const handleCreateAnyway = async () => {
    setShowDuplicateWarning(false);
    
    if (contactData && onSubmit) {
      const formData = {
        name: contactData.name,
        email: contactData.email || '',
        phone: contactData.phone,
        company: contactData.company || '',
        profileLink: contactData.profileLink || url,
        forceCreate: true // Add flag to force creation
      };
      
      const result = await onSubmit(formData);
      
      if (result && result.success) {
        // Close the modal on success
        setTimeout(() => onClose(), 1000);
      }
    }
  };

  return (
    <>
      <BaseModal 
        isOpen={isOpen} 
        onClose={onClose} 
        title="Scrape Contact from Realtor.com"
        maxWidth="600px"
      >
        <form onSubmit={handleSubmit}>
          {/* Error Display */}
          {error && (
            <div style={{ 
              backgroundColor: '#f8d7da', 
              color: '#721c24', 
              padding: '0.75rem', 
              borderRadius: theme.borderRadius.sm,
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem'
            }}>
              <FaExclamationTriangle style={{ marginTop: '0.25rem' }} />
              <div>{error}</div>
            </div>
          )}
          
          {/* Success Display */}
          {success && !error && (
            <div style={{ 
              backgroundColor: '#d4edda', 
              color: '#155724', 
              padding: '0.75rem', 
              borderRadius: theme.borderRadius.sm,
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem'
            }}>
              <FaCheck style={{ marginTop: '0.25rem' }} />
              <div>{success}</div>
            </div>
          )}
          
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div style={{ 
              backgroundColor: '#fff3cd', 
              color: '#856404', 
              padding: '0.75rem', 
              borderRadius: theme.borderRadius.sm,
              marginBottom: '1rem'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                Validation Issues:
              </div>
              <ul style={{ margin: '0', paddingLeft: '1.5rem' }}>
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* URL Input */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Realtor.com Profile URL
            </label>
            <input
              type="url"
              value={url}
              onChange={handleUrlChange}
              placeholder="https://www.realtor.com/realestateagents/..."
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                borderRadius: theme.borderRadius.sm, 
                border: '1px solid #ddd' 
              }}
              disabled={loading}
              required
            />
            <div style={{ fontSize: '0.8rem', color: theme.colors.brand.text, marginTop: '0.5rem' }}>
              Example: https://www.realtor.com/realestateagents/5fabcced9829b90011681b8e
            </div>
          </div>
          
          {/* Scraped Contact Preview */}
          {contactData && (
            <div style={{ 
              backgroundColor: '#f0f9ff', 
              padding: '1rem', 
              borderRadius: theme.borderRadius.sm,
              marginBottom: '1.5rem',
              border: `1px solid ${theme.colors.brand.accent}`
            }}>
              <h3 style={{ margin: '0 0 0.75rem 0', color: theme.colors.brand.accent }}>
                Scraped Contact Details
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: theme.colors.brand.text }}>
                    Name
                  </div>
                  <div>{contactData.name}</div>
                </div>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: theme.colors.brand.text }}>
                    Phone
                  </div>
                  <div>{contactData.phone}</div>
                </div>
                {contactData.company && (
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: theme.colors.brand.text }}>
                      Company
                    </div>
                    <div>{contactData.company}</div>
                  </div>
                )}
                {contactData.email && (
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: theme.colors.brand.text }}>
                      Email
                    </div>
                    <div>{contactData.email}</div>
                  </div>
                )}
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: theme.colors.brand.text }}>
                    Profile Link
                  </div>
                  <div>
                    <a 
                      href={contactData.profileLink || url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        color: theme.colors.brand.primary,
                        gap: '0.25rem'
                      }}
                    >
                      <FaExternalLinkAlt size={12} />
                      View Profile
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FaSpinner className="spinner" style={{ animation: 'spin 1s linear infinite' }} /> 
                  Scraping...
                </span>
              ) : (
                'Scrape Contact'
              )}
            </Button>
          </div>
        </form>
      </BaseModal>
      
      {/* Duplicate Warning Modal */}
      {showDuplicateWarning && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100, // Higher than the main modal
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: theme.borderRadius.md,
              padding: '1.5rem',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <h3 style={{ marginTop: 0 }}>Potential Duplicate Contacts</h3>
            
            <div style={{ 
              backgroundColor: '#fff3cd', 
              padding: '1rem', 
              borderRadius: theme.borderRadius.sm,
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem'
            }}>
              <FaExclamationTriangle color="#856404" />
              <div>
                <p style={{ margin: '0', color: '#856404' }}>
                  We found existing contacts that might be duplicates of the one you're trying to add.
                </p>
              </div>
            </div>
            
            {/* Duplicate contacts list */}
            <div style={{ 
              backgroundColor: '#f8f9fa',
              padding: '0.5rem',
              borderRadius: theme.borderRadius.sm,
              marginBottom: '1.5rem',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {duplicates.map((contact) => (
                <div
                  key={contact.id}
                  style={{
                    backgroundColor: 'white',
                    padding: '1rem',
                    borderRadius: theme.borderRadius.sm,
                    marginBottom: '0.5rem',
                    border: '1px solid #eee',
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>{contact.name}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.9rem' }}>
                    <div>Phone: {contact.phone}</div>
                    {contact.email && <div>Email: {contact.email}</div>}
                    {contact.company && <div>Company: {contact.company}</div>}
                  </div>
                  <div style={{ marginTop: '0.75rem', textAlign: 'right' }}>
                    <Button
                      onClick={() => handleViewExistingContact(contact)}
                      variant="outline"
                      size="small"
                    >
                      View Contact
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button
                onClick={() => setShowDuplicateWarning(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateAnyway}
                variant="primary"
              >
                Create Contact Anyway
              </Button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default ScrapeContactModal;