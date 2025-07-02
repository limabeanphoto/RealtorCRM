// components/admin/CSVDataPreview.js
import React from 'react';
import theme from '../../styles/theme';

/**
 * CSV Data Preview Component
 * Shows a preview of mapped CSV data before import
 * 
 * @param {Object} props - Component props
 * @param {Array} props.csvData - Parsed CSV data with headers and rows
 * @param {Object} props.mappings - Column mappings
 * @param {Array} props.fieldOptions - Available fields for mapping
 * @param {Number} props.previewRows - Number of rows to preview (default: 5)
 */
export default function CSVDataPreview({
  csvData,
  mappings,
  fieldOptions = [
    { key: 'name', label: 'Name', required: true },
    { key: 'email', label: 'Email', required: false },
    { key: 'phone', label: 'Phone', required: true },
    { key: 'company', label: 'Company', required: false },
    { key: 'notes', label: 'Notes', required: false },
  ],
  previewRows = 5
}) {
  // Convert raw CSV data to structured data based on mappings
  const getStructuredData = () => {
    if (!csvData || !csvData.rows || !mappings) {
      return [];
    }
    
    return csvData.rows.slice(0, previewRows).map(row => {
      const structuredRow = {};
      
      // For each field, get the value from the mapped column
      fieldOptions.forEach(field => {
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
  
  // Get formatted preview data
  const previewData = getStructuredData();
  
  // Check if any required fields are missing
  const getMissingRequiredFields = () => {
    const requiredFields = fieldOptions.filter(field => field.required);
    return requiredFields.filter(field => !mappings[field.key]);
  };
  
  const missingFields = getMissingRequiredFields();
  
  if (!csvData || !csvData.rows || csvData.rows.length === 0) {
    return (
      <div style={{ padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: theme.borderRadius.sm }}>
        No CSV data available. Please upload a file first.
      </div>
    );
  }
  
  return (
    <div>
      {missingFields.length > 0 && (
        <div style={{ 
          padding: '0.75rem', 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          borderRadius: '4px',
          marginBottom: '1rem'
        }}>
          <strong>Warning:</strong> The following required fields are not mapped:
          <ul style={{ margin: '0.5rem 0 0 1.5rem', padding: 0 }}>
            {missingFields.map(field => (
              <li key={field.key}>{field.label}</li>
            ))}
          </ul>
        </div>
      )}
      
      <div style={{ 
        maxHeight: '400px',
        overflowY: 'auto',
        backgroundColor: 'white', 
        borderRadius: theme.borderRadius.sm,
        border: '1px solid #ddd',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ 
                padding: '0.75rem', 
                borderBottom: '1px solid #ddd',
                backgroundColor: '#f8f9fa',
                textAlign: 'center',
                position: 'sticky',
                top: 0,
                zIndex: 10
              }}>
                Row
              </th>
              
              {fieldOptions.map(field => (
                <th key={field.key} style={{ 
                  textAlign: 'left', 
                  padding: '0.75rem', 
                  borderBottom: '1px solid #ddd',
                  backgroundColor: '#f8f9fa',
                  position: 'sticky',
                  top: 0,
                  zIndex: 10
                }}>
                  {field.label}{field.required ? ' *' : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewData.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td style={{ 
                  padding: '0.75rem', 
                  borderBottom: '1px solid #eee',
                  backgroundColor: rowIndex % 2 === 0 ? 'white' : '#f8f9fa',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  color: '#666'
                }}>
                  {rowIndex + 1}
                </td>
                
                {fieldOptions.map(field => (
                  <td key={field.key} style={{ 
                    padding: '0.75rem', 
                    borderBottom: '1px solid #eee',
                    backgroundColor: rowIndex % 2 === 0 ? 'white' : '#f8f9fa'
                  }}>
                    {row[field.key] || (
                      <span style={{ color: '#999', fontStyle: 'italic' }}>
                        {field.required ? 'Missing' : 'Not mapped'}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div style={{ marginTop: '1rem', color: theme.colors.brand.text, fontSize: '0.9rem' }}>
        Showing {Math.min(previewData.length, previewRows)} of {csvData.rows.length} rows.
      </div>
    </div>
  );
}