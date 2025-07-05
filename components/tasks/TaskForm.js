// components/tasks/TaskForm.js
import { useEffect } from 'react';
import { useForm } from '../../utils/useForm';
import Button from '../common/Button';
import { getTomorrowNoonPacific } from '../../utils/dateUtils';

export default function TaskForm({ onSubmit, initialData = {}, onCancel, contacts = [] }) {
  // Use our custom form hook with initial values
  const { values, setFieldValue, handleChange, createSubmitHandler } = useForm({
    title: '',
    description: '',
    status: 'Active',
    priority: 'medium', // Default priority
    dueDate: getTomorrowNoonPacific(), // Tomorrow at 12 PM Pacific Time
    contactId: '',
    callId: '',
    ...initialData
  });
  
  // Create submit handler using our utility
  const handleSubmit = createSubmitHandler(onSubmit);
  
  // Find contact details if contactId is provided
  useEffect(() => {
    if (values.contactId && contacts.length > 0) {
      const contact = contacts.find(c => c.id === values.contactId);
      if (contact) {
        // You could set additional fields based on the contact if needed
        // Or store the contact object in local state
      }
    }
  }, [values.contactId, contacts]);
  
  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '500px', margin: '0 auto' }}>
      {/* Contact Selection */}
      {contacts.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>
            Associated Contact (Optional)
          </label>
          <select
            name="contactId"
            value={values.contactId}
            onChange={handleChange}
            style={{ width: '100%', padding: '0.5rem' }}
          >
            <option value="">-- No Associated Contact --</option>
            {contacts.map(contact => (
              <option key={contact.id} value={contact.id}>
                {contact.name} {contact.company ? `(${contact.company})` : ''}
              </option>
            ))}
          </select>
        </div>
      )}
      
      {/* Priority */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
          Priority*
        </label>
        <select
          name="priority"
          value={values.priority}
          onChange={handleChange}
          required
          style={{ width: '100%', padding: '0.5rem' }}
        >
          <option value="high">High Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="low">Low Priority</option>
        </select>
      </div>
      
      {/* Title */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
          Task Title*
        </label>
        <input
          type="text"
          name="title"
          value={values.title}
          onChange={handleChange}
          required
          style={{ width: '100%', padding: '0.5rem' }}
          placeholder="e.g., Follow up about property listing"
        />
      </div>
      
      {/* Description */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
          Description
        </label>
        <textarea
          name="description"
          value={values.description}
          onChange={handleChange}
          style={{ width: '100%', padding: '0.5rem' }}
          rows="3"
          placeholder="Add any additional details about the task"
        />
      </div>
      
      {/* Due Date */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
          Due Date/Time*
        </label>
        <input
          type="datetime-local"
          name="dueDate"
          value={values.dueDate}
          onChange={handleChange}
          required
          style={{ width: '100%', padding: '0.5rem' }}
        />
      </div>
      
      {/* Hidden Status Field - No longer shown in UI but still tracked */}
      <input
        type="hidden"
        name="status"
        value={values.status}
      />
      
      {/* Buttons */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Button
          type="submit"
          disabled={false}
          variant="primary"
          style={{ minWidth: '120px' }}
        >
          {initialData.id ? 'Update Task' : 'Create Task'}
        </Button>
        
        {onCancel && (
          <Button
            type="button"
            onClick={onCancel}
            style={{
              backgroundColor: '#e74c3c',
              color: 'white',
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}