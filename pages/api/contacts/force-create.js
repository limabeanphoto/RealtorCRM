// pages/api/contacts/force-create.js - Updated to handle new fields
import { PrismaClient } from '@prisma/client'
import withAuth from '../../../utils/withAuth'

const prisma = new PrismaClient()

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: `Method ${req.method} not allowed` })
  }
  
  try {
    const { 
      name, 
      email, 
      phone, 
      company, 
      notes, 
      status, 
      skipDuplicateCheck,
      profileLink, // New field
      volume,      // New field
      region       // New field
    } = req.body
    
    // Validate required fields
    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and phone are required' })
    }
    
    // Force create even with potential duplicates
    const newContact = await prisma.contact.create({
      data: {
        name,
        email: email || null,
        phone,
        company: company || null,
        notes: notes || null,
        status: status || 'Open',
        assignedTo: null, // New contacts start unassigned
        profileLink: profileLink || null, // New field
        volume: volume || null,        // New field
        region: region || null         // New field
      }
    })
    
    return res.status(201).json({ success: true, data: newContact })
  } catch (error) {
    console.error('Error creating contact:', error)
    return res.status(500).json({ success: false, message: error.message })
  }
}

export default withAuth(handler)