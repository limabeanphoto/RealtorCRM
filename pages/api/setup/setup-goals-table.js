import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  try {
    // Create the Goal table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Goal" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "goalType" TEXT NOT NULL,
        "targetValue" INTEGER NOT NULL,
        "startDate" TIMESTAMP(3) NOT NULL,
        "endDate" TIMESTAMP(3) NOT NULL,
        "userId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
      )
    `
    
    return res.status(200).json({ 
      success: true, 
      message: 'Goal table created successfully' 
    })
  } catch (error) {
    console.error('Error creating goal table:', error)
    return res.status(500).json({ success: false, message: error.message })
  }
}