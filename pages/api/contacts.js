// pages/api/contacts.js
import { PrismaClient } from '@prisma/client'
import withAuth from '../../utils/withAuth'

const prisma = new PrismaClient()

async function handler(req, res) {
  // Handle different HTTP methods
  if (req.method === 'GET') {
    try {
      // Get query parameters for filtering and pagination
      const { 
        status, 
        assignedTo, 
        lastCallOutcome, 
        page = 1, 
        limit = 50,
        search = ''
      } = req.query
      
      // Validate pagination parameters
      const pageNum = Math.max(1, parseInt(page) || 1)
      const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50)) // Max 100 items per page
      const offset = (pageNum - 1) * limitNum
      
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

      // Add search functionality
      if (search) {
        const searchConditions = {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } },
            { company: { contains: search, mode: 'insensitive' } },
            { region: { contains: search, mode: 'insensitive' } }
          ]
        }
        
        // Combine with existing where conditions
        if (where.OR) {
          where.AND = [
            { OR: where.OR },
            searchConditions
          ]
          delete where.OR
        } else {
          Object.assign(where, searchConditions)
        }
      }

      // Get total count for pagination
      const totalCount = await prisma.contact.count({ where })
      
      // Get contacts with filtering, pagination and include tasks
      const contacts = await prisma.contact.findMany({
        where,
        include: {
          assignedToUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          tasks: {
            orderBy: {
              createdAt: 'desc'
            },
            include: {
              call: {
                select: {
                  id: true,
                  date: true,
                  outcome: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: offset,
        take: limitNum
      })

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalCount / limitNum)
      const hasNextPage = pageNum < totalPages
      const hasPreviousPage = pageNum > 1
      
      return res.status(200).json({ 
        success: true, 
        data: contacts,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalCount,
          hasNextPage,
          hasPreviousPage,
          pageSize: limitNum
        }
      })
    } catch (error) {
      console.error('Error fetching contacts:', error)
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
      return res.status(500).json({ 
        success: false, 
        message: 'Error fetching contacts: ' + error.message,
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
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
        },
        include: {
          tasks: true
        }
      })
      
      return res.status(201).json({ success: true, data: newContact })
    } catch (error) {
      console.error('Error creating contact:', error)
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
      return res.status(500).json({ 
        success: false, 
        message: error.message,
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    }
  } 
  
  else {
    // Method not allowed
    return res.status(405).json({ success: false, message: `Method ${req.method} not allowed` })
  }
}

// Use simple auth wrapper
export default withAuth(handler)