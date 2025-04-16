// pages/api/migrations/update-contact-status.js
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  // Only allow POST requests for migrations
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  try {
    // Step 1: Get all contacts
    const contacts = await prisma.contact.findMany()
    
    // Step 2: For each contact, find their most recent call
    let updatedCount = 0
    
    for (const contact of contacts) {
      const mostRecentCall = await prisma.call.findFirst({
        where: {
          contactId: contact.id
        },
        orderBy: {
          date: 'desc'
        }
      })
      
      // If the contact has calls, update their last call outcome and date
      if (mostRecentCall) {
        await prisma.contact.update({
          where: { id: contact.id },
          data: {
            lastCallOutcome: mostRecentCall.outcome,
            lastCallDate: mostRecentCall.date
          }
        })
        
        updatedCount++
      }
    }
    
    return res.status(200).json({ 
      success: true, 
      message: `Migration completed successfully. Updated ${updatedCount} contacts.`
    })
    
    return res.status(200).json({ 
      success: true, 
      message: `Migration completed successfully. Updated ${updatedCount} contacts.` 
    })
  } catch (error) {
    console.error('Migration error:', error)
    return res.status(500).json({ 
      success: false, 
      message: `Migration failed: ${error.message}` 
    })
  }
}