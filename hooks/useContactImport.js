// hooks/useContactImport.js
import { useState, useEffect } from 'react';
import { parseCSV, downloadSampleCSV, downloadErrorReport } from '../utils/csvUtils';

/**
 * Custom hook for managing the contact import process
 * @returns {Object} Contact import state and functions
 */
export default function useContactImport() {
  // Import process state
  const [step, setStep] = useState(1); // 1: Upload, 2: Map, 3: Review, 4: Results
  const [file, setFile] = useState(null);
  const [csvData, setCsvData] = useState(null);
  const [mappings, setMappings] = useState({});
  const [importResults, setImportResults] = useState(null);
  
  // Status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Available fields for mapping
  const availableFields = [
    { key: 'name', label: 'Name', required: true },
    { key: 'email', label: 'Email', required: false },
    { key: 'phone', label: 'Phone', required: true },
    { key: 'company', label: 'Company', required: false },
    { key: 'notes', label: 'Notes', required: false },
  ];
  
  // Reset the import process
  const resetImport = () => {
    setStep(1);
    setFile(null);
    setCsvData(null);
    setMappings({});
    setImportResults(null);
    setError('');
    setSuccess('');
  };
  
  // Handle file selection
  const handleFileSelected = (selectedFile) => {
    setFile(selectedFile);
  };
  
  // Process CSV file
  const processFile = async (file) => {
    if (!file) {
      setError('No file selected');
      return false;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Read file
      const text = await readFileAsText(file);
      
      // Parse CSV
      const parsed = parseCSV(text);
      
      if (!parsed.headers.length || !parsed.rows.length) {
        setError('CSV file is empty or invalid');
        setLoading(false);
        return false;
      }
      
      setCsvData(parsed);
      
      // Suggest initial mappings based on header names
      const initialMappings = {};
      parsed.headers.forEach((header, index) => {
        const lowerHeader = header.toLowerCase();
        
        if (lowerHeader.includes('name')) {
          initialMappings.name = index;
        } else if (lowerHeader.includes('email')) {
          initialMappings.email = index;
        } else if (lowerHeader.includes('phone')) {
          initialMappings.phone = index;
        } else if (lowerHeader.includes('company')) {
          initialMappings.company = index;
        } else if (lowerHeader.includes('note')) {
          initialMappings.notes = index;
        }
      });
      
      setMappings(initialMappings);
      setStep(2); // Move to mapping step
      setLoading(false);
      return true;
    } catch (error) {
      console.error('Error processing CSV file:', error);
      setError('Error processing CSV file: ' + error.message);
      setLoading(false);
      return false;
    }
  };
  
  // Handle mapping changes
  const updateMappings = (newMappings) => {
    setMappings(newMappings);
  };
  
  // Validate mappings
  const validateMappings = () => {
    // Check if required fields are mapped
    const requiredFields = availableFields.filter(field => field.required);
    
    for (const field of requiredFields) {
      if (mappings[field.key] === undefined || mappings[field.key] === null) {
        setError(`Column for "${field.label}" is required`);
        return false;
      }
    }
    
    return true;
  };
  
  // Move to review step
  const moveToReview = () => {
    if (validateMappings()) {
      setError('');
      setStep(3);
      return true;
    }
    return false;
  };
  
  // Start import process
  const startImport = async () => {
    if (!csvData || !csvData.rows) {
      setError('No CSV data available');
      return false;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authentication token not found');
        setLoading(false);
        return false;
      }
      
      // Prepare data for import
      const contactsToImport = csvData.rows.map(row => {
        const contact = {};
        
        Object.keys(mappings).forEach(field => {
          if (mappings[field] !== null && mappings[field] !== undefined) {
            contact[field] = row[mappings[field]] || '';
          }
        });
        
        return contact;
      });
      
      // Send data to API
      const response = await fetch('/api/contacts/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ contacts: contactsToImport })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setImportResults(result.data);
        setSuccess(`Import completed. ${result.data.imported} contacts imported.`);
        setStep(4); // Move to results step
        setLoading(false);
        return true;
      } else {
        setError(result.message || 'Error importing contacts');
        setLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Error importing contacts:', error);
      setError('An error occurred while importing contacts: ' + error.message);
      setLoading(false);
      return false;
    }
  };
  
  // Helper functions
  
  // Read file as text
  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        resolve(event.target.result);
      };
      
      reader.onerror = (error) => {
        reject(error);
      };
      
      reader.readAsText(file);
    });
  };
  
  // Export sample CSV
  const handleExportSample = () => {
    downloadSampleCSV();
  };
  
  // Export error report
  const handleExportErrors = () => {
    if (importResults && importResults.errors) {
      downloadErrorReport(importResults.errors);
    }
  };
  
  // Convert data to structured format for preview
  const getStructuredData = () => {
    if (!csvData || !csvData.rows || !mappings) {
      return [];
    }
    
    return csvData.rows.map(row => {
      const structuredRow = {};
      
      // For each field, get the value from the mapped column
      availableFields.forEach(field => {
        const columnIndex = mappings[field.key];
        if (columnIndex !== undefined) {
          structuredRow[field.key] = row[columnIndex] || '';
        } else {
          structuredRow[field.key] = '';
        }
      });
      
      return structuredRow;
    });
  };
  
  return {
    // State
    step,
    file,
    csvData,
    mappings,
    importResults,
    loading,
    error,
    success,
    availableFields,
    
    // Computed
    structuredData: getStructuredData(),
    
    // Actions
    resetImport,
    handleFileSelected,
    processFile,
    updateMappings,
    validateMappings,
    moveToReview,
    startImport,
    handleExportSample,
    handleExportErrors,
    
    // Step management
    setStep,
    moveToNextStep: () => setStep(Math.min(step + 1, 4)),
    moveToPreviousStep: () => setStep(Math.max(step - 1, 1)),
  };
}