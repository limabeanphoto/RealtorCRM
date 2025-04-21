// components/admin/CSVFileUpload.js
import { useState, useRef } from 'react';
import { FaUpload, FaFileAlt, FaTimes } from 'react-icons/fa';
import theme from '../../styles/theme';
import Button from '../common/Button';

/**
 * CSV File Upload Component with drag-and-drop support
 * @param {Function} onFileLoaded - Callback when file is loaded
 * @param {Function} onError - Callback when error occurs
 * @param {Boolean} disabled - Whether the upload is disabled
 */
export default function CSVFileUpload({ onFileLoaded, onError, disabled = false }) {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  
  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    // Validate file type
    if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      if (onError) {
        onError('Please upload a CSV file');
      }
      return;
    }
    
    setFile(selectedFile);
    processFile(selectedFile);
  };
  
  // Process the CSV file
  const processFile = (file) => {
    setLoading(true);
    
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const csvContent = event.target.result;
        
        // Parse CSV content
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
        
        if (onFileLoaded) {
          onFileLoaded({ headers, rows }, file);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error parsing CSV:', error);
        if (onError) {
          onError('Error parsing CSV file. Please make sure the file is properly formatted.');
        }
        setLoading(false);
      }
    };
    
    reader.onerror = () => {
      if (onError) {
        onError('Error reading file');
      }
      setLoading(false);
    };
    
    reader.readAsText(file);
  };
  
  // Handle drag events
  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;
    
    const droppedFile = e.dataTransfer.files[0];
    if (!droppedFile) return;
    
    // Validate file type
    if (droppedFile.type !== 'text/csv' && !droppedFile.name.endsWith('.csv')) {
      if (onError) {
        onError('Please upload a CSV file');
      }
      return;
    }
    
    setFile(droppedFile);
    processFile(droppedFile);
  };
  
  // Handle removing the file
  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <div>
      <div 
        style={{ 
          border: `2px dashed ${isDragging ? theme.colors.brand.primary : '#ddd'}`,
          borderRadius: theme.borderRadius.md,
          padding: '2rem',
          backgroundColor: isDragging ? 'rgba(143, 159, 59, 0.1)' : '#f8f9fa',
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          opacity: disabled ? 0.7 : 1,
        }}
        onClick={() => !disabled && fileInputRef.current.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <FaUpload size={48} color={theme.colors.brand.primary} style={{ marginBottom: '1rem' }} />
        <p>{file ? 'File selected' : 'Drag & drop your CSV file here, or click to browse'}</p>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          style={{ display: 'none' }} 
          accept=".csv" 
          disabled={disabled}
        />
        
        {file && (
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: '1rem', 
            padding: '0.5rem', 
            backgroundColor: 'white', 
            borderRadius: theme.borderRadius.sm, 
            display: 'inline-block',
            border: '1px solid #ddd'
          }}>
            <FaFileAlt style={{ marginRight: '0.5rem' }} />
            {file.name}
            {!disabled && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile();
                }}
                variant="text"
                style={{ padding: '0.2rem', marginLeft: '0.5rem' }}
                tooltip="Remove file"
              >
                <FaTimes color="#e74c3c" />
              </Button>
            )}
          </div>
        )}
        
        {loading && (
          <div style={{ marginTop: '1rem' }}>
            <div className="spinner" style={{ 
              display: 'inline-block',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              border: '2px solid #f3f3f3',
              borderTop: `2px solid ${theme.colors.brand.primary}`,
              animation: 'spin 1s linear infinite',
              marginRight: '0.5rem'
            }}></div>
            Processing file...
          </div>
        )}
      </div>
      
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}