// pages/api/contacts.js
import { PrismaClient } from '@prisma/client'
import withAuth from '../../utils/withAuth'

const prisma = new PrismaClient()

async function handler(req, res) {
  // Handle different HTTP methods
  if (req.method === 'GET') {
    try {
      // Get query parameters for filtering
      const { status, assignedTo, lastCallOutcome } = req.query
      
      // Build query conditions based on user role
      const where = {}
      
      if (req.user.role === 'member') {
        // Members can only see:
        // 1. Open contacts
        // 2. Contacts assigned to them (both Active and Closed)
        where.OR = [
          { status: 'Open' },
          { assignedTo: req.user.id }
        ]
      }
      
      // Add additional filters if provided
      if (status) {
        if (where.OR) {
          // For regular users, we need to maintain their visibility restrictions
          // while applying the status filter
          if (req.user.role === 'member') {
            // If filtering by Open, keep only the Open condition
            if (status === 'Open') {
              where.OR = where.OR.filter(condition => condition.status === 'Open')
            } 
            // If filtering by Active or Closed, make sure it's only for their assigned contacts
            else {
              where.OR = where.OR.filter(condition => condition.assignedTo === req.user.id)
              where.status = status
            }
          } else {
            // For admins, just apply the status filter directly
            delete where.OR
            where.status = status
          }
        } else {
          // If no OR conditions, just set the status directly
          where.status = status
        }
      }
      
      // Filter by lastCallOutcome if provided
      if (lastCallOutcome) {
        where.lastCallOutcome = lastCallOutcome
      }
      
      if (assignedTo) {
        // Only admins can filter by assignedTo
        if (req.user.role !== 'admin' && assignedTo !== req.user.id) {
          return res.status(403).json({ success: false, message: 'Unauthorized' })
        }
        
        if (where.OR) {
          // If filtering by assignedTo, replace OR conditions 
          delete where.OR
          where.assignedTo = assignedTo
        } else {
          // Otherwise just set assignedTo directly
          where.assignedTo = assignedTo
        }
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
      return res.status(500).json({ success: false, message: 'Error fetching contacts: ' + error.message })
    }
  } 
  
  else if (req.method === 'POST') {
    try {
      const { name, email, phone, company, notes, status } = req.body
      
      // Validate required fields
      if (!name || !phone) {
        return res.status(400).json({ success: false, message: 'Name and phone are required' })
      }
      
      // Check for duplicate contacts based on phone number or email
      const duplicateChecks = []
      
      // Always check phone number
      duplicateChecks.push({ phone })
      
      // Check email if provided
      if (email) {
        duplicateChecks.push({ email })
      }
      
      // Look for potential duplicates
      const existingContacts = await prisma.contact.findMany({
        where: {
          OR: duplicateChecks
        }
      })
      
      // If duplicates are found, return them to the frontend
      if (existingContacts.length > 0) {
        return res.status(409).json({ 
          success: false, 
          message: 'Potential duplicate contacts found',
          duplicates: existingContacts
        })
      }
      
      // If no duplicates, create the contact
      const newContact = await prisma.contact.create({
        data: {
          name,
          email: email || null,
          phone,
          company: company || null,
          notes: notes || null,
          status: status || 'Open', // Default to Open
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