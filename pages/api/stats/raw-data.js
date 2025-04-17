import { PrismaClient } from '@prisma/client'
import withAuth from '../../../utils/withAuth'

// Initialize Prisma client
const prisma = new PrismaClient()

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: `Method ${req.method} not allowed` })
  }

  try {
    // Get params from query
    const { type, startDate, endDate, userId } = req.query
    
    if (!type || !startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Type, start date, and end date are required' 
      })
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    // Make sure dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid date format. Please use ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)' 
      })
    }

    let data = []

    switch (type) {
      case 'calls':
        data = await getCallsData(start, end, userId)
        break
      case 'deals':
        // Updated to use contacts with Deal Closed outcome
        data = await getDealsData(start, end, userId)
        break
      case 'contacts':
        data = await getContactsData(start, end)
        break
      case 'tasks':
        data = await getTasksData(start, end, userId)
        break
      default:
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid data type. Must be one of: calls, deals, contacts, tasks' 
        })
    }

    return res.status(200).json({
      success: true,
      data
    })
  } catch (error) {
    console.error(`Error fetching ${req.query.type} data:`, error)
    return res.status(500).json({ 
      success: false, 
      message: `Error fetching ${req.query.type} data: ${error.message}` 
    })
  }
}

// Get calls data
async function getCallsData(startDate, endDate, userId = null) {
  try {
    // Build where clause
    const whereClause = {
      date: {
        gte: startDate,
        lte: endDate
      }
    }
    
    // Add userId filter if provided
    if (userId) {
      whereClause.userId = userId
    }
    
    const calls = await prisma.call.findMany({
      where: whereClause,
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

    // Format data for display - removed dealValue from the result
    return calls.map(call => ({
      id: call.id,
      date: call.date,
      contactId: call.contactId,
      contactName: call.contact?.name || 'Unknown',
      contactCompany: call.contact?.company || '',
      duration: call.duration,
      outcome: call.outcome,
      notes: call.notes || '',
      isDeal: call.isDeal || false,
      user: call.user ? `${call.user.firstName} ${call.user.lastName}` : 'Unknown',
      userId: call.userId
    }))
  } catch (error) {
    console.error('Error fetching calls data:', error)
    return []
  }
}

// Get deals data - UPDATED to use contacts with "Deal Closed" outcome instead of calls
async function getDealsData(startDate, endDate, userId = null) {
  try {
    // Changed to search for contacts with "Deal Closed" outcome with lastCallDate in range
    const whereClause = {
      lastCallOutcome: 'Deal Closed',
      lastCallDate: {
        gte: startDate,
        lte: endDate
      }
    }
    
    // For contacts, user ID corresponds to assignedTo
    if (userId) {
      whereClause.assignedTo = userId
    }
    
    const dealsFromContacts = await prisma.contact.findMany({
      where: whereClause,
      include: {
        assignedToUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        lastCallDate: 'desc'
      }
    })

    // Format data for display
    return dealsFromContacts.map(contact => ({
      id: contact.id,
      date: contact.lastCallDate,
      contactId: contact.id,
      contactName: contact.name || 'Unknown',
      contactCompany: contact.company || '',
      outcome: contact.lastCallOutcome,
      notes: contact.notes || '',
      user: contact.assignedToUser ? 
        `${contact.assignedToUser.firstName} ${contact.assignedToUser.lastName}` : 
        'Unassigned',
      userId: contact.assignedTo
    }))
  } catch (error) {
    console.error('Error fetching deals data:', error)
    return []
  }
}

// Get contacts data
async function getContactsData(startDate, endDate) {
  try {
    const contacts = await prisma.contact.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        assignedToUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return contacts.map(contact => ({
      id: contact.id,
      name: contact.name,
      company: contact.company || '',
      phone: contact.phone,
      email: contact.email || '',
      notes: contact.notes || '',
      createdAt: contact.createdAt,
      lastCallDate: contact.lastCallDate || null,
      lastCallOutcome: contact.lastCallOutcome || '',
      status: contact.status || 'Open',
      assignedTo: contact.assignedTo || null,
      assignedToName: contact.assignedToUser 
        ? `${contact.assignedToUser.firstName} ${contact.assignedToUser.lastName}` 
        : null
    }))
  } catch (error) {
    console.error('Error fetching contacts data:', error)
    return []
  }
}

// Get tasks data
async function getTasksData(startDate, endDate, userId = null) {
  try {
    // Build where clause
    const whereClause = {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    }
    
    // Add userId filter if provided
    if (userId) {
      whereClause.userId = userId
    }
    
    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            company: true
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
        createdAt: 'desc'
      }
    })

    // Format data for display
    return tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description || '',
      status: task.status || 'Open',
      priority: task.priority || 'Medium',
      dueDate: task.dueDate,
      createdAt: task.createdAt,
      completed: task.completed || false,
      completedAt: task.completedAt || null,
      contactId: task.contactId || null,
      contactName: task.contact ? task.contact.name : null,
      contactCompany: task.contact ? task.contact.company : null,
      user: task.user ? `${task.user.firstName} ${task.user.lastName}` : 'Unknown',
      userId: task.userId
    }))
  } catch (error) {
    console.error('Error fetching tasks data:', error)
    return []
  }
}

export default withAuth(handler)