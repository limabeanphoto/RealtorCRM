// utils/dateUtils.js

/**
 * Get tomorrow at 12:00 PM Pacific Time as an ISO string
 * suitable for datetime-local input
 * 
 * @returns {string} ISO string formatted for datetime-local input
 */
export function getTomorrowNoonPacific() {
    // Get current date
    const now = new Date();
    
    // Add one day to get tomorrow
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Set time to 12:00 PM (noon)
    tomorrow.setHours(12, 0, 0, 0);
    
    // To properly handle Pacific Time, we need to account for the timezone offset
    // Pacific Time is UTC-8 (standard time) or UTC-7 (daylight saving time)
    // We'll determine which one to use based on the date
    
    // Current timezone offset in minutes
    const currentOffset = tomorrow.getTimezoneOffset();
    
    // Pacific Time offset in minutes
    // Pacific Standard Time (PST) is UTC-8 = 480 minutes
    // Pacific Daylight Time (PDT) is UTC-7 = 420 minutes
    
    // Determine if Pacific Time is currently in DST
    // A simple heuristic: PDT is in effect from second Sunday in March to first Sunday in November
    const isPDT = isPacificDaylightTime(tomorrow);
    const pacificOffset = isPDT ? 420 : 480; // minutes
    
    // Calculate the difference between local time and Pacific Time in milliseconds
    const offsetDiff = (pacificOffset - currentOffset) * 60 * 1000;
    
    // Adjust the time to Pacific Time
    tomorrow.setTime(tomorrow.getTime() + offsetDiff);
    
    // Format for datetime-local input (YYYY-MM-DDTHH:MM)
    return tomorrow.toISOString().slice(0, 16);
  }
  
  /**
   * Determine if a date is during Pacific Daylight Time
   * 
   * @param {Date} date - The date to check
   * @returns {boolean} - True if date is during PDT, false otherwise
   */
  function isPacificDaylightTime(date) {
    const year = date.getFullYear();
    
    // Second Sunday in March
    const marchSecondSunday = new Date(year, 2, 1);
    marchSecondSunday.setDate(marchSecondSunday.getDate() + (14 - marchSecondSunday.getDay()) % 7);
    
    // First Sunday in November
    const novemberFirstSunday = new Date(year, 10, 1);
    novemberFirstSunday.setDate(novemberFirstSunday.getDate() + (7 - novemberFirstSunday.getDay()) % 7);
    
    // Pacific Daylight Time is in effect from 2:00 AM on the second Sunday in March
    // until 2:00 AM on the first Sunday in November
    return date >= marchSecondSunday && date < novemberFirstSunday;
  }
  
  /**
   * Format a date string to Pacific Time
   * 
   * @param {string} dateString - ISO date string
   * @returns {string} - Formatted date string in Pacific Time
   */
  export function formatDateToPacificTime(dateString) {
    const date = new Date(dateString);
    
    // Options for toLocaleString
    const options = {
      timeZone: 'America/Los_Angeles',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    
    return date.toLocaleString('en-US', options);
  }