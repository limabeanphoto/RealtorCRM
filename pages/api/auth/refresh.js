// pages/api/auth/refresh.js
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key' // Use environment variable in production

// Set token expiration to 30 days
const JWT_EXPIRATION = '30d'

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required'
      })
    }
    
    const token = authHeader.split(' ')[1]
    
    // Verify the token
    let decoded
    try {
      decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true })
    } catch (error) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token'
      })
    }
    
    // Check if token is already expired
    const now = Math.floor(Date.now() / 1000)
    if (!decoded.exp || now > decoded.exp + (24 * 60 * 60)) {
      // If token is expired by more than 24 hours, reject refresh
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired'
      })
    }
    
    // Get user from database to ensure they still exist
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found'
      })
    }
    
    // Create token payload for new token
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role
    }
    
    // Generate new JWT token with extended expiration
    const newToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRATION })
    
    // Return user data and new token
    return res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        token: newToken
      }
    })
  } catch (error) {
    console.error('Token refresh error:', error)
    return res.status(500).json({ success: false, message: 'Token refresh failed' })
  }
}