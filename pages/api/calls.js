// pages/api/calls.js
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
      const { contactId, duration, notes, outcome, isDeal } = req.body
      
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
      
      // Determine new contact status based on call outcome
      let newStatus = contact.status
      
      // If contact is Open, it becomes Active when called
      if (contact.status === 'Open') {
        newStatus = 'Active'
      } 
      // If outcome is Not Interested or Deal Closed, status becomes Closed
      else if (outcome === 'Not Interested' || outcome === 'Deal Closed') {
        newStatus = 'Closed'
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
        
        // Update contact with the outcome of this call
        prisma.contact.update({
          where: { id: contactId },
          data: {
            lastCallOutcome: outcome,
            lastCallDate: new Date(),
            status: newStatus,
            // If contact was Open, assign it to the current user
            assignedTo: contact.status === 'Open' ? req.user.id : contact.assignedTo
          }
        })
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