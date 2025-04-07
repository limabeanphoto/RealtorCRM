import { PrismaClient } from '@prisma/client'

// Initialize Prisma client
const prisma = new PrismaClient()

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: `Method ${req.method} not allowed` })
  }

  try {
    // Get params from query
    const { type, startDate, endDate } = req.query
    
    if (!type || !startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Type, start date, and end date are required' 
      })
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    let data = []

    switch (type) {
      case 'calls':
        data = await getCallsData(start, end)
        break
      case 'deals':
        data = await getDealsData(start, end)
        break
      case 'contacts':
        data = await getContactsData(start, end)
        break
      case 'tasks':
        data = await getTasksData(start, end)
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
      message: `Error fetching ${req.query.type} data` 
    })
  }
}

// Get calls data
async function getCallsData(startDate, endDate) {
  const calls = await prisma.call.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate
      }
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
    },
    orderBy: {
      date: 'desc'
    }
  })

  // Format data for display
  return calls.map(call => ({
    id: call.id,
    date: call.date,
    contactId: call.contactId,
    contactName: call.contact.name,
    contactCompany: call.contact.company,
    duration: call.duration,
    outcome: call.outcome,
    notes: call.notes
  }))
}

// Get deals data
async function getDealsData(startDate, endDate) {
  // For now, deals are calls with 'Deal Closed' or 'Interested' outcome
  const deals = await prisma.call.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate
      },
      outcome: {
        in: ['Deal Closed', 'Interested']
      }
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
    },
    orderBy: {
      date: 'desc'
    }
  })

  // Format data for display
  return deals.map(deal => ({
    id: deal.id,
    date: deal.date,
    contactId: deal.contactId,
    contactName: deal.contact.name,
    contactCompany: deal.contact.company,
    outcome: deal.outcome,
    duration: deal.duration,
    notes: deal.notes,
    // In a real application, you might have a value or amount field for deals
    value: 'N/A' // Placeholder for deal value
  }))
}

// Get contacts data
async function getContactsData(startDate, endDate) {
  const contacts = await prisma.contact.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return contacts
}

// Get tasks data
async function getTasksData(startDate, endDate) {
  const tasks = await prisma.task.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      contact: {
        select: {
          id: true,
          name: true,
          company: true
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
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
    createdAt: task.createdAt,
    completed: task.completed,
    completedAt: task.completedAt,
    contactId: task.contactId,
    contactName: task.contact ? task.contact.name : null,
    contactCompany: task.contact ? task.contact.company : null
  }))
}