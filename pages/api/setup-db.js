import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  try {
    // Create the Contact table manually
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Contact" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "email" TEXT,
        "phone" TEXT NOT NULL,
        "company" TEXT,
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `
    return res.status(200).json({ success: true, message: 'Database table created successfully' })
  } catch (error) {
    console.error('Error creating table:', error)
    return res.status(500).json({ success: false, message: error.message })
  }
}