// pages/admin/contacts/import.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';
import Button from '../../../components/common/Button';
import CSVFileUpload from '../../../components/admin/CSVFileUpload';
import CSVColumnMapper from '../../../components/admin/CSVColumnMapper';
import CSVDataPreview from '../../../components/admin/CSVDataPreview';
import ImportResults from '../../../components/admin/ImportResults';
import useContactImport from '../../../hooks/useContactImport';
import theme from '../../../styles/theme';
import { FaUpload, FaTable, FaCheck, FaTimes, FaInfoCircle } from 'react-icons/fa';

/**
 * Contact Import Page
 * Allows admin users to import contacts from a CSV file
 */
export default function ImportContacts() {
  const router = useRouter();
  const importHook = useContactImport();
  
  const {
    step,
    file,
    csvData,
    mappings,
    importResults,
    loading,
    error,
    success,
    availableFields,
    
    resetImport,
    handleFileSelected,
    processFile,
    updateMappings,
    validateMappings,
    moveToReview,
    startImport,
    handleExportSample,
    handleExportErrors,
    
    moveToPreviousStep,
  } = importHook;
  
  // Render step content based on current step
  const renderStepContent = () => {
    switch (step) {
      case 1: // Upload
        return (
          <div style={{ textAlign: 'center' }}>
            <h3>Upload CSV File</h3>
            <p style={{ color: theme.colors.brand.text, marginBottom: '1.5rem' }}>
              Upload a CSV file containing your contacts data
            </p>
            
            <CSVFileUpload
              onFileLoaded={(parsedData, selectedFile) => {
                handleFileSelected(selectedFile);
                if (parsedData && parsedData.headers && parsedData.rows) {
                  importHook.csvData = parsedData;
                  importHook.moveToNextStep();
                }
              }}
              onError={(errorMessage) => importHook.error = errorMessage}
              disabled={loading}
            />
            
            <div style={{ marginBottom: '1.5rem', textAlign: 'center', marginTop: '1rem' }}>
              <Button 
                onClick={handleExportSample}
                variant="outline"
              >
                Download Sample CSV
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
                    <li>For phone numbers, include country code for international numbers</li>
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
            
            <CSVColumnMapper 
              csvData={csvData}
              mappings={mappings}
              onMappingChange={updateMappings}
              fieldOptions={availableFields}
            />
            
            <div style={{ 
              backgroundColor: '#f0f9ff', 
              padding: '1rem', 
              borderRadius: theme.borderRadius.sm,
              border: '1px solid #cce5ff',
              marginTop: '1.5rem'
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
            
            <CSVDataPreview
              csvData={csvData}
              mappings={mappings}
              fieldOptions={availableFields}
              previewRows={5}
            />
            
            <div style={{ marginTop: '1.5rem' }}>
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
              <ImportResults 
                results={importResults}
                onExportErrors={handleExportErrors}
              />
            )}
          </div>
        );
        
      default:
        return null;
    }
  };
  
  // Render buttons based on current step
  const renderStepButtons = () => {
    switch (step) {
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
                  processFile(file);
                } else {
                  importHook.error = 'Please select a file to upload';
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
              onClick={moveToPreviousStep}
              variant="outline"
              disabled={loading}
            >
              Back
            </Button>
            <Button
              onClick={moveToReview}
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
              onClick={moveToPreviousStep}
              variant="outline"
              disabled={loading}
            >
              Back
            </Button>
            <Button
              onClick={startImport}
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
              onClick={resetImport}
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
            transform: 'translateY(-50%)'
          }}></div>
          
          {/* Colored Progress */}
          <div style={{ 
            position: 'absolute',
            top: '50%',
            left: '0',
            width: `${((step - 1) / 3) * 100}%`,
            height: '2px',
            backgroundColor: theme.colors.brand.primary,
            zIndex: 1,
            transform: 'translateY(-50%)',
            transition: 'width 0.3s ease'
          }}></div>
          
          {/* Step Circles */}
          {[1, 2, 3, 4].map(stepNum => (
            <div key={stepNum} style={{ 
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
                backgroundColor: step >= stepNum ? theme.colors.brand.primary : 'white',
                color: step >= stepNum ? 'white' : theme.colors.brand.text,
                border: `2px solid ${step >= stepNum ? theme.colors.brand.primary : '#ddd'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                marginBottom: '0.5rem',
                transition: 'all 0.2s ease'
              }}>
                {stepNum === 1 && <FaUpload size={16} />}
                {stepNum === 2 && <FaTable size={16} />}
                {stepNum === 3 && <FaCheck size={16} />}
                {stepNum === 4 && (importResults ? <FaCheck size={16} /> : <FaTimes size={16} />)}
              </div>
              <div style={{ 
                textAlign: 'center', 
                fontSize: '0.9rem',
                color: step >= stepNum ? theme.colors.brand.primary : theme.colors.brand.text,
                fontWeight: step === stepNum ? 'bold' : 'normal'
              }}>
                {stepNum === 1 && 'Upload'}
                {stepNum === 2 && 'Map Columns'}
                {stepNum === 3 && 'Review'}
                {stepNum === 4 && 'Results'}
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
    </ProtectedRoute>
  );
}