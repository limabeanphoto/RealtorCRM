// components/common/useForm.js
import { useState, useEffect } from 'react';

/**
 * Custom hook for managing form state
 * 
 * @param {Object} initialValues - Initial form values
 * @param {Object} options - Additional options for form behavior
 * @returns {Object} Form state and helper functions
 */
export function useForm(initialValues = {}, options = {}) {
  // Initialize form values with provided initial values
  const [values, setValues] = useState(initialValues);
  
  // Track if form is dirty (values have changed from initial)
  const [isDirty, setIsDirty] = useState(false);
  
  // Reset form values when initialValues prop changes
  useEffect(() => {
    setValues(initialValues);
    setIsDirty(false);
  }, [JSON.stringify(initialValues)]);

  /**
   * Handle form field changes
   * @param {Event} e - DOM input event
   */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle different input types appropriately
    if (type === 'checkbox') {
      setValues(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (type === 'number') {
      setValues(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }));
    } else if (type === 'date' || type === 'datetime-local') {
      setValues(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      setValues(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Mark form as dirty since values have changed
    setIsDirty(true);
  };

  /**
   * Set a specific field value directly
   * @param {string} field - Field name
   * @param {any} value - New field value
   */
  const setFieldValue = (field, value) => {
    setValues(prev => ({
      ...prev,
      [field]: value
    }));
    setIsDirty(true);
  };

  /**
   * Reset form to initial values
   */
  const resetForm = () => {
    setValues(initialValues);
    setIsDirty(false);
  };

  /**
   * Create a form submission handler
   * @param {Function} onSubmit - Function to call with form values
   * @returns {Function} Submit handler function
   */
  const createSubmitHandler = (onSubmit) => {
    return (e) => {
      e.preventDefault();
      return onSubmit(values);
    };
  };

  // Return all form state and helper functions
  return {
    values,
    setValues,
    handleChange,
    setFieldValue,
    resetForm,
    isDirty,
    createSubmitHandler
  };
}