import { PrismaClient } from '@prisma/client'

// Initialize Prisma client
const prisma = new PrismaClient()

export default async function handler(req, res) {
  // Handle different HTTP methods
  if (req.method === 'GET') {
    try {
      // Get all contacts
      const contacts = await prisma.contact.findMany({
        orderBy: {
          createdAt: 'desc'
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
      const { name, email, phone, company, notes } = req.body
      
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
          notes: notes || null
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