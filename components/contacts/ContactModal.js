// components/contacts/ContactModal.js
import { useState } from 'react';
import ContactForm from './ContactForm';
import Button from '../common/Button';
import DuplicateContactModal from './DuplicateContactModal';

export default function ContactModal({ isOpen, onClose, contact, onSubmit, mode, onViewExistingContact }) {
  const [duplicates, setDuplicates] = useState([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [pendingFormData, setPendingFormData] = useState(null);
  
  if (!isOpen) return null;

  const handleSubmit = async (formData) => {
    // Save form data in case we need to show duplicate modal
    setPendingFormData(formData);
    
    const result = await onSubmit(formData);
    
    // Check if duplicates were found
    if (result && !result.success && result.duplicates) {
      setDuplicates(result.duplicates);
      setShowDuplicateModal(true);
      return { success: false, showingDuplicates: true };
    }
    
    // If successful or other error
    if (result && result.success) {
      onClose();
    }
    return result;
  };
  
  // Handle viewing an existing contact
  const handleViewContact = (contact) => {
    setShowDuplicateModal(false);
    if (onViewExistingContact) {
      onViewExistingContact(contact);
    }
    onClose();
  };
  
  // Handle creating the contact anyway
  const handleCreateAnyway = async () => {
    setShowDuplicateModal(false);
    
    if (pendingFormData) {
      // Add a flag to force creation
      const result = await onSubmit({
        ...pendingFormData,
        forceCreate: true
      });
      
      if (result && result.success) {
        onClose();
      }
    }
  };

  const title = mode === 'edit' ? `Edit Contact: ${contact.name}` : 'Add New Contact';

  return (
    <>
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
          zIndex: 1000,
        }}
        onClick={onClose}
      >
        <div
          style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0 }}>{title}</h2>
            <Button
              onClick={onClose}
              variant="text"
              style={{ fontSize: '1.5rem', padding: '0.2rem' }}
              tooltip="Close this window"
            >
              &times;
            </Button>
          </div>
          
          <ContactForm 
            onSubmit={handleSubmit} 
            initialData={contact}
            onCancel={onClose}
          />
        </div>
      </div>
      
      {/* Duplicate Contact Modal */}
      <DuplicateContactModal
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        duplicates={duplicates}
        onViewContact={handleViewContact}
        onCreateAnyway={handleCreateAnyway}
        formData={pendingFormData || {}}
      />
    </>
  );
}