import { useState } from 'react';
import TaskForm from './TaskForm';

export default function TaskModal({ isOpen, onClose, task, onSubmit, contact, contacts }) {
  if (!isOpen) return null;

  const handleSubmit = async (formData) => {
    const result = await onSubmit(formData);
    if (result && result.success) {
      onClose();
    }
    return result;
  };

  // If contact is provided, the form is being opened from the contacts page
  // We want to pre-select this contact
  const initialData = task || {};
  if (contact && !initialData.contactId) {
    initialData.contactId = contact.id;
  }

  const title = task && task.id ? 'Edit Task' : 'Create Task';

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
          <h2 style={{ margin: 0 }}>{title}</h2>
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
        
        <TaskForm 
          onSubmit={handleSubmit} 
          initialData={initialData}
          onCancel={onClose}
          contacts={contacts}
        />
      </div>
    </div>
  );
}