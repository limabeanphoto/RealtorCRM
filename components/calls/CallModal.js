import { useState } from 'react';
import CallForm from './CallForm';
import BaseModal from '../common/BaseModal';

export default function CallModal({
  isOpen,
  onClose,
  call,
  contact,
  contacts, // Added contacts prop
  onContactSelect, // Added handler for contact selection
  onSubmit,
  mode = 'new'
}) {
  const handleSubmit = async (formData) => {
    const result = await onSubmit(formData);
    if (result && result.success) {
      onClose();
    }
    return result;
  };

  // For editing, we need to use the call data
  // For new calls, we use the provided contact or allow selection
  const initialData = call || { contactId: contact?.id };
  const title = mode === 'edit' 
    ? `Edit Call with ${call?.contact?.name}` 
    : contact 
      ? `Log Call with ${contact.name}` 
      : 'Log New Call'; // Title when no contact is pre-selected
  
  // For contact selection in new calls
  const headerContent = mode === 'new' && !contact && contacts && onContactSelect ? (
    <div style={{ flex: 1, marginRight: '1rem', minWidth: '200px' }}>
      <select
        onChange={onContactSelect}
        style={{ 
          width: '100%', 
          padding: '0.5rem', 
          border: '1px solid #ddd', 
          borderRadius: '4px' 
        }}
        defaultValue=""
      >
        <option value="" disabled>-- Select a contact --</option>
        {contacts.map(c => (
          <option key={c.id} value={c.id}>
            {c.name} {c.company ? `(${c.company})` : ''}
          </option>
        ))}
      </select>
    </div>
  ) : null;

  return (
    <BaseModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={title}
      headerContent={headerContent}
    >
      {/* Conditionally render form only if edit mode OR contact is selected/provided */}
      {(mode === 'edit' || contact || initialData.contactId) ? (
        <CallForm 
          onSubmit={handleSubmit} 
          contact={contact || call?.contact} // Pass the selected or existing contact
          initialData={initialData}
          onCancel={onClose}
        />
      ) : (
        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
          Please select a contact to log a call
        </div>
      )}
    </BaseModal>
  );
}