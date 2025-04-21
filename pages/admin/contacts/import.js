// pages/admin/contacts/import.js
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';
import Button from '../../../components/common/Button';
import theme from '../../../styles/theme';
import { FaUpload, FaTable, FaCheck, FaTimes, FaInfoCircle, FaDownload } from 'react-icons/fa';

// The CSV import page for contacts
export default function ImportContacts() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [csvData, setCsvData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mappings, setMappings] = useState({});
  const [importResults, setImportResults] = useState(null);
  const [importStep, setImportStep] = useState(1); // 1: Upload, 2: Map, 3: Review, 4: Results
  const [isDragging, setIsDragging] = useState(false);
  
  // Available fields for mapping
  const availableFields = [
    { key: 'name', label: 'Name', required: true },
    { key: 'email', label: 'Email', required: false },
    { key: 'phone', label: 'Phone', required: true },
    { key: 'company', label: 'Company', required: false },
    { key: 'notes', label: 'Notes', required: false },
  ];
  
  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        setError('Please upload a CSV file');
        setFile(null);
        return;
      }
      
      setFile(selectedFile);
      readCSVFile(selectedFile);
    }
  };
  
  // Handle drag events for file upload area
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (droppedFile.type !== 'text/csv' && !droppedFile.name.endsWith('.csv')) {
        setError('Please upload a CSV file');
        return;
      }
      
      setFile(droppedFile);
      readCSVFile(droppedFile);
    }
  };
  
  // Read CSV file and parse data
  const readCSVFile = (file) => {
    setLoading(true);
    setError('');
    
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const csvContent = event.target.result;
        
        // Simple CSV parsing - in a real app, consider using a library like PapaParse
        const lines = csvContent.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(header => header.trim());
        
        const rows = lines.slice(1).map(line => {
          // Handle commas within quoted strings
          const rowValues = [];
          let currentValue = '';
          let inQuotes = false;
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              rowValues.push(currentValue.trim());
              currentValue = '';
            } else {
              currentValue += char;
            }
          }
          
          // Add the last value
          rowValues.push(currentValue.trim());
          
          // Remove double quotes from values
          return rowValues.map(val => val.replace(/^"(.*)"$/, '$1'));
        });
        
        // Suggest initial mappings based on header names
        const initialMappings = {};
        headers.forEach((header, index) => {
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
        
        setCsvData({ headers, rows });
        setMappings(initialMappings);
        setImportStep(2); // Move to mapping step
        setLoading(false);
      } catch (error) {
        console.error('Error parsing CSV:', error);
        setError('Error parsing CSV file. Please make sure the file is properly formatted.');
        setLoading(false);
      }
    };
    
    reader.onerror = () => {
      setError('Error reading file');
      setLoading(false);
    };
    
    reader.readAsText(file);
  };
  
  // Handle mapping changes
  const handleMappingChange = (field, columnIndex) => {
    setMappings({
      ...mappings,
      [field]: columnIndex !== '' ? parseInt(columnIndex) : null
    });
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
  const handleContinueToReview = () => {
    if (validateMappings()) {
      setError('');
      setImportStep(3);
    }
  };
  
  // Start import process
  const handleStartImport = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authentication token not found');
        setLoading(false);
        return;
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
      } else {
        setError(result.message || 'Error importing contacts');
      }
      
      setImportStep(4); // Move to results step
    } catch (error) {
      console.error('Error importing contacts:', error);
      setError('An error occurred while importing contacts');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle starting over
  const handleStartOver = () => {
    setFile(null);
    setCsvData(null);
    setMappings({});
    setImportResults(null);
    setImportStep(1);
    setError('');
    setSuccess('');
  };
  
  // Handle going back to previous step
  const handleBack = () => {
    if (importStep > 1) {
      setImportStep(importStep - 1);
    }
  };
  
  // Generate a sample CSV file for download
  const handleDownloadSample = () => {
    const sampleData = 'Name,Email,Phone,Company,Notes\nJohn Doe,john@example.com,(555) 123-4567,ABC Realty,"Interested in luxury properties"\nJane Smith,jane@example.com,(555) 987-6543,XYZ Properties,"Looking for new leads"';
    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_contacts.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Export error results
  const handleExportErrors = () => {
    if (!importResults || !importResults.errors || importResults.errors.length === 0) {
      return;
    }
    
    const errorRows = importResults.errors.map(error => {
      const row = [error.index + 1, error.error];
      Object.keys(error.contact).forEach(key => {
        row.push(error.contact[key]);
      });
      return row.join(',');
    });
    
    const headers = ['Row', 'Error', ...availableFields.map(f => f.label)];
    const csv = [headers.join(','), ...errorRows].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'import_errors.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Render step content based on current step
  const renderStepContent = () => {
    switch (importStep) {
      case 1: // Upload
        return (
          <div style={{ textAlign: 'center' }}>
            <h3>Upload CSV File</h3>
            <p style={{ color: theme.colors.brand.text, marginBottom: '1.5rem' }}>
              Upload a CSV file containing your contacts data
            </p>
            
            <div 
              style={{ 
                border: `2px dashed ${isDragging ? theme.colors.brand.primary : '#ddd'}`,
                borderRadius: theme.borderRadius.md,
                padding: '2rem',
                marginBottom: '1.5rem',
                backgroundColor: isDragging ? 'rgba(143, 159, 59, 0.1)' : '#f8f9fa',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onClick={() => fileInputRef.current.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <FaUpload size={48} color={theme.colors.brand.primary} style={{ marginBottom: '1rem' }} />
              <p>Drag & drop your CSV file here, or click to browse</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                style={{ display: 'none' }} 
                accept=".csv" 
              />
              {file && (
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '0.5rem', 
                  backgroundColor: 'white', 
                  borderRadius: theme.borderRadius.sm, 
                  display: 'inline-block',
                  border: '1px solid #ddd'
                }}>
                  <FaFileAlt style={{ marginRight: '0.5rem' }} /> {file.name}
                </div>
              )}
            </div>
            
            <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
              <Button 
                onClick={handleDownloadSample}
                variant="outline"
              >
                <FaDownload style={{ marginRight: '0.5rem' }} /> Download Sample CSV
              </Button>
            </div>
            
            <div style={{ 
              backgroundColor: '#f0f9ff', 
              padding: '1rem', 
              borderRadius: theme.borderRadius.sm,
              border: '1px solid #cce5ff',
              marginBottom: '1.5rem',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <FaInfoCircle color="#0c5460" style={{ marginTop: '0.2rem' }} />
                <div>
                  <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', color: '#0c5460' }}>CSV Format Requirements:</p>
                  <ul style={{ margin: '0', paddingLeft: '1.5rem', color: '#0c5460' }}>
                    <li>First row should contain column headers</li>
                    <li>Required fields: Name, Phone</li>
                    <li>Optional fields: Email, Company, Notes</li>
                    <li>For phone numbers, use format: (555) 123-4567</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 2: // Map Columns
        return (
          <div>
            <h3>Map CSV Columns</h3>
            <p style={{ color: theme.colors.brand.text, marginBottom: '1.5rem' }}>
              Match each CSV column to the appropriate contact field. Required fields are marked with an asterisk (*).
            </p>
            
            <div style={{ 
              marginBottom: '1.5rem', 
              padding: '1rem', 
              backgroundColor: '#f8f9fa', 
              borderRadius: theme.borderRadius.sm,
              border: '1px solid #ddd',
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #ddd', position: 'sticky', top: 0, backgroundColor: '#f8f9fa' }}>
                      CSV Header
                    </th>
                    <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #ddd', position: 'sticky', top: 0, backgroundColor: '#f8f9fa' }}>
                      Sample Data
                    </th>
                    <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #ddd', position: 'sticky', top: 0, backgroundColor: '#f8f9fa' }}>
                      Map To Field
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {csvData && csvData.headers.map((header, index) => (
                    <tr key={index}>
                      <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>
                        {header}
                      </td>
                      <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>
                        {csvData.rows[0] && csvData.rows[0][index]}
                      </td>
                      <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>
                        <select
                          value={Object.keys(mappings).find(key => mappings[key] === index) || ''}
                          onChange={(e) => {
                            // Clear any existing mapping for this field
                            const newMappings = { ...mappings };
                            Object.keys(newMappings).forEach(key => {
                              if (newMappings[key] === index) {
                                delete newMappings[key];
                              }
                            });
                            
                            // Set new mapping if a field was selected
                            if (e.target.value) {
                              newMappings[e.target.value] = index;
                            }
                            
                            setMappings(newMappings);
                          }}
                          style={{ width: '100%', padding: '0.5rem' }}
                        >
                          <option value="">-- Select Field --</option>
                          {availableFields.map(field => (
                            <option 
                              key={field.key} 
                              value={field.key}
                              disabled={mappings[field.key] !== undefined && mappings[field.key] !== index}
                            >
                              {field.label}{field.required ? ' *' : ''}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div style={{ 
              backgroundColor: '#f0f9ff', 
              padding: '1rem', 
              borderRadius: theme.borderRadius.sm,
              border: '1px solid #cce5ff',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <FaInfoCircle color="#0c5460" style={{ marginTop: '0.2rem' }} />
                <div>
                  <p style={{ margin: '0', color: '#0c5460' }}>
                    Map each column from your CSV file to the appropriate contact field. Fields marked with an asterisk (*) are required.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 3: // Review
        return (
          <div>
            <h3>Review Import Data</h3>
            <p style={{ color: theme.colors.brand.text, marginBottom: '1.5rem' }}>
              Review the data before importing. Only the first 5 rows are shown.
            </p>
            
            <div style={{ 
              marginBottom: '1.5rem', 
              padding: '1rem', 
              backgroundColor: '#f8f9fa', 
              borderRadius: theme.borderRadius.sm,
              border: '1px solid #ddd',
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {availableFields.map(field => (
                      <th key={field.key} style={{ 
                        textAlign: 'left', 
                        padding: '0.5rem', 
                        borderBottom: '1px solid #ddd',
                        position: 'sticky',
                        top: 0,
                        backgroundColor: '#f8f9fa'
                      }}>
                        {field.label}{field.required ? ' *' : ''}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvData && csvData.rows.slice(0, 5).map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {availableFields.map(field => (
                        <td key={field.key} style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>
                          {mappings[field.key] !== undefined && row[mappings[field.key]]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <p>
                <strong>Total rows to import:</strong> {csvData ? csvData.rows.length : 0}
              </p>
              <p style={{ color: theme.colors.brand.text }}>
                Note: Duplicate contacts will be detected during import. You will be able to review the results after import.
              </p>
            </div>
          </div>
        );
        
      case 4: // Results
        return (
          <div>
            <h3>Import Results</h3>
            
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div className="spinner"></div>
                <p>Processing import...</p>
              </div>
            ) : (
              <>
                {importResults && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ 
                      padding: '1.5rem', 
                      backgroundColor: '#d4edda', 
                      borderRadius: theme.borderRadius.sm,
                      marginBottom: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem'
                    }}>
                      <FaCheck size={24} color="#155724" />
                      <div>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: '#155724' }}>Import Completed</h4>
                        <p style={{ margin: '0', color: '#155724' }}>
                          Successfully imported {importResults.imported} contacts
                        </p>
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div style={{ 
                        padding: '1rem',
                        backgroundColor: '#f8f9fa',
                        borderRadius: theme.borderRadius.sm,
                        border: '1px solid #ddd'
                      }}>
                        <h4 style={{ margin: '0 0 0.5rem 0' }}>Import Summary</h4>
                        <ul style={{ margin: '0', paddingLeft: '1.5rem' }}>
                          <li>Total rows: {importResults.total}</li>
                          <li>Successfully imported: {importResults.imported}</li>
                          <li>Duplicates detected: {importResults.duplicates}</li>
                          <li>Errors: {importResults.errors?.length || 0}</li>
                        </ul>
                      </div>
                      
                      <div style={{ 
                        padding: '1rem',
                        backgroundColor: '#f8f9fa',
                        borderRadius: theme.borderRadius.sm,
                        border: '1px solid #ddd'
                      }}>
                        <h4 style={{ margin: '0 0 0.5rem 0' }}>What's Next?</h4>
                        <ul style={{ margin: '0', paddingLeft: '1.5rem' }}>
                          <li>View imported contacts in the <a href="/contacts" style={{ color: theme.colors.brand.primary }}>Contacts</a> section</li>
                          <li>Assign contacts to team members in <a href="/admin/contacts/assign" style={{ color: theme.colors.brand.primary }}>Assign Contacts</a></li>
                          <li>Import another file by clicking "Start Over"</li>
                        </ul>
                      </div>
                    </div>
                    
                    {importResults.errors && importResults.errors.length > 0 && (
                      <div style={{ marginTop: '1.5rem' }}>
                        <h4>Error Details</h4>
                        <div style={{ 
                          padding: '1rem',
                          backgroundColor: '#f8d7da',
                          borderRadius: theme.borderRadius.sm,
                          border: '1px solid #f5c6cb',
                          marginBottom: '1rem'
                        }}>
                          <p style={{ margin: '0 0 0.5rem 0', color: '#721c24' }}>
                            {importResults.errors.length} rows could not be imported. See details below.
                          </p>
                          <Button
                            onClick={handleExportErrors}
                            variant="outline"
                            style={{ color: '#721c24', borderColor: '#721c24' }}
                          >
                            <FaDownload style={{ marginRight: '0.5rem' }} /> Export Errors
                          </Button>
                        </div>
                        
                        <div style={{ 
                          maxHeight: '300px',
                          overflowY: 'auto',
                          backgroundColor: 'white',
                          borderRadius: theme.borderRadius.sm,
                          border: '1px solid #eee'
                        }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr>
                                <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #ddd', position: 'sticky', top: 0, backgroundColor: 'white' }}>
                                  Row
                                </th>
                                <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #ddd', position: 'sticky', top: 0, backgroundColor: 'white' }}>
                                  Error
                                </th>
                                <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #ddd', position: 'sticky', top: 0, backgroundColor: 'white' }}>
                                  Data
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {importResults.errors.map((error, index) => (
                                <tr key={index}>
                                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>
                                    {error.index + 1}
                                  </td>
                                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>
                                    {error.error}
                                  </td>
                                  <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>
                                    <pre style={{ margin: '0', overflowX: 'auto', fontSize: '0.9rem' }}>
                                      {JSON.stringify(error.contact, null, 2)}
                                    </pre>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };
  
  // Render buttons based on current step
  const renderStepButtons = () => {
    switch (importStep) {
      case 1: // Upload
        return (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
            <Button
              onClick={() => router.push('/admin/dashboard')}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (file) {
                  readCSVFile(file);
                } else {
                  setError('Please select a file to upload');
                }
              }}
              disabled={!file || loading}
            >
              {loading ? 'Processing...' : 'Continue'}
            </Button>
          </div>
        );
        
      case 2: // Map Columns
        return (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
            <Button
              onClick={handleBack}
              variant="outline"
              disabled={loading}
            >
              Back
            </Button>
            <Button
              onClick={handleContinueToReview}
              disabled={loading}
            >
              Continue to Review
            </Button>
          </div>
        );
        
      case 3: // Review
        return (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
            <Button
              onClick={handleBack}
              variant="outline"
              disabled={loading}
            >
              Back
            </Button>
            <Button
              onClick={handleStartImport}
              disabled={loading}
            >
              {loading ? 'Importing...' : 'Start Import'}
            </Button>
          </div>
        );
        
      case 4: // Results
        return (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
            <Button
              onClick={() => router.push('/admin/dashboard')}
              variant="outline"
            >
              Back to Dashboard
            </Button>
            <Button
              onClick={handleStartOver}
              disabled={loading}
            >
              Import Another File
            </Button>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <ProtectedRoute adminOnly={true}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1>Import Contacts</h1>
          <Button
            onClick={() => router.push('/admin/dashboard')}
            variant="outline"
          >
            Back to Dashboard
          </Button>
        </div>
        
        {/* Progress Steps */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          marginBottom: '2rem',
          position: 'relative'
        }}>
          {/* Progress Bar */}
          <div style={{ 
            position: 'absolute',
            top: '50%',
            left: '0',
            right: '0',
            height: '2px',
            backgroundColor: '#eee',
            zIndex: 0,
            transform: 'translateY(-50%)',
            transition: 'width 0.3s ease'
          }}></div>
          
          {/* Step Circles */}
          {[1, 2, 3, 4].map(step => (
            <div key={step} style={{ 
              zIndex: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
              width: '100px'
            }}>
              <div style={{ 
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: importStep >= step ? theme.colors.brand.primary : 'white',
                color: importStep >= step ? 'white' : theme.colors.brand.text,
                border: `2px solid ${importStep >= step ? theme.colors.brand.primary : '#ddd'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                marginBottom: '0.5rem',
                transition: 'all 0.2s ease'
              }}>
                {step === 1 && <FaUpload size={16} />}
                {step === 2 && <FaTable size={16} />}
                {step === 3 && <FaCheck size={16} />}
                {step === 4 && (importResults ? <FaCheck size={16} /> : <FaTimes size={16} />)}
              </div>
              <div style={{ 
                textAlign: 'center', 
                fontSize: '0.9rem',
                color: importStep >= step ? theme.colors.brand.primary : theme.colors.brand.text,
                fontWeight: importStep === step ? 'bold' : 'normal'
              }}>
                {step === 1 && 'Upload'}
                {step === 2 && 'Map Columns'}
                {step === 3 && 'Review'}
                {step === 4 && 'Results'}
              </div>
            </div>
          ))}
        </div>
        
        {/* Error/Success Messages */}
        {error && (
          <div style={{ 
            padding: '0.75rem', 
            backgroundColor: '#f8d7da', 
            color: '#721c24', 
            borderRadius: '4px',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}
        
        {success && (
          <div style={{ 
            padding: '0.75rem', 
            backgroundColor: '#d4edda', 
            color: '#155724', 
            borderRadius: '4px',
            marginBottom: '1rem'
          }}>
            {success}
          </div>
        )}
        
        {/* Main Content */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '2rem', 
          borderRadius: theme.borderRadius.md,
          boxShadow: theme.shadows.sm
        }}>
          {renderStepContent()}
          {renderStepButtons()}
        </div>
      </div>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .spinner {
          display: inline-block;
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid ${theme.colors.brand.primary};
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }
      `}</style>
    </ProtectedRoute>
  );
}'translateY(-50%)'
          }}></div>
          
          {/* Colored Progress */}
          <div style={{ 
            position: 'absolute',
            top: '50%',
            left: '0',
            width: `${((importStep - 1) / 3) * 100}%`,
            height: '2px',
            backgroundColor: theme.colors.brand.primary,
            zIndex: 1,
            transform: