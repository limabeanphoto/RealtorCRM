import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  try {
    // Create the Call table manually
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Call" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "contactId" TEXT NOT NULL,
        "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "duration" INTEGER NOT NULL,
        "notes" TEXT,
        "outcome" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Call_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `
    return res.status(200).json({ success: true, message: 'Call table created successfully' })
  } catch (error) {
    console.error('Error creating table:', error)
    return res.status(500).json({ success: false, message: error.message })
  }
}