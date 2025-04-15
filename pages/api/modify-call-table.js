import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  try {
    // Add the isDeal column if it doesn't exist
    await prisma.$executeRaw`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'Call' 
          AND column_name = 'isDeal'
        ) THEN 
          ALTER TABLE "Call" 
          ADD COLUMN "isDeal" BOOLEAN NOT NULL DEFAULT false;
        END IF;
      END $$;
    `

    // Add the dealValue column if it doesn't exist
    await prisma.$executeRaw`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'Call' 
          AND column_name = 'dealValue'
        ) THEN 
          ALTER TABLE "Call" 
          ADD COLUMN "dealValue" FLOAT;
        END IF;
      END $$;
    `

    return res.status(200).json({ 
      success: true, 
      message: 'Call table modified successfully: isDeal and dealValue columns added'
    })
  } catch (error) {
    console.error('Error modifying table:', error)
    return res.status(500).json({ success: false, message: error.message })
  }
}