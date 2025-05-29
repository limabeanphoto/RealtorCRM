// pages/api/admin/migrate-goals.js
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  // Allow both GET and POST requests for easy browser access
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: `Method ${req.method} not allowed` 
    })
  }

  try {
    console.log('Starting goal fields migration...')

    // Check if migration has already been run
    const usersWithGoals = await prisma.user.count({
      where: {
        AND: [
          { dailyCallGoal: { not: null } },
          { dailyDealGoal: { not: null } },
          { weeklyContactGoal: { not: null } },
          { monthlyRevenueGoal: { not: null } }
        ]
      }
    })

    const totalUsers = await prisma.user.count()

    if (usersWithGoals === totalUsers && totalUsers > 0) {
      // Migration already completed
      const users = await prisma.user.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          dailyCallGoal: true,
          dailyDealGoal: true,
          weeklyContactGoal: true,
          monthlyRevenueGoal: true
        }
      })

      return res.status(200).json({
        success: true,
        message: 'Migration already completed - all users have goal fields set',
        alreadyMigrated: true,
        data: {
          totalUsers: totalUsers,
          usersWithGoals: usersWithGoals,
          users: users
        }
      })
    }

    // Run the migration - update users with missing goal fields
    const updateResult = await prisma.user.updateMany({
      where: {
        OR: [
          { dailyCallGoal: null },
          { dailyDealGoal: null },
          { weeklyContactGoal: null },
          { monthlyRevenueGoal: null }
        ]
      },
      data: {
        dailyCallGoal: 30,
        dailyDealGoal: 5,
        weeklyContactGoal: 150,
        monthlyRevenueGoal: 10000
      }
    })

    console.log(`Updated ${updateResult.count} users with default goal values`)

    // Get all users to verify the update
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        dailyCallGoal: true,
        dailyDealGoal: true,
        weeklyContactGoal: true,
        monthlyRevenueGoal: true
      }
    })

    // Return HTML response for browser viewing
    if (req.method === 'GET') {
      return res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Goal Fields Migration</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              max-width: 800px; 
              margin: 50px auto; 
              padding: 20px; 
              background-color: #f5f5f5;
            }
            .container { 
              background: white; 
              padding: 30px; 
              border-radius: 8px; 
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .success { 
              color: #155724; 
              background-color: #d4edda; 
              border: 1px solid #c3e6cb; 
              padding: 15px; 
              border-radius: 4px; 
              margin-bottom: 20px;
            }
            .user-card {
              background-color: #f8f9fa;
              padding: 15px;
              margin: 10px 0;
              border-radius: 4px;
              border-left: 4px solid #8F9F3B;
            }
            .goals {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 10px;
              margin-top: 10px;
            }
            .goal {
              background: white;
              padding: 8px;
              border-radius: 4px;
              font-size: 0.9rem;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🎯 Goal Fields Migration Complete!</h1>
            <div class="success">
              <strong>✅ Success!</strong> Migration completed successfully.<br>
              <strong>Users Updated:</strong> ${updateResult.count}<br>
              <strong>Total Users:</strong> ${users.length}
            </div>
            
            <h2>User Goals Summary:</h2>
            ${users.map(user => `
              <div class="user-card">
                <h3>${user.firstName} ${user.lastName}</h3>
                <p><strong>Email:</strong> ${user.email}</p>
                <div class="goals">
                  <div class="goal"><strong>Daily Calls:</strong> ${user.dailyCallGoal}</div>
                  <div class="goal"><strong>Daily Deals:</strong> ${user.dailyDealGoal}</div>
                  <div class="goal"><strong>Weekly Contacts:</strong> ${user.weeklyContactGoal}</div>
                  <div class="goal"><strong>Monthly Revenue:</strong> ${user.monthlyRevenueGoal}</div>
                </div>
              </div>
            `).join('')}
            
            <p style="margin-top: 30px; color: #666;">
              <strong>Next Steps:</strong><br>
              1. Users can now customize their goals in Settings<br>
              2. Dashboard will display personalized goals<br>
              3. This migration is safe to run multiple times
            </p>
          </div>
        </body>
        </html>
      `)
    }

    // JSON response for API calls
    return res.status(200).json({
      success: true,
      message: 'Goal fields migration completed successfully',
      data: {
        usersUpdated: updateResult.count,
        totalUsers: users.length,
        users: users
      }
    })

  } catch (error) {
    console.error('Migration error:', error)
    
    const errorMessage = `Migration failed: ${error.message}`
    
    // Return HTML error for browser viewing
    if (req.method === 'GET') {
      return res.status(500).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Migration Error</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              max-width: 600px; 
              margin: 50px auto; 
              padding: 20px; 
            }
            .error { 
              color: #721c24; 
              background-color: #f8d7da; 
              border: 1px solid #f5c6cb; 
              padding: 15px; 
              border-radius: 4px; 
            }
          </style>
        </head>
        <body>
          <h1>❌ Migration Error</h1>
          <div class="error">
            <strong>Error:</strong> ${errorMessage}
          </div>
          <p>Please check the server logs for more details.</p>
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