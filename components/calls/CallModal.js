import { useState } from 'react';
import CallForm from './CallForm';

export default function CallModal({ isOpen, onClose, contact, onSubmit }) {
  if (!isOpen) return null;

  const handleSubmit = async (formData) => {
    const result = await onSubmit(formData);
    if (result && result.success) {
      onClose();
    }
    return result;
  };

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
          <h2 style={{ margin: 0 }}>Log Call with {contact?.name}</h2>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
            }}
          >
            &times;
          </button>
        </div>
        
        <CallForm 
          onSubmit={handleSubmit} 
          contact={contact} 
          onCancel={onClose}
        />
      </div>
    </div>
  );
}