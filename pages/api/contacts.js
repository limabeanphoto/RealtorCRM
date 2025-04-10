// pages/api/contacts.js (updated version)
import { PrismaClient } from '@prisma/client'
import withAuth from '../../utils/withAuth'

const prisma = new PrismaClient()

async function handler(req, res) {
  // Handle different HTTP methods
  if (req.method === 'GET') {
    try {
      // Get query parameters for filtering
      const { status, assignedTo } = req.query
      
      // Build query conditions based on user role
      const where = {}
      
      if (req.user.role === 'member') {
        // Members can only see open contacts or contacts assigned to them
        where.OR = [
          { status: 'Open' },
          { assignedTo: req.user.id }
        ]
      }
      
      // Add additional filters if provided
      if (status) {
        where.status = status
      }
      
      if (assignedTo) {
        // Only admins can filter by assignedTo
        if (req.user.role !== 'admin') {
          return res.status(403).json({ success: false, message: 'Unauthorized' })
        }
        where.assignedTo = assignedTo
      }
      
      // Get contacts with filtering
      const contacts = await prisma.contact.findMany({
        where,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          assignedToUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      })
      
      return res.status(200).json({ success: true, data: contacts })
    } catch (error) {
      console.error('Error fetching contacts:', error)
      return res.status(500).json({ success: false, message: 'Error fetching contacts' })
    }
  } 
  
  else if (req.method === 'POST') {
    try {
      const { name, email, phone, company, notes, status } = req.body
      
      // Validate required fields
      if (!name || !phone) {
        return res.status(400).json({ success: false, message: 'Name and phone are required' })
      }
      
      // Create contact
      const newContact = await prisma.contact.create({
        data: {
          name,
          email: email || null,
          phone,
          company: company || null,
          notes: notes || null,
          status: status || 'Open',
          assignedTo: null // New contacts start unassigned
        }
      })
      
      return res.status(201).json({ success: true, data: newContact })
    } catch (error) {
      console.error('Error creating contact:', error)
      return res.status(500).json({ success: false, message: error.message })
    }
  } 
  
  else {
    // Method not allowed
    return res.status(405).json({ success: false, message: `Method ${req.method} not allowed` })
  }
}

export default withAuth(handler)