// pages/api/search.js - Updated to search through new fields
import { PrismaClient } from '@prisma/client'
import withAuth from '../../utils/withAuth'

const prisma = new PrismaClient()

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: `Method ${req.method} not allowed` })
  }

  try {
    const { query } = req.query
    
    if (!query || query.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Search query is required' 
      })
    }

    // Search contacts - updated to include new fields
    const contacts = await prisma.contact.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { company: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
          { notes: { contains: query, mode: 'insensitive' } },
          { profileLink: { contains: query, mode: 'insensitive' } }, // New field
          { region: { contains: query, mode: 'insensitive' } }       // New field
          // Note: volume typically won't be searched as it's an enum-like value
        ]
      },
      take: 5, // Limit results
      orderBy: { createdAt: 'desc' }
    })

    // Search calls
    const calls = await prisma.call.findMany({
      where: {
        OR: [
          { notes: { contains: query, mode: 'insensitive' } },
          { outcome: { contains: query, mode: 'insensitive' } }
        ]
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
      take: 5,
      orderBy: { date: 'desc' }
    })

    // Search tasks
    const tasks = await prisma.task.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
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
      take: 5,
      orderBy: { createdAt: 'desc' }
    })

    return res.status(200).json({
      success: true,
      data: {
        contacts,
        calls,
        tasks,
        total: contacts.length + calls.length + tasks.length
      }
    })
  } catch (error) {
    console.error('Search error:', error)
    return res.status(500).json({ success: false, message: 'Error performing search' })
  }
}

export default withAuth(handler)