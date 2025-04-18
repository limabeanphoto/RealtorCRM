// components/dashboard/FollowUpContacts.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FaUsers, FaPhone, FaChevronRight } from 'react-icons/fa';
import theme from '../../styles/theme';
import Button from '../common/Button';

export default function FollowUpContacts({ animationDelay = 0 }) {
  const router = useRouter();
  const [contacts, setContacts] = useState([]);
  const [contactCount, setContactCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  
  // Fetch contacts data
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.error('No authentication token found');
          setLoading(false);
          return;
        }
        
        // Fetch contacts with Follow Up status
        const response = await fetch('/api/contacts?lastCallOutcome=Follow%20Up', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (data.success) {
          setContactCount(data.data.length);
          // Get only top 3 follow-up contacts
          setContacts(data.data.slice(0, 3));
        } else {
          console.error('Error fetching contacts:', data.message);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching contacts:', error);
        setLoading(false);
      }
    };
    
    fetchContacts();
    
    // Animation timer
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, animationDelay * 1000);
    
    return () => clearTimeout(timer);
  }, [animationDelay]);
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const options = { 
      month: 'short', 
      day: 'numeric',
    };
    
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Navigate to filtered contacts page
  const handleViewAllContacts = () => {
    router.push('/contacts?filter=followUp');
  };
  
  // Navigate to call log
  const handleLogCall = (contactId) => {
    router.push(`/calls?contactId=${contactId}`);
  };
  
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: theme.borderRadius.md,
      padding: '1.5rem',
      boxShadow: theme.shadows.sm,
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
      transition: `opacity 0.5s ease, transform 0.5s ease`,
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1rem' 
      }}>
        <h3 style={{ 
          margin: 0, 
          color: theme.colors.brand.primary,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <FaUsers />
          Follow Up Contacts
          <span style={{
            backgroundColor: theme.colors.brand.secondary,
            color: 'white',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.8rem',
          }}>
            {contactCount}
          </span>
        </h3>
      </div>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '1rem' }}>
          Loading contacts...
        </div>
      ) : contacts.length > 0 ? (
        <div>
          {contacts.map((contact, index) => (
            <div 
              key={contact.id}
              style={{
                padding: '0.75rem',
                borderBottom: index < contacts.length - 1 ? '1px solid #f0f0f0' : 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
                transition: `opacity 0.5s ease ${animationDelay + 0.2 + (index * 0.1)}s, transform 0.5s ease ${animationDelay + 0.2 + (index * 0.1)}s`,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                  {contact.name}
                </div>
                <div style={{ 
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: theme.colors.brand.text
                }}>
                  {contact.company && (
                    <span>{contact.company}</span>
                  )}
                  <span>Last call: {formatDate(contact.lastCallDate)}</span>
                </div>
              </div>
              <button
                onClick={() => handleLogCall(contact.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: theme.colors.brand.primary,
                  color: 'white',
                  fontSize: '1rem',
                }}
                title="Log a call"
              >
                <FaPhone size={14} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ 
          textAlign: 'center', 
          padding: '1rem', 
          color: theme.colors.brand.text 
        }}>
          No follow-up contacts at the moment.
        </div>
      )}
      
      <div style={{ 
        textAlign: 'center', 
        marginTop: '1rem',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
        transition: `opacity 0.5s ease ${animationDelay + 0.7}s, transform 0.5s ease ${animationDelay + 0.7}s`,
      }}>
        <Button
          onClick={handleViewAllContacts}
          variant="primary"
          size="small"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          View All Follow Ups <FaChevronRight size={12} />
        </Button>
      </div>
    </div>
  );
}