import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  // Only allow POST requests for migrations
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  try {
    // 1. Determine if the column exists first (prevents errors)
    const checkColumn = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'Call' 
        AND column_name = 'dealValue'
      ) as column_exists;
    `;

    const columnExists = checkColumn[0].column_exists;

    if (!columnExists) {
      return res.status(200).json({ 
        success: true, 
        message: 'Migration not needed: dealValue column does not exist' 
      });
    }

    // 2. Remove the dealValue column from the Call table
    await prisma.$executeRaw`
      ALTER TABLE "Call" DROP COLUMN IF EXISTS "dealValue";
    `;

    // 3. Update isDeal field for all contacts with lastCallOutcome = 'Deal Closed'
    // This ensures that the Call.isDeal flag is properly set based on the contact status
    const updatedCallsCount = await prisma.$executeRaw`
      UPDATE "Call"
      SET "isDeal" = true
      WHERE "contactId" IN (
        SELECT "id" FROM "Contact" WHERE "lastCallOutcome" = 'Deal Closed'
      );
    `;

    return res.status(200).json({ 
      success: true, 
      message: `Migration completed successfully. Removed dealValue column from Call table and updated ${updatedCallsCount} call records.` 
    });

  } catch (error) {
    console.error('Migration error:', error)
    return res.status(500).json({ 
      success: false, 
      message: `Migration failed: ${error.message}` 
    });
  }
}