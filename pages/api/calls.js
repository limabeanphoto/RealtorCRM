import { PrismaClient } from '@prisma/client'

// Initialize Prisma client
const prisma = new PrismaClient()

export default async function handler(req, res) {
  // Handle different HTTP methods
  if (req.method === 'GET') {
    try {
      // Get query parameters
      const { contactId } = req.query
      
      // Build query conditions
      const where = {}
      if (contactId) {
        where.contactId = contactId
      }
      
      // Get all calls with optional filtering
      const calls = await prisma.call.findMany({
        where,
        include: {
          contact: {
            select: {
              id: true,
              name: true,
              company: true,
              phone: true
            }
          }
        },
        orderBy: {
          date: 'desc'
        }
      })
      
      return res.status(200).json({ success: true, data: calls })
    } catch (error) {
      console.error('Error fetching calls:', error)
      return res.status(500).json({ success: false, message: 'Error fetching calls' })
    }
  } 
  
  else if (req.method === 'POST') {
    try {
      const { contactId, duration, notes, outcome, isDeal, dealValue } = req.body
      
      // Validate required fields
      if (!contactId || !outcome) {
        return res.status(400).json({ 
          success: false, 
          message: 'Contact ID and outcome are required' 
        })
      }
      
      // Create call
      const newCall = await prisma.call.create({
        data: {
          contactId,
          duration: duration || 0,
          notes: notes || null,
          outcome,
          isDeal: isDeal || false,
          dealValue: dealValue ? parseFloat(dealValue) : null,
          date: new Date()
        },
        include: {
          contact: {
            select: {
              id: true,
              name: true,
              company: true,
              phone: true
            }
          }
        }
      })
      
      return res.status(201).json({ success: true, data: newCall })
    } catch (error) {
      console.error('Error creating call:', error)
      return res.status(500).json({ success: false, message: error.message })
    }
  } 
  
  else {
    // Method not allowed
    return res.status(405).json({ success: false, message: `Method ${req.method} not allowed` })
  }
}