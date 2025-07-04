// utils/rateLimiter.js - Rate limiting middleware

import { checkRateLimit } from './validation.js'

/**
 * Rate limiting configurations for different endpoints
 */
const rateLimitConfigs = {
  // Authentication endpoints - stricter limits
  auth: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many authentication attempts. Please try again in 15 minutes.'
  },
  
  // General API endpoints
  api: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many requests. Please try again in a minute.'
  },
  
  // Import/export endpoints - more restrictive
  import: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many import/export requests. Please wait before trying again.'
  },
  
  // Admin endpoints
  admin: {
    maxRequests: 50,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many admin requests. Please wait before trying again.'
  }
}

/**
 * Get client identifier for rate limiting
 * Uses IP address as primary identifier
 */
function getClientIdentifier(req) {
  // Check for forwarded IP first (for proxies/load balancers)
  const forwardedFor = req.headers['x-forwarded-for']
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  
  // Check for real IP (some proxies)
  if (req.headers['x-real-ip']) {
    return req.headers['x-real-ip']
  }
  
  // Fallback to connection remote address
  if (req.connection?.remoteAddress) {
    return req.connection.remoteAddress
  }
  
  // Last resort - use a default identifier
  return 'unknown'
}

/**
 * Rate limiting middleware factory
 */
export function withRateLimit(handler, configType = 'api') {
  return async (req, res) => {
    try {
      const config = rateLimitConfigs[configType]
      if (!config) {
        throw new Error(`Unknown rate limit config: ${configType}`)
      }
      
      const clientId = getClientIdentifier(req)
      const rateLimitKey = `${configType}:${clientId}`
      
      const rateLimitResult = checkRateLimit(
        rateLimitKey,
        config.maxRequests,
        config.windowMs
      )
      
      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', config.maxRequests)
      res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining)
      res.setHeader('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString())
      
      if (!rateLimitResult.allowed) {
        // Add Retry-After header
        const retryAfterSeconds = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        res.setHeader('Retry-After', retryAfterSeconds)
        
        return res.status(429).json({
          success: false,
          message: config.message,
          retryAfter: retryAfterSeconds
        })
      }
      
      return handler(req, res)
    } catch (error) {
      console.error('Rate limiting error:', error.message)
      // If rate limiting fails, continue with the request (fail open)
      return handler(req, res)
    }
  }
}

/**
 * Specific rate limiters for common use cases
 */
export function withAuthRateLimit(handler) {
  return withRateLimit(handler, 'auth')
}

export function withApiRateLimit(handler) {
  return withRateLimit(handler, 'api')
}

export function withImportRateLimit(handler) {
  return withRateLimit(handler, 'import')
}

export function withAdminRateLimit(handler) {
  return withRateLimit(handler, 'admin')
}

/**
 * Combined auth and rate limiting wrapper
 */
export function withAuthAndRateLimit(handler, options = {}) {
  const { 
    requiredRole = null,
    rateLimitType = 'api'
  } = options
  
  // Import withAuth dynamically to avoid circular dependencies
  return async (req, res) => {
    try {
      const { withAuth } = await import('./withAuth.js')
      
      // Apply rate limiting first
      const rateLimitedHandler = withRateLimit(handler, rateLimitType)
      
      // Then apply authentication
      const authHandler = withAuth(rateLimitedHandler, { requiredRole })
      
      return authHandler(req, res)
    } catch (error) {
      console.error('Combined middleware error:', error.message)
      return res.status(500).json({
        success: false,
        message: 'Server error'
      })
    }
  }
}

/**
 * Security headers middleware
 */
export function withSecurityHeaders(handler) {
  return async (req, res) => {
    // Set security headers
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('X-XSS-Protection', '1; mode=block')
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    
    // Content Security Policy
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Note: unsafe-inline/eval needed for Next.js dev
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'"
    ].join('; ')
    
    res.setHeader('Content-Security-Policy', csp)
    
    return handler(req, res)
  }
}

/**
 * Comprehensive security middleware combining multiple protections
 */
export function withSecurity(handler, options = {}) {
  const {
    rateLimit = true,
    rateLimitType = 'api',
    auth = false,
    requiredRole = null,
    validation = null
  } = options
  
  return async (req, res) => {
    try {
      let currentHandler = handler
      
      // Apply validation if specified
      if (validation) {
        const { withValidation } = await import('./validation.js')
        currentHandler = withValidation(currentHandler, validation)
      }
      
      // Apply authentication if required
      if (auth) {
        const { withAuth } = await import('./withAuth.js')
        currentHandler = withAuth(currentHandler, { requiredRole })
      }
      
      // Apply rate limiting if enabled
      if (rateLimit) {
        currentHandler = withRateLimit(currentHandler, rateLimitType)
      }
      
      // Apply security headers
      currentHandler = withSecurityHeaders(currentHandler)
      
      return currentHandler(req, res)
    } catch (error) {
      console.error('Security middleware error:', error.message)
      return res.status(500).json({
        success: false,
        message: 'Server error'
      })
    }
  }
}