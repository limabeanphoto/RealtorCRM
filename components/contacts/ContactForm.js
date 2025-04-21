// components/contacts/ContactFormRefactored.js
import { useForm } from '../common/useForm';
import Button from '../common/Button';

export default function ContactForm({ onSubmit, initialData = {}, onCancel }) {
  // Use our custom form hook
  const { values, handleChange, createSubmitHandler } = useForm({
    name: '',
    email: '',
    phone: '',
    company: '',
    notes: '',
    ...initialData
  });
  
  // Create submit handler using the utility from our hook
  const handleSubmit = createSubmitHandler(onSubmit);
  
  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '500px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
          Name*
        </label>
        <input
          type="text"
          name="name"
          value={values.name}
          onChange={handleChange}
          required
          style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
        />
      </div>
      
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
          Email
        </label>
        <input
          type="email"
          name="email"
          value={values.email}
          onChange={handleChange}
          style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
        />
      </div>
      
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
          Phone*
        </label>
        <input
          type="tel"
          name="phone"
          value={values.phone}
          onChange={handleChange}
          required
          style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
        />
      </div>
      
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
          Company
        </label>
        <input
          type="text"
          name="company"
          value={values.company}
          onChange={handleChange}
          style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
        />
      </div>
      
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
          Notes
        </label>
        <textarea
          name="notes"
          value={values.notes}
          onChange={handleChange}
          style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
          rows="3"
        />
      </div>
      
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
        {onCancel && (
          <Button
            type="button"
            onClick={onCancel}
            variant="outline"
            tooltip="Discard changes and close"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          tooltip={initialData.id ? 'Save changes to this contact' : 'Create this new contact'}
        >
          {initialData.id ? 'Update Contact' : 'Save Contact'}
        </Button>
      </div>
    </form>
  );
}