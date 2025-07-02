// pages/api/auth/register.js
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { withAdminAuth } from '../../../utils/withAuth'

const prisma = new PrismaClient()

async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  try {
    const { email, password, firstName, lastName, cellPhone, assignedCallNumber, role } = req.body
    
    // Admin check is now handled by withAdminAuth

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
    console.error('Registration error:', error)
    return res.status(500).json({ success: false, message: 'Registration failed' })
  }
}

export default withAdminAuth(handler)