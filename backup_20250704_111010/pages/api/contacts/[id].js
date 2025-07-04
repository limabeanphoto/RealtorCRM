// pages/api/contacts/[id].js - Updated to handle new fields
import { PrismaClient } from '@prisma/client'
import withAuth from '../../../utils/withAuth'

const prisma = new PrismaClient()

async function handler(req, res) {
  const { id } = req.query
  
  if (!id) {
    return res.status(400).json({ success: false, message: 'Contact ID is required' })
  }
  
  // GET - Get contact details
  if (req.method === 'GET') {
    try {
      const contact = await prisma.contact.findUnique({
        where: { id },
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
      
      if (!contact) {
        return res.status(404).json({ success: false, message: 'Contact not found' })
      }
      
      // Check if user has permission to view this contact
      if (req.user.role !== 'admin' && 
          contact.status !== 'Open' && 
          contact.assignedTo !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'You do not have permission to view this contact' 
        })
      }
      
      return res.status(200).json({ success: true, data: contact })
    } catch (error) {
      console.error('Error fetching contact:', error)
      return res.status(500).json({ success: false, message: 'Error fetching contact' })
    }
  }
  
  // PUT - Update contact - Updated to handle new fields
  else if (req.method === 'PUT') {
    try {
      const { 
        name, 
        email, 
        phone, 
        company, 
        notes, 
        profileLink, // New field
        volume,      // New field
        region       // New field
      } = req.body
      
      // Validate required fields
      if (!name || !phone) {
        return res.status(400).json({ success: false, message: 'Name and phone are required' })
      }
      
      // Check if contact exists
      const existingContact = await prisma.contact.findUnique({
        where: { id }
      })
      
      if (!existingContact) {
        return res.status(404).json({ success: false, message: 'Contact not found' })
      }
      
      // Check if user has permission to update this contact
      if (req.user.role !== 'admin' && 
          existingContact.status !== 'Open' && 
          existingContact.assignedTo !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'You do not have permission to update this contact' 
        })
      }
      
      // Update contact with new fields
      const updatedContact = await prisma.contact.update({
        where: { id },
        data: {
          name,
          email: email || null,
          phone,
          company: company || null,
          notes: notes || null,
          profileLink: profileLink || null, // New field
          volume: volume || null,           // New field
          region: region || null            // New field
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
      
      return res.status(200).json({ success: true, data: updatedContact })
    } catch (error) {
      console.error('Error updating contact:', error)
      return res.status(500).json({ success: false, message: 'Error updating contact' })
    }
  }
  
  // DELETE - Delete contact
  else if (req.method === 'DELETE') {
    try {
      // Check if contact exists
      const existingContact = await prisma.contact.findUnique({
        where: { id }
      })
      
      if (!existingContact) {
        return res.status(404).json({ success: false, message: 'Contact not found' })
      }
      
      // Only admins can delete contacts
      if (req.user.role !== 'admin') {
        return res.status(403).json({ 
          success: false, 
          message: 'Only administrators can delete contacts' 
        })
      }
      
      // Delete contact
      await prisma.contact.delete({
        where: { id }
      })
      
      return res.status(200).json({ success: true, message: 'Contact deleted successfully' })
    } catch (error) {
      console.error('Error deleting contact:', error)
      return res.status(500).json({ success: false, message: 'Error deleting contact' })
    }
  }
  
  else {
    // Method not allowed
    return res.status(405).json({ success: false, message: `Method ${req.method} not allowed` })
  }
}

export default withAuth(handler)