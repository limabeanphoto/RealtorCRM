// utils/logger.js - Secure logging utility

/**
 * Log levels for different types of messages
 */
export const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
}

/**
 * Sanitize log data to remove sensitive information
 */
function sanitizeLogData(data) {
  if (!data || typeof data !== 'object') {
    return data
  }

  const sanitized = { ...data }
  
  // Remove sensitive fields
  const sensitiveFields = [
    'password',
    'passwordHash',
    'token',
    'jwt',
    'secret',
    'apiKey',
    'authorization',
    'cookie',
    'session'
  ]
  
  function removeSensitiveData(obj, path = '') {
    if (!obj || typeof obj !== 'object') return obj
    
    if (Array.isArray(obj)) {
      return obj.map((item, index) => removeSensitiveData(item, `${path}[${index}]`))
    }
    
    const cleaned = {}
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase()
      const currentPath = path ? `${path}.${key}` : key
      
      // Check if this field should be redacted
      if (sensitiveFields.some(field => lowerKey.includes(field))) {
        cleaned[key] = '[REDACTED]'
      } else if (typeof value === 'object' && value !== null) {
        cleaned[key] = removeSensitiveData(value, currentPath)
      } else {
        cleaned[key] = value
      }
    }
    
    return cleaned
  }
  
  return removeSensitiveData(sanitized)
}

/**
 * Format log message with timestamp and context
 */
function formatLogMessage(level, message, context = {}) {
  const timestamp = new Date().toISOString()
  const sanitizedContext = sanitizeLogData(context)
  
  return {
    timestamp,
    level,
    message,
    ...sanitizedContext,
    env: process.env.NODE_ENV || 'development'
  }
}

/**
 * Core logging function
 */
function log(level, message, context = {}) {
  const logData = formatLogMessage(level, message, context)
  
  // In development, log to console with nice formatting
  if (process.env.NODE_ENV === 'development') {
    const colorMap = {
      ERROR: '\x1b[31m', // Red
      WARN: '\x1b[33m',  // Yellow
      INFO: '\x1b[36m',  // Cyan
      DEBUG: '\x1b[90m'  // Gray
    }
    
    const resetColor = '\x1b[0m'
    const color = colorMap[level] || ''
    
    console.log(
      `${color}[${logData.timestamp}] ${level}:${resetColor} ${message}`,
      Object.keys(sanitizedContext).length > 0 ? sanitizedContext : ''
    )
  } else {
    // In production, log as JSON for structured logging
    console.log(JSON.stringify(logData))
  }
}

/**
 * Log an error with stack trace
 */
export function logError(message, error, context = {}) {
  const errorContext = {
    ...context,
    error: {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
      code: error?.code
    }
  }
  
  log(LOG_LEVELS.ERROR, message, errorContext)
}

/**
 * Log a warning
 */
export function logWarning(message, context = {}) {
  log(LOG_LEVELS.WARN, message, context)
}

/**
 * Log informational message
 */
export function logInfo(message, context = {}) {
  log(LOG_LEVELS.INFO, message, context)
}

/**
 * Log debug information (only in development)
 */
export function logDebug(message, context = {}) {
  if (process.env.NODE_ENV === 'development') {
    log(LOG_LEVELS.DEBUG, message, context)
  }
}

/**
 * Log security events
 */
export function logSecurity(message, context = {}) {
  const securityContext = {
    ...context,
    type: 'SECURITY_EVENT',
    timestamp: new Date().toISOString()
  }
  
  log(LOG_LEVELS.WARN, `SECURITY: ${message}`, securityContext)
}

/**
 * Log API requests (for monitoring)
 */
export function logApiRequest(req, res, duration, context = {}) {
  const requestContext = {
    ...context,
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    duration: `${duration}ms`,
    userAgent: req.headers['user-agent'],
    ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
    userId: req.user?.id
  }
  
  const level = res.statusCode >= 400 ? LOG_LEVELS.ERROR : LOG_LEVELS.INFO
  log(level, `API Request: ${req.method} ${req.url}`, requestContext)
}

/**
 * Performance monitoring
 */
export function logPerformance(operation, duration, context = {}) {
  const perfContext = {
    ...context,
    operation,
    duration: `${duration}ms`,
    type: 'PERFORMANCE'
  }
  
  const level = duration > 5000 ? LOG_LEVELS.WARN : LOG_LEVELS.INFO
  log(level, `Performance: ${operation} took ${duration}ms`, perfContext)
}

/**
 * Log database operations
 */
export function logDatabase(operation, table, duration, context = {}) {
  const dbContext = {
    ...context,
    operation,
    table,
    duration: `${duration}ms`,
    type: 'DATABASE'
  }
  
  logDebug(`DB: ${operation} on ${table}`, dbContext)
}

/**
 * Middleware for automatic API request logging
 */
export function withRequestLogging(handler) {
  return async (req, res) => {
    const startTime = Date.now()
    
    try {
      const result = await handler(req, res)
      const duration = Date.now() - startTime
      
      logApiRequest(req, res, duration)
      
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      
      logError('API Request failed', error, {
        method: req.method,
        url: req.url,
        duration: `${duration}ms`,
        userId: req.user?.id
      })
      
      throw error
    }
  }
}

/**
 * Error boundary for API routes
 */
export function withErrorBoundary(handler) {
  return async (req, res) => {
    try {
      return await handler(req, res)
    } catch (error) {
      logError('Unhandled API error', error, {
        method: req.method,
        url: req.url,
        userId: req.user?.id,
        body: req.body
      })
      
      // Don't expose internal errors in production
      const message = process.env.NODE_ENV === 'development' 
        ? error.message 
        : 'Internal server error'
      
      return res.status(500).json({
        success: false,
        message
      })
    }
  }
}

/**
 * Create a logger instance with context
 */
export function createLogger(defaultContext = {}) {
  return {
    error: (message, error, context = {}) => 
      logError(message, error, { ...defaultContext, ...context }),
    
    warn: (message, context = {}) => 
      logWarning(message, { ...defaultContext, ...context }),
    
    info: (message, context = {}) => 
      logInfo(message, { ...defaultContext, ...context }),
    
    debug: (message, context = {}) => 
      logDebug(message, { ...defaultContext, ...context }),
    
    security: (message, context = {}) => 
      logSecurity(message, { ...defaultContext, ...context })
  }
}