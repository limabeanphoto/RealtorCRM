// pages/api/users/index.js
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import withAuth from '../../../utils/withAuth'

const prisma = new PrismaClient()

async function handler(req, res) {
  // GET - List all users (admin only)
  if (req.method === 'GET') {
    // Check if requester is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized. Admin access required.' })
    }

    try {
      // Get all users without returning sensitive information
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          cellPhone: true,
          assignedCallNumber: true,
          role: true,
          createdAt: true,
          lastLoginAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      return res.status(200).json({ success: true, data: users })
    } catch (error) {
      console.error('Error fetching users:', error)
      return res.status(500).json({ success: false, message: 'Error fetching users' })
    }
  }
  
  // POST - Create a new user (admin only)
  else if (req.method === 'POST') {
    // Check if requester is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized. Admin access required.' })
    }

    try {
      const { email, password, firstName, lastName, cellPhone, assignedCallNumber, role } = req.body

      // Basic validation
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ success: false, message: 'Required fields missing' })
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })

      if (existingUser) {
        return res.status(400).json({ success: false, message: 'User with this email already exists' })
      }

      // Hash password
      const salt = await bcrypt.genSalt(10)
      const passwordHash = await bcrypt.hash(password, salt)

      // Create new user
      const newUser = await prisma.user.create({
        data: {
          id: uuidv4(),
          email,
          passwordHash,
          firstName,
          lastName,
          cellPhone: cellPhone || null,
          assignedCallNumber: assignedCallNumber || null,
          role: role || 'member',
          createdAt: new Date(),
          lastLoginAt: null
        }
      })

      // Return success without sensitive data
      return res.status(201).json({
        success: true,
        data: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role
        }
      })
    } catch (error) {
      console.error('Error creating user:', error)
      return res.status(500).json({ success: false, message: 'Error creating user' })
    }
  }
  
  else {
    return res.status(405).json({ success: false, message: `Method ${req.method} not allowed` })
  }
}

export default withAuth(handler)