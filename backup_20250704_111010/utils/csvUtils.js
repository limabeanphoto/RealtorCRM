// utils/csvUtils.js

/**
 * Generate a sample CSV file blob for contact import
 * @returns {Blob} CSV file blob
 */
export function generateSampleCSV() {
    // Define headers and sample data
    const headers = ['Name', 'Email', 'Phone', 'Company', 'Notes'];
    
    const sampleData = [
      ['John Smith', 'john.smith@example.com', '(555) 123-4567', 'ABC Realty', 'Interested in luxury properties'],
      ['Jane Doe', 'jane.doe@example.com', '(555) 987-6543', 'XYZ Properties', 'Looking for new leads'],
      ['Robert Johnson', 'robert@example.com', '(555) 555-1234', 'Johnson Real Estate', 'Specializes in commercial properties'],
      ['Maria Garcia', 'maria@example.com', '(555) 222-3333', 'Garcia Homes', 'Works with first-time home buyers'],
      ['David Lee', 'david@example.com', '(555) 444-5555', 'Lee & Associates', 'Interested in investment properties']
    ];
    
    // Convert to CSV format
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => 
        row.map(cell => {
          // Quote cells containing commas or quotes
          if (cell.includes(',') || cell.includes('"')) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        }).join(',')
      )
    ].join('\n');
    
    // Create and return blob
    return new Blob([csvContent], { type: 'text/csv' });
  }
  
  /**
   * Download a blob as a file
   * @param {Blob} blob - The blob to download
   * @param {string} filename - The filename to use
   */
  export function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  /**
   * Generate and download a sample CSV file
   */
  export function downloadSampleCSV() {
    const blob = generateSampleCSV();
    downloadBlob(blob, 'sample_contacts.csv');
  }
  
  /**
   * Parse a CSV string into headers and rows
   * @param {string} csvString - The CSV content as a string
   * @returns {Object} Object with headers and rows arrays
   */
  export function parseCSV(csvString) {
    // Split into lines and filter out empty lines
    const lines = csvString.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      return { headers: [], rows: [] };
    }
    
    // Extract headers from first line
    const headers = parseCsvRow(lines[0]);
    
    // Parse data rows
    const rows = lines.slice(1).map(line => parseCsvRow(line));
    
    return { headers, rows };
  }
  
  /**
   * Parse a single CSV row handling quoted values and commas
   * @param {string} rowString - A single row from a CSV file
   * @returns {Array} Array of cell values
   */
  function parseCsvRow(rowString) {
    const cells = [];
    let currentCell = '';
    let insideQuotes = false;
    
    for (let i = 0; i < rowString.length; i++) {
      const char = rowString[i];
      const nextChar = rowString[i + 1];
      
      // Handle quotes
      if (char === '"') {
        // Check for escaped quotes (two double quotes in a row)
        if (nextChar === '"') {
          currentCell += '"';
          i++; // Skip the next quote
        } else {
          // Toggle quote state
          insideQuotes = !insideQuotes;
        }
      }
      // Handle commas
      else if (char === ',' && !insideQuotes) {
        cells.push(currentCell.trim());
        currentCell = '';
      }
      // All other characters
      else {
        currentCell += char;
      }
    }
    
    // Add the last cell
    cells.push(currentCell.trim());
    
    return cells;
  }
  
  /**
   * Generate an error report CSV from import errors
   * @param {Array} errors - Array of error objects
   * @returns {Blob} CSV file blob
   */
  export function generateErrorReport(errors) {
    if (!errors || !Array.isArray(errors) || errors.length === 0) {
      return null;
    }
    
    // Create headers
    const headers = ['Row', 'Error'];
    
    // Find all possible contact fields by examining the first error
    const contactFields = Object.keys(errors[0].contact || {});
    headers.push(...contactFields);
    
    // Create data rows
    const rows = errors.map(error => {
      const row = [(error.index + 1).toString(), error.error || 'Unknown error'];
      
      // Add contact field values
      contactFields.forEach(field => {
        const value = error.contact?.[field] || '';
        row.push(value);
      });
      
      return row;
    });
    
    // Convert to CSV format
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(cell => {
          // Quote cells containing commas or quotes
          if (cell.includes(',') || cell.includes('"')) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        }).join(',')
      )
    ].join('\n');
    
    // Create and return blob
    return new Blob([csvContent], { type: 'text/csv' });
  }
  
  /**
   * Download an error report as a CSV file
   * @param {Array} errors - Array of error objects
   */
  export function downloadErrorReport(errors) {
    const blob = generateErrorReport(errors);
    if (blob) {
      downloadBlob(blob, 'contact_import_errors.csv');
    }
  }