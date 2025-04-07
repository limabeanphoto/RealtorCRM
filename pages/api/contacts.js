import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Get all contacts
    try {
      const contacts = await prisma.contact.findMany({
        orderBy: {
          createdAt: 'desc'
        }
      })
      res.status(200).json({ success: true, data: contacts })
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error fetching contacts' })
    }
  } else if (req.method === 'POST') {
    // Create a new contact
    try {
      const { name, email, phone, company, notes } = req.body
      
      if (!name || !phone) {
        return res.status(400).json({ success: false, message: 'Name and phone are required' })
      }
      
      const newContact = await prisma.contact.create({
        data: {
          name,
          email: email || '',
          phone,
          company: company || '',
          notes: notes || ''
        }
      })
      
      res.status(201).json({ success: true, data: newContact })
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error creating contact' })
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' })
  }
}