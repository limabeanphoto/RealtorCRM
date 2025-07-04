// pages/api/auth/login.js
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { withSecurity } from '../../../utils/rateLimiter'
import { isValidEmail } from '../../../utils/validation'
import { logError, logSecurity, logInfo } from '../../../utils/logger'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}

async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  try {
    const { email, password } = req.body

    // Enhanced validation
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' })
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' })
    }

    if (typeof password !== 'string' || password.length < 1) {
      return res.status(400).json({ success: false, message: 'Invalid password' })
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    })

    // Check if user exists
    if (!user) {
      logSecurity('Login attempt with invalid email', { email, ip: req.headers['x-forwarded-for'] || 'unknown' })
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
    if (!isPasswordValid) {
      logSecurity('Login attempt with invalid password', { 
        email, 
        userId: user.id,
        ip: req.headers['x-forwarded-for'] || 'unknown'
      })
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }

    // Update last login time
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })

    // Create token payload (don't include sensitive info)
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role
    }

    // Generate JWT token
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' })

    // Log successful login
    logInfo('User logged in successfully', {
      userId: user.id,
      email: user.email,
      role: user.role,
      ip: req.headers['x-forwarded-for'] || 'unknown'
    })

    // Return user data and token
    return res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        token
      }
    })
  } catch (error) {
    logError('Login process failed', error, {
      email: req.body?.email,
      ip: req.headers['x-forwarded-for'] || 'unknown'
    })
    return res.status(500).json({ success: false, message: 'Authentication failed' })
  }
}

// Export with security middleware
export default withSecurity(handler, {
  rateLimit: true,
  rateLimitType: 'auth',
  auth: false,
  validation: null
})