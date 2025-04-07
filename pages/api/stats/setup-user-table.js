import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  try {
    // Create the User table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL UNIQUE,
        "role" TEXT NOT NULL DEFAULT 'user',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `
    
    // Add userId fields to Call and Task tables
    await prisma.$executeRaw`
      ALTER TABLE "Call" 
      ADD COLUMN IF NOT EXISTS "userId" TEXT,
      ADD CONSTRAINT "Call_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
    `
    
    await prisma.$executeRaw`
      ALTER TABLE "Task" 
      ADD COLUMN IF NOT EXISTS "userId" TEXT,
      ADD CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
    `
    
    return res.status(200).json({ 
      success: true, 
      message: 'User table created and relations added successfully' 
    })
  } catch (error) {
    console.error('Error updating tables:', error)
    return res.status(500).json({ success: false, message: error.message })
  }
}