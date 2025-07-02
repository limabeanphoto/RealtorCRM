// components/admin/ImportResults.js
import React from 'react';
import { FaCheck, FaDownload, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import theme from '../../styles/theme';
import Button from '../common/Button';

/**
 * Import Results Component
 * Shows the results of a contact import operation
 * 
 * @param {Object} props - Component props
 * @param {Object} props.results - Import results data
 * @param {Function} props.onExportErrors - Callback when export errors button is clicked
 */
export default function ImportResults({ results, onExportErrors }) {
  if (!results) {
    return null;
  }
  
  const { total, imported, duplicates, errors = [] } = results;
  
  return (
    <div>
      {/* Success Header */}
      <div style={{ 
        padding: '1.5rem', 
        backgroundColor: imported > 0 ? '#d4edda' : '#f8d7da', 
        borderRadius: theme.borderRadius.sm,
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        {imported > 0 ? (
          <>
            <FaCheck size={24} color="#155724" />
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#155724' }}>Import Completed</h4>
              <p style={{ margin: '0', color: '#155724' }}>
                Successfully imported {imported} contacts ({imported} of {total} rows)
              </p>
            </div>
          </>
        ) : (
          <>
            <FaExclamationTriangle size={24} color="#721c24" />
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#721c24' }}>Import Failed</h4>
              <p style={{ margin: '0', color: '#721c24' }}>
                No contacts were imported. Please review the errors below.
              </p>
            </div>
          </>
        )}
      </div>
      
      {/* Summary Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Stats Card */}
        <div style={{ 
          padding: '1.5rem',
          backgroundColor: 'white',
          borderRadius: theme.borderRadius.sm,
          border: '1px solid #ddd'
        }}>
          <h4 style={{ margin: '0 0 1rem 0' }}>Import Summary</h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div style={{ padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <div style={{ fontSize: '0.9rem', color: theme.colors.brand.text }}>Total Rows</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{total}</div>
            </div>
            
            <div style={{ padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <div style={{ fontSize: '0.9rem', color: theme.colors.brand.text }}>Successfully Imported</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: imported > 0 ? '#155724' : '#721c24' }}>
                {imported}
              </div>
            </div>
            
            <div style={{ padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <div style={{ fontSize: '0.9rem', color: theme.colors.brand.text }}>Duplicates Detected</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: duplicates > 0 ? '#856404' : 'inherit' }}>
                {duplicates}
              </div>
            </div>
            
            <div style={{ padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <div style={{ fontSize: '0.9rem', color: theme.colors.brand.text }}>Errors</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: errors.length > 0 ? '#721c24' : 'inherit' }}>
                {errors.length}
              </div>
            </div>
          </div>
        </div>
        
        {/* Next Steps Card */}
        <div style={{ 
          padding: '1.5rem',
          backgroundColor: 'white',
          borderRadius: theme.borderRadius.sm,
          border: '1px solid #ddd'
        }}>
          <h4 style={{ margin: '0 0 1rem 0' }}>What's Next?</h4>
          
          <ul style={{ margin: '0', paddingLeft: '1.5rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>
              <a href="/contacts" style={{ color: theme.colors.brand.primary }}>
                View all contacts
              </a>
            </li>
            {imported > 0 && (
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="/admin/contacts/assign" style={{ color: theme.colors.brand.primary }}>
                  Assign contacts to team members
                </a>
              </li>
            )}
            <li style={{ marginBottom: '0.5rem' }}>
              Import another file
            </li>
            {errors.length > 0 && (
              <li style={{ marginBottom: '0.5rem' }}>
                Export error report to fix issues and re-import
              </li>
            )}
          </ul>
        </div>
      </div>
      
      {/* Error Details */}
      {errors.length > 0 && (
        <div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '1rem'
          }}>
            <h4 style={{ margin: '0' }}>Error Details</h4>
            
            <Button
              onClick={onExportErrors}
              variant="outline"
              size="small"
            >
              <FaDownload style={{ marginRight: '0.5rem' }} /> Export Error Report
            </Button>
          </div>
          
          <div style={{ 
            padding: '1rem',
            backgroundColor: '#f8d7da',
            borderRadius: theme.borderRadius.sm,
            border: '1px solid #f5c6cb',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem'
          }}>
            <FaInfoCircle color="#721c24" style={{ marginTop: '0.2rem' }} />
            <div style={{ color: '#721c24' }}>
              <p style={{ margin: '0 0 0.5rem 0' }}>
                {errors.length} rows could not be imported due to the following errors:
              </p>
              <ul style={{ margin: '0', paddingLeft: '1.5rem' }}>
                {Array.from(new Set(errors.map(err => err.error))).map((uniqueError, index) => (
                  <li key={index}>{uniqueError}</li>
                ))}
              </ul>
            </div>
          </div>
          
          <div style={{ 
            maxHeight: '300px',
            overflowY: 'auto',
            backgroundColor: 'white',
            borderRadius: theme.borderRadius.sm,
            border: '1px solid #ddd'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ 
                    textAlign: 'center', 
                    padding: '0.75rem', 
                    borderBottom: '1px solid #ddd',
                    backgroundColor: '#f8f9fa',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    width: '60px'
                  }}>
                    Row
                  </th>
                  <th style={{ 
                    textAlign: 'left', 
                    padding: '0.75rem', 
                    borderBottom: '1px solid #ddd',
                    backgroundColor: '#f8f9fa',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10
                  }}>
                    Error
                  </th>
                  <th style={{ 
                    textAlign: 'left', 
                    padding: '0.75rem', 
                    borderBottom: '1px solid #ddd',
                    backgroundColor: '#f8f9fa',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10
                  }}>
                    Data
                  </th>
                </tr>
              </thead>
              <tbody>
                {errors.map((error, index) => (
                  <tr key={index}>
                    <td style={{ 
                      padding: '0.75rem', 
                      borderBottom: '1px solid #eee',
                      textAlign: 'center',
                      backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa',
                      fontWeight: 'bold'
                    }}>
                      {error.index + 1}
                    </td>
                    <td style={{ 
                      padding: '0.75rem', 
                      borderBottom: '1px solid #eee',
                      backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa'
                    }}>
                      {error.error}
                    </td>
                    <td style={{ 
                      padding: '0.75rem', 
                      borderBottom: '1px solid #eee',
                      backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa',
                      fontFamily: 'monospace',
                      fontSize: '0.9rem'
                    }}>
                      {Object.entries(error.contact || {}).map(([key, value]) => (
                        <div key={key}>
                          <strong>{key}:</strong> {value || '(empty)'}
                        </div>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}