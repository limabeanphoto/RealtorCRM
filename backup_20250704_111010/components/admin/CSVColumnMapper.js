// components/admin/CSVColumnMapper.js
import React from 'react';
import theme from '../../styles/theme';

/**
 * CSV Column Mapping Component
 * Allows mapping CSV columns to contact fields
 * 
 * @param {Object} props - Component props
 * @param {Array} props.csvData - Parsed CSV data with headers and rows
 * @param {Object} props.mappings - Current column mappings
 * @param {Function} props.onMappingChange - Callback when mapping changes
 * @param {Array} props.fieldOptions - Available fields for mapping
 */
export default function CSVColumnMapper({ 
  csvData, 
  mappings = {}, 
  onMappingChange,
  fieldOptions = [
    { key: 'name', label: 'Name', required: true },
    { key: 'email', label: 'Email', required: false },
    { key: 'phone', label: 'Phone', required: true },
    { key: 'company', label: 'Company', required: false },
    { key: 'notes', label: 'Notes', required: false },
  ]
}) {
  // Find which field is mapped to a given column index
  const getMappedField = (columnIndex) => {
    return Object.keys(mappings).find(field => mappings[field] === columnIndex) || '';
  };
  
  // Handle mapping change
  const handleMappingChange = (columnIndex, fieldKey) => {
    // If a field is already selected, remove previous mapping
    const currentMappings = { ...mappings };
    
    // Find if this field is already mapped to another column
    const existingMapping = Object.keys(currentMappings).find(key => key === fieldKey);
    if (existingMapping) {
      delete currentMappings[existingMapping];
    }
    
    // Set new mapping
    if (fieldKey) {
      currentMappings[fieldKey] = columnIndex;
    }
    
    // Call the change handler
    if (onMappingChange) {
      onMappingChange(currentMappings);
    }
  };
  
  if (!csvData || !csvData.headers || !csvData.rows || csvData.rows.length === 0) {
    return (
      <div style={{ padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: theme.borderRadius.sm }}>
        No CSV data available. Please upload a file first.
      </div>
    );
  }
  
  return (
    <div style={{ 
      maxHeight: '400px',
      overflowY: 'auto',
      backgroundColor: '#f8f9fa', 
      borderRadius: theme.borderRadius.sm,
      border: '1px solid #ddd',
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ 
              textAlign: 'left', 
              padding: '0.75rem', 
              borderBottom: '1px solid #ddd',
              backgroundColor: 'white',
              position: 'sticky',
              top: 0,
              zIndex: 10
            }}>
              CSV Column
            </th>
            <th style={{ 
              textAlign: 'left', 
              padding: '0.75rem', 
              borderBottom: '1px solid #ddd',
              backgroundColor: 'white',
              position: 'sticky',
              top: 0,
              zIndex: 10
            }}>
              Sample Data
            </th>
            <th style={{ 
              textAlign: 'left', 
              padding: '0.75rem', 
              borderBottom: '1px solid #ddd',
              backgroundColor: 'white',
              position: 'sticky',
              top: 0,
              zIndex: 10
            }}>
              Map To Field
            </th>
          </tr>
        </thead>
        <tbody>
          {csvData.headers.map((header, index) => (
            <tr key={index} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa' }}>
              <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>
                <strong>{header}</strong>
              </td>
              <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>
                {csvData.rows[0] && csvData.rows[0][index]}
              </td>
              <td style={{ padding: '0.75rem', borderBottom: '1px solid #eee' }}>
                <select
                  value={getMappedField(index)}
                  onChange={(e) => handleMappingChange(index, e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                >
                  <option value="">-- Do Not Import --</option>
                  {fieldOptions.map(field => (
                    <option 
                      key={field.key} 
                      value={field.key}
                      disabled={Object.keys(mappings).includes(field.key) && mappings[field.key] !== index}
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
  );
}