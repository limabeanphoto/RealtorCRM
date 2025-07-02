import React, { useState } from 'react';
import ContactForm from './ContactForm';
import BaseModal from '../common/BaseModal';
import DuplicateContactModal from './DuplicateContactModal';
import theme from '../../styles/theme';

const ContactModal = ({ 
  isOpen, 
  onClose, 
  contact, 
  onSubmit, 
  mode, 
  onViewExistingContact 
}) => {
  const [duplicates, setDuplicates] = useState([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [pendingFormData, setPendingFormData] = useState(null);
  
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
      <BaseModal 
        isOpen={isOpen} 
        onClose={onClose} 
        title={title}
        maxWidth="800px"
      >
        <ContactForm 
          onSubmit={handleSubmit} 
          initialData={contact}
          onCancel={onClose}
        />
      </BaseModal>
      
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
};

export default ContactModal;