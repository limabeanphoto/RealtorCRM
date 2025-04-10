// pages/api/calls.js (updated version)
import { PrismaClient } from '@prisma/client'
import withAuth from '../../utils/withAuth'

const prisma = new PrismaClient()

async function handler(req, res) {
  // Handle different HTTP methods
  if (req.method === 'GET') {
    try {
      // Get query parameters
      const { contactId } = req.query
      
      // Build query conditions
      const where = {}
      
      // Filter by user if not admin
      if (req.user.role !== 'admin') {
        where.userId = req.user.id
      }
      
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
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true
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
      
      // Check if contact exists
      const contact = await prisma.contact.findUnique({
        where: { id: contactId }
      })
      
      if (!contact) {
        return res.status(404).json({ success: false, message: 'Contact not found' })
      }
      
      // Begin transaction to create call and update contact status
      const [newCall, updatedContact] = await prisma.$transaction([
        // Create call
        prisma.call.create({
          data: {
            contactId,
            userId: req.user.id, // Associate call with current user
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
            },
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }),
        
        // If contact is Open, assign it to the user making the call
        ...(contact.status === 'Open' ? [
          prisma.contact.update({
            where: { id: contactId },
            data: {
              status: 'Assigned',
              assignedTo: req.user.id
            }
          })
        ] : [])
      ])
      
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

export default withAuth(handler)