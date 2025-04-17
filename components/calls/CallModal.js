import { useState } from 'react';
import CallForm from './CallForm';
import Button from '../common/Button'; // Import Button

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
  if (!isOpen) return null;

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

  return (
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
      onClick={onClose} // Close when clicking backdrop
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
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
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
        
        {/* Conditionally render contact selector or form */}
        {mode === 'new' && !contact && contacts && onContactSelect ? (
          // Show Contact Selector if creating new call and no contact pre-selected
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Select Contact for Call
            </label>
            <select
              onChange={onContactSelect}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
              defaultValue=""
            >
              <option value="" disabled>-- Select a contact --</option>
              {contacts.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.company ? `(${c.company})` : ''}
                </option>
              ))}
            </select>
            {/* Optionally show form only after contact is selected */}
            {/* Or disable submit button until contact is selected */}
          </div>
        ) : (
          // Show CallForm if editing or if contact is selected/pre-provided
          <CallForm 
            onSubmit={handleSubmit} 
            contact={contact || call?.contact} // Pass the selected or existing contact
            initialData={initialData}
            onCancel={onClose}
          />
        )}
      </div>
    </div>
  );
}
