// utils/validation.js - Input validation and sanitization utilities

/**
 * Validation schemas for different entities
 */
export const schemas = {
  contact: {
    name: { required: true, type: 'string', maxLength: 100 },
    email: { required: false, type: 'email', maxLength: 255 },
    phone: { required: true, type: 'phone', maxLength: 20 },
    company: { required: false, type: 'string', maxLength: 100 },
    notes: { required: false, type: 'string', maxLength: 1000 },
    status: { required: false, type: 'enum', values: ['Open', 'Active', 'Closed'] },
    profileLink: { required: false, type: 'url', maxLength: 500 },
    volume: { required: false, type: 'string', maxLength: 50 },
    region: { required: false, type: 'string', maxLength: 50 }
  },
  
  call: {
    contactId: { required: true, type: 'string', maxLength: 50 },
    duration: { required: true, type: 'number', min: 0, max: 1440 },
    notes: { required: false, type: 'string', maxLength: 1000 },
    outcome: { required: true, type: 'enum', values: ['Interested', 'Not Interested', 'Follow Up', 'No Answer', 'Left Message', 'Wrong Number', 'Deal Closed'] },
    isDeal: { required: false, type: 'boolean' }
  },
  
  task: {
    title: { required: true, type: 'string', maxLength: 200 },
    description: { required: false, type: 'string', maxLength: 1000 },
    status: { required: false, type: 'enum', values: ['Open', 'In Progress', 'Completed'] },
    priority: { required: false, type: 'enum', values: ['Low', 'Medium', 'High'] },
    dueDate: { required: true, type: 'date' },
    contactId: { required: false, type: 'string', maxLength: 50 },
    callId: { required: false, type: 'string', maxLength: 50 }
  },
  
  user: {
    email: { required: true, type: 'email', maxLength: 255 },
    firstName: { required: true, type: 'string', maxLength: 50 },
    lastName: { required: true, type: 'string', maxLength: 50 },
    cellPhone: { required: false, type: 'phone', maxLength: 20 },
    assignedCallNumber: { required: false, type: 'phone', maxLength: 20 },
    role: { required: false, type: 'enum', values: ['admin', 'member'] },
    dailyCallGoal: { required: false, type: 'number', min: 0, max: 1000 },
    dailyDealGoal: { required: false, type: 'number', min: 0, max: 100 },
    dailyContactGoal: { required: false, type: 'number', min: 0, max: 1000 }
  }
}

/**
 * Sanitize string input by removing potentially harmful characters
 */
export function sanitizeString(input) {
  if (typeof input !== 'string') return input
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+=/gi, '') // Remove event handlers
    .substring(0, 10000) // Limit total length
}

/**
 * Validate email format
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 255
}

/**
 * Validate phone number format (flexible - allows various formats)
 */
export function isValidPhone(phone) {
  // Remove all non-digit characters for validation
  const digitsOnly = phone.replace(/\D/g, '')
  // Allow 10-15 digits (international formats)
  return digitsOnly.length >= 10 && digitsOnly.length <= 15
}

/**
 * Validate URL format
 */
export function isValidUrl(url) {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Validate date string
 */
export function isValidDate(dateString) {
  const date = new Date(dateString)
  return date instanceof Date && !isNaN(date.getTime())
}

/**
 * Validate a single field based on schema
 */
export function validateField(value, fieldSchema, fieldName) {
  const errors = []
  
  // Check if required field is missing
  if (fieldSchema.required && (value === undefined || value === null || value === '')) {
    errors.push(`${fieldName} is required`)
    return errors
  }
  
  // Skip validation if field is optional and empty
  if (!fieldSchema.required && (value === undefined || value === null || value === '')) {
    return errors
  }
  
  // Type validation
  switch (fieldSchema.type) {
    case 'string':
      if (typeof value !== 'string') {
        errors.push(`${fieldName} must be a string`)
      } else {
        // Length validation
        if (fieldSchema.maxLength && value.length > fieldSchema.maxLength) {
          errors.push(`${fieldName} must be ${fieldSchema.maxLength} characters or less`)
        }
        if (fieldSchema.minLength && value.length < fieldSchema.minLength) {
          errors.push(`${fieldName} must be at least ${fieldSchema.minLength} characters`)
        }
      }
      break
      
    case 'email':
      if (!isValidEmail(value)) {
        errors.push(`${fieldName} must be a valid email address`)
      }
      break
      
    case 'phone':
      if (!isValidPhone(value)) {
        errors.push(`${fieldName} must be a valid phone number`)
      }
      break
      
    case 'url':
      if (!isValidUrl(value)) {
        errors.push(`${fieldName} must be a valid URL`)
      }
      break
      
    case 'number':
      const num = Number(value)
      if (isNaN(num)) {
        errors.push(`${fieldName} must be a number`)
      } else {
        if (fieldSchema.min !== undefined && num < fieldSchema.min) {
          errors.push(`${fieldName} must be at least ${fieldSchema.min}`)
        }
        if (fieldSchema.max !== undefined && num > fieldSchema.max) {
          errors.push(`${fieldName} must be no more than ${fieldSchema.max}`)
        }
      }
      break
      
    case 'boolean':
      if (typeof value !== 'boolean') {
        errors.push(`${fieldName} must be true or false`)
      }
      break
      
    case 'date':
      if (!isValidDate(value)) {
        errors.push(`${fieldName} must be a valid date`)
      }
      break
      
    case 'enum':
      if (!fieldSchema.values.includes(value)) {
        errors.push(`${fieldName} must be one of: ${fieldSchema.values.join(', ')}`)
      }
      break
  }
  
  return errors
}

/**
 * Validate an entire object based on schema
 */
export function validateObject(data, schemaName) {
  const schema = schemas[schemaName]
  if (!schema) {
    throw new Error(`Unknown schema: ${schemaName}`)
  }
  
  const errors = []
  const sanitizedData = {}
  
  // Validate each field in the schema
  for (const [fieldName, fieldSchema] of Object.entries(schema)) {
    const value = data[fieldName]
    const fieldErrors = validateField(value, fieldSchema, fieldName)
    errors.push(...fieldErrors)
    
    // Sanitize the value if it's valid
    if (fieldErrors.length === 0 && value !== undefined && value !== null) {
      if (typeof value === 'string') {
        sanitizedData[fieldName] = sanitizeString(value)
      } else {
        sanitizedData[fieldName] = value
      }
    }
  }
  
  // Check for unexpected fields
  const allowedFields = Object.keys(schema)
  const providedFields = Object.keys(data)
  const unexpectedFields = providedFields.filter(field => !allowedFields.includes(field))
  
  if (unexpectedFields.length > 0) {
    errors.push(`Unexpected fields: ${unexpectedFields.join(', ')}`)
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: errors.length === 0 ? sanitizedData : null
  }
}

/**
 * Middleware wrapper for API route validation
 */
export function withValidation(handler, schemaName) {
  return async (req, res) => {
    try {
      // Only validate POST and PUT requests
      if (req.method === 'POST' || req.method === 'PUT') {
        const validation = validateObject(req.body, schemaName)
        
        if (!validation.isValid) {
          return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: validation.errors
          })
        }
        
        // Replace request body with sanitized data
        req.body = validation.sanitizedData
      }
      
      return handler(req, res)
    } catch (error) {
      console.error('Validation middleware error:', error.message)
      return res.status(500).json({
        success: false,
        message: 'Validation error'
      })
    }
  }
}

/**
 * Password strength validation
 */
export function validatePassword(password) {
  const errors = []
  
  if (!password || typeof password !== 'string') {
    errors.push('Password is required')
    return { isValid: false, errors }
  }
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Rate limiting data structure (simple in-memory)
 */
const rateLimitStore = new Map()

/**
 * Simple rate limiting function
 */
export function checkRateLimit(identifier, maxRequests = 100, windowMs = 60000) {
  const now = Date.now()
  const windowStart = now - windowMs
  
  // Get or create rate limit data for this identifier
  let requestData = rateLimitStore.get(identifier) || []
  
  // Remove old requests outside the window
  requestData = requestData.filter(timestamp => timestamp > windowStart)
  
  // Check if limit exceeded
  if (requestData.length >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: requestData[0] + windowMs
    }
  }
  
  // Add current request
  requestData.push(now)
  rateLimitStore.set(identifier, requestData)
  
  return {
    allowed: true,
    remaining: maxRequests - requestData.length,
    resetTime: now + windowMs
  }
}