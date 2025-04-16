// pages/api/add-contact-status-fields.js
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  try {
    // Add lastCallOutcome and lastCallDate columns to Contact table
    await prisma.$executeRaw`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'Contact' 
          AND column_name = 'lastCallOutcome'
        ) THEN 
          ALTER TABLE "Contact" 
          ADD COLUMN "lastCallOutcome" TEXT;
        END IF;
        
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'Contact' 
          AND column_name = 'lastCallDate'
        ) THEN 
          ALTER TABLE "Contact" 
          ADD COLUMN "lastCallDate" TIMESTAMP(3);
        END IF;
      END $$;
    `

    return res.status(200).json({ 
      success: true, 
      message: 'Contact table modified successfully: lastCallOutcome and lastCallDate columns added'
    })
  } catch (error) {
    console.error('Error modifying table:', error)
    return res.status(500).json({ success: false, message: error.message })
  }
}