import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  try {
    // Create admin user if it doesn't exist
    const adminExists = await prisma.user.findFirst({
      where: {
        role: 'admin'
      }
    })

    if (adminExists) {
      return res.status(400).json({ 
        success: false, 
        message: 'Admin user already exists' 
      })
    }

    // You can customize these values for your admin user
    const adminEmail = 'admin@example.com'
    const adminPassword = 'admin123'
    const adminFirstName = 'Admin'
    const adminLastName = 'User'

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(adminPassword, salt)

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        id: uuidv4(),
        email: adminEmail,
        passwordHash,
        firstName: adminFirstName,
        lastName: adminLastName,
        role: 'admin',
        createdAt: new Date(),
        lastLoginAt: null
      }
    })

    return res.status(200).json({ 
      success: true, 
      message: 'Admin user created successfully',
      data: {
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role
      }
    })
  } catch (error) {
    console.error('Error creating admin user:', error)
    return res.status(500).json({ success: false, message: error.message })
  }
}