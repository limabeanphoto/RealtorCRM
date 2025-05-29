// pages/api/admin/reset-database.js
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  // Allow both GET and POST for easy browser access
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: `Method ${req.method} not allowed` 
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

    // Step 2: Create User table with goal fields
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
        "weeklyContactGoal" INTEGER DEFAULT 150,
        "monthlyRevenueGoal" INTEGER DEFAULT 10000
      );
    `

    // Step 3: Create Contact table
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

    // Step 7: Create a default admin user so you can log in
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
        weeklyContactGoal: 200,
        monthlyRevenueGoal: 15000
      }
    })

    // Step 8: Create a sample member user
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
        weeklyContactGoal: 150,
        monthlyRevenueGoal: 10000
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
        weeklyContactGoal: true,
        monthlyRevenueGoal: true
      }
    })

    // Return success page
    if (req.method === 'GET') {
      return res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Database Reset Complete</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
              max-width: 900px; 
              margin: 50px auto; 
              padding: 20px; 
              background-color: #f5f7fa;
              line-height: 1.6;
            }
            .container { 
              background: white; 
              padding: 40px; 
              border-radius: 12px; 
              box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            }
            .success { 
              color: #155724; 
              background-color: #d4edda; 
              border: 1px solid #c3e6cb; 
              padding: 20px; 
              border-radius: 8px; 
              margin-bottom: 30px;
              border-left: 5px solid #28a745;
            }
            .user-card {
              background-color: #f8f9fa;
              padding: 20px;
              margin: 15px 0;
              border-radius: 8px;
              border-left: 4px solid #8F9F3B;
            }
            .credentials {
              background: #fff3cd;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              border-left: 4px solid #ffc107;
            }
            .login-info {
              font-family: monospace;
              background: #f8f9fa;
              padding: 10px;
              border-radius: 4px;
              margin: 10px 0;
            }
            h1 { color: #2c3e50; margin-bottom: 10px; }
            h2 { color: #34495e; margin-top: 30px; }
            h3 { color: #2c3e50; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🎉 Database Reset Complete!</h1>
            
            <div class="success">
              <h3>✅ Success!</h3>
              <p><strong>Database has been completely reset and recreated with the correct schema!</strong></p>
              <ul>
                <li>All tables dropped and recreated</li>
                <li>Goal fields added to User table</li>
                <li>Sample users created</li>
                <li>Database is now ready to use</li>
              </ul>
            </div>
            
            <div class="credentials">
              <h3>🔑 Login Credentials</h3>
              <p><strong>You can now log in with these test accounts:</strong></p>
              
              <div class="login-info">
                <strong>Admin Account:</strong><br>
                Email: admin@company.com<br>
                Password: admin123
              </div>
              
              <div class="login-info">
                <strong>Member Account:</strong><br>
                Email: member@company.com<br>
                Password: member123
              </div>
            </div>
            
            <h2>👥 Created Users (${userCount} total):</h2>
            ${users.map(user => `
              <div class="user-card">
                <h3>${user.firstName} ${user.lastName} (${user.role})</h3>
                <p><strong>Email:</strong> ${user.email}</p>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 15px;">
                  <div><strong>Daily Calls:</strong> ${user.dailyCallGoal}</div>
                  <div><strong>Daily Deals:</strong> ${user.dailyDealGoal}</div>
                  <div><strong>Weekly Contacts:</strong> ${user.weeklyContactGoal}</div>
                  <div><strong>Monthly Revenue:</strong> $${user.monthlyRevenueGoal}</div>
                </div>
              </div>
            `).join('')}
            
            <div style="margin-top: 40px; padding: 20px; background: #e3f2fd; border-radius: 8px;">
              <h3>🚀 Next Steps:</h3>
              <ol>
                <li><strong>Go to your app login page</strong></li>
                <li><strong>Log in</strong> with admin@company.com / admin123</li>
                <li><strong>Test the dashboard</strong> - goal fields should now work</li>
                <li><strong>Update passwords</strong> in Settings</li>
                <li><strong>Create real user accounts</strong> via Admin > Manage Users</li>
              </ol>
            </div>
            
            <div style="margin-top: 30px; padding: 15px; background: #f8f9fa; border-radius: 8px; font-size: 0.9rem; color: #666;">
              <strong>Note:</strong> This reset was safe to run because you mentioned the data was just samples. 
              All tables have been recreated with the proper schema including the new goal fields.
            </div>
          </div>
        </body>
        </html>
      `)
    }

    return res.status(200).json({
      success: true,
      message: 'Database reset and recreated successfully',
      data: {
        usersCreated: userCount,
        users: users,
        loginCredentials: {
          admin: { email: 'admin@company.com', password: 'admin123' },
          member: { email: 'member@company.com', password: 'member123' }
        }
      }
    })

  } catch (error) {
    console.error('Database reset error:', error)
    
    const errorMessage = `Database reset failed: ${error.message}`
    
    if (req.method === 'GET') {
      return res.status(500).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Database Reset Error</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .error { color: #721c24; background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 4px; }
          </style>
        </head>
        <body>
          <h1>❌ Database Reset Error</h1>
          <div class="error">
            <strong>Error:</strong> ${errorMessage}
          </div>
          <p>Please check the Vercel function logs for more details.</p>
        </body>
        </html>
      `)
    }
    
    return res.status(500).json({
      success: false,
      message: errorMessage
    })
  }
}