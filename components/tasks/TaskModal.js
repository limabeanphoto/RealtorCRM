import { useState } from 'react';
import TaskForm from './TaskForm';
import BaseModal from '../common/BaseModal';

export default function TaskModal({ 
  isOpen, 
  onClose, 
  task, 
  onSubmit, 
  contact, 
  contacts 
}) {
  const handleSubmit = async (formData) => {
    // Convert status to match our new system
    const updatedFormData = {
      ...formData,
      // Ensure API compatibility with Active/Completed mapping
      status: formData.status === 'Active' ? 'Active' : 'Completed',
      completed: formData.status === 'Completed'
    };
    
    const result = await onSubmit(updatedFormData);
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
  
  // Convert date to ISO string format for the form if it exists
  if (initialData.dueDate && typeof initialData.dueDate === 'string') {
    // Keep the date in its ISO format for the datetime-local input
    // The input will display it in the user's local time zone
    initialData.dueDate = new Date(initialData.dueDate).toISOString().slice(0, 16);
  }
  
  // Ensure status is properly mapped for our simplified system
  if (initialData.status) {
    initialData.status = initialData.status === 'Completed' ? 'Completed' : 'Active';
  }

  const title = task && task.id ? 'Edit Task' : 'Create Task';

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={title}>
      <TaskForm 
        onSubmit={handleSubmit} 
        initialData={initialData}
        onCancel={onClose}
        contacts={contacts}
      />
    </BaseModal>
  );
}