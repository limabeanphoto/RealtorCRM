// utils/withAuth.js
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Authentication and authorization wrapper for API routes
 * @param {Function} handler - The API route handler
 * @param {Object} options - Authentication options
 * @param {String} options.requiredRole - Required role to access this route
 */
export default function withAuth(handler, options = {}) {
  return async (req, res) => {
    try {
      // Get token from header
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required'
        });
      }
      
      const token = authHeader.split(' ')[1];
      
      // Verify token
      let decoded;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch (error) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid or expired token'
        });
      }
      
      // Find user
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });
      
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'User not found'
        });
      }
      
      // Role-based access control
      if (options.requiredRole && user.role !== options.requiredRole) {
        // Special case: allow admin to access any route
        if (user.role !== 'admin') {
          return res.status(403).json({ 
            success: false, 
            message: `Requires ${options.requiredRole} role`
          });
        }
      }
      
      // Add user to request object
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      };
      
      // Continue to handler
      return handler(req, res);
    } catch (error) {
      console.error('Auth error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Authentication error'
      });
    }
  };
}

/**
 * Helper to restrict a route to admin users only
 */
export function withAdminAuth(handler) {
  return withAuth(handler, { requiredRole: 'admin' });
}

/**
 * Helper to restrict a route to member users only
 */
export function withMemberAuth(handler) {
  return withAuth(handler, { requiredRole: 'member' });
}