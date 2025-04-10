// utils/withAuth.js
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export default function withAuth(handler) {
  return async (req, res) => {
    try {
      // Get token from header
      const authHeader = req.headers.authorization
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'No token, authorization denied' })
      }
      
      const token = authHeader.split(' ')[1]
      
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET)
      
      // Find user
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      })
      
      if (!user) {
        return res.status(401).json({ success: false, message: 'User not found' })
      }
      
      // Add user to request object
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role
      }
      
      // Continue to handler
      return handler(req, res)
    } catch (error) {
      console.error('Auth middleware error:', error)
      return res.status(401).json({ success: false, message: 'Token is not valid' })
    }
  }
}