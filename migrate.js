// migrate.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting migration...');
    
    // Check if columns already exist to make script idempotent
    let columnsExist = false;
    try {
      // Try to query one of the new fields to check if it exists
      await prisma.contact.findFirst({
        select: { profileLink: true }
      });
      columnsExist = true;
    } catch (e) {
      // Column doesn't exist, continue with migration
      console.log('Columns do not exist yet, proceeding with migration...');
    }
    
    if (!columnsExist) {
      // Execute ALTER TABLE commands via Prisma's $executeRaw
      // The exact syntax depends on your database provider (PostgreSQL, MySQL, etc.)
      
      // For PostgreSQL
      await prisma.$executeRaw`
        ALTER TABLE "Contact" 
        ADD COLUMN IF NOT EXISTS "profileLink" TEXT,
        ADD COLUMN IF NOT EXISTS "volume" TEXT,
        ADD COLUMN IF NOT EXISTS "region" TEXT;
      `;
      
      console.log('Migration completed successfully!');
    } else {
      console.log('Columns already exist, no migration needed.');
    }
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();