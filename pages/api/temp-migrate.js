// pages/api/temp-migrate.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Optional: Add a simple secret query parameter to prevent accidental runs
  // Example: /api/temp-migrate?secret=YOUR_SECRET_KEY
  // if (req.query.secret !== process.env.MIGRATION_SECRET) {
  //   return res.status(403).json({ message: 'Forbidden' });
  // }

  console.log('Starting migration via API route...');

  try {
    // Check if columns already exist
    let columnsExist = false;
    try {
      await prisma.contact.findFirst({
        select: { profileLink: true },
        where: { id: -1 } // Query for a non-existent ID to avoid fetching data
      });
      columnsExist = true;
      console.log('Columns seem to exist based on schema query.');
    } catch (e) {
        // We expect an error if the column doesn't exist in the schema yet
        if (e.message.includes('Invalid `prisma.contact.findFirst()` invocation')) {
             console.log('Columns do not exist yet according to schema, proceeding with migration check...');
        } else {
            // Rethrow unexpected errors
            throw e;
        }
    }

    // Execute ALTER TABLE if needed
    if (!columnsExist) {
      console.log('Executing ALTER TABLE...');
      // For PostgreSQL
      // Use $executeRawUnsafe if $executeRaw gives type errors with template literals in some older Prisma versions
      await prisma.$executeRaw`
        ALTER TABLE "Contact"
        ADD COLUMN IF NOT EXISTS "profileLink" TEXT,
        ADD COLUMN IF NOT EXISTS "volume" TEXT,
        ADD COLUMN IF NOT EXISTS "region" TEXT;
      `;
      console.log('Migration command executed successfully!');
      res.status(200).json({ message: 'Migration command executed successfully!' });
    } else {
      console.log('Columns already exist, no migration needed.');
      res.status(200).json({ message: 'Columns already exist, no migration needed.' });
    }

  } catch (error) {
    console.error('Migration failed:', error);
    res.status(500).json({ message: 'Migration failed', error: error.message });
  } finally {
    await prisma.$disconnect();
  }
}
