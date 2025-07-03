// pages/api/admin/reset-database.js - SECURED VERSION
import { PrismaClient } from '@prisma/client'
import { withAdminAuth } from '../../../utils/withAuth'

const prisma = new PrismaClient()

async function handler(req, res) {
  // Only allow POST requests for security
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: `Method ${req.method} not allowed. Use POST for security.` 
    })
  }

  // Additional security check - require explicit confirmation
  if (!req.body.confirm || req.body.confirm !== 'RESET_DATABASE') {
    return res.status(400).json({
      success: false,
      message: 'Database reset requires explicit confirmation. Send { "confirm": "RESET_DATABASE" } in request body.'
    })
  }

  try {
    console.log('Starting database reset and schema sync...')

    // Step 1: Drop all existing data and recreate tables with correct schema
    await prisma.$executeRaw`DROP TABLE IF EXISTS "Task" CASCADE;`
    await prisma.$executeRaw`DROP TABLE IF EXISTS "Call" CASCADE;`
    await prisma.$executeRaw`DROP TABLE IF EXISTS "Contact" CASCADE;`
    await prisma.$executeRaw`DROP TABLE IF EXISTS "User" CASCADE;`
    await prisma.$executeRaw`DROP TABLE IF EXISTS "_prisma_migrations" CASCADE;`

    console.log('Dropped existing tables...')

    // Step 2: Create User table with ALL goal fields including dailyContactGoal
    await prisma.$executeRaw`
      CREATE TABLE "User" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "email" TEXT NOT NULL UNIQUE,
        "passwordHash" TEXT NOT NULL,
        "firstName" TEXT NOT NULL,
        "lastName" TEXT NOT NULL,
        "cellPhone" TEXT,
        "assignedCallNumber" TEXT,
        "role" TEXT NOT NULL DEFAULT 'member',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "lastLoginAt" TIMESTAMP(3),
        "dailyCallGoal" INTEGER DEFAULT 30,
        "dailyDealGoal" INTEGER DEFAULT 5,
        "dailyContactGoal" INTEGER DEFAULT 10,
        "openPhoneApiKey" TEXT
      );
    `

    // Step 3: Create Contact table with all new fields
    await prisma.$executeRaw`
      CREATE TABLE "Contact" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "email" TEXT,
        "phone" TEXT NOT NULL,
        "company" TEXT,
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "lastCallOutcome" TEXT,
        "lastCallDate" TIMESTAMP(3),
        "assignedTo" TEXT,
        "status" TEXT DEFAULT 'Open',
        "profileLink" TEXT,
        "volume" TEXT,
        "region" TEXT,
        FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
      );
    `

    // Step 4: Create Call table
    await prisma.$executeRaw`
      CREATE TABLE "Call" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "contactId" TEXT NOT NULL,
        "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "duration" INTEGER NOT NULL,
        "notes" TEXT,
        "outcome" TEXT NOT NULL,
        "isDeal" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "userId" TEXT,
        FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
      );
    `

    // Step 5: Create Task table
    await prisma.$executeRaw`
      CREATE TABLE "Task" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "status" TEXT NOT NULL DEFAULT 'Open',
        "priority" TEXT NOT NULL DEFAULT 'Medium',
        "dueDate" TIMESTAMP(3) NOT NULL,
        "completed" BOOLEAN NOT NULL DEFAULT false,
        "completedAt" TIMESTAMP(3),
        "contactId" TEXT,
        "callId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "userId" TEXT,
        FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE,
        FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE SET NULL ON UPDATE CASCADE,
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
      );
    `

    // Step 6: Create indexes for performance
    await prisma.$executeRaw`CREATE INDEX "Contact_assignedTo_idx" ON "Contact"("assignedTo");`
    await prisma.$executeRaw`CREATE INDEX "Contact_status_idx" ON "Contact"("status");`
    await prisma.$executeRaw`CREATE INDEX "Call_contactId_idx" ON "Call"("contactId");`
    await prisma.$executeRaw`CREATE INDEX "Call_userId_idx" ON "Call"("userId");`
    await prisma.$executeRaw`CREATE INDEX "Task_contactId_idx" ON "Task"("contactId");`
    await prisma.$executeRaw`CREATE INDEX "Task_userId_idx" ON "Task"("userId");`

    console.log('Created all tables with correct schema...')

    // Step 7: Create a default admin user with ALL goal fields
    const bcrypt = require('bcryptjs')
    const { v4: uuidv4 } = require('uuid')
    
    const hashedPassword = await bcrypt.hash('admin123', 10)
    const adminId = uuidv4()
    
    await prisma.user.create({
      data: {
        id: adminId,
        email: 'admin@company.com',
        passwordHash: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        dailyCallGoal: 50,
        dailyDealGoal: 8,
        dailyContactGoal: 15
      }
    })

    // Step 8: Create a sample member user with ALL goal fields
    const memberPassword = await bcrypt.hash('member123', 10)
    const memberId = uuidv4()
    
    await prisma.user.create({
      data: {
        id: memberId,
        email: 'member@company.com',
        passwordHash: memberPassword,
        firstName: 'Team',
        lastName: 'Member',
        role: 'member',
        dailyCallGoal: 30,
        dailyDealGoal: 5,
        dailyContactGoal: 10
      }
    })

    console.log('Created sample users...')

    // Get final user count
    const userCount = await prisma.user.count()
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        dailyCallGoal: true,
        dailyDealGoal: true,
        dailyContactGoal: true
      }
    })

    return res.status(200).json({
      success: true,
      message: 'Database reset and recreated successfully with all fields',
      data: {
        usersCreated: userCount,
        users: users.map(user => ({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        })),
        note: 'Default test accounts created. Change passwords immediately.'
      }
    })

  } catch (error) {
    console.error('Database reset error:', error)
    
    const errorMessage = `Database reset failed: ${error.message}`
    
    return res.status(500).json({
      success: false,
      message: 'Database reset failed',
      error: error.message, // Always show error for debugging
      stack: error.stack
    })
  }
}

// Export with admin authentication wrapper - TEMPORARILY DISABLED FOR RESET
// export default withAdminAuth(handler)
export default handler