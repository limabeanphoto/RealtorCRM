// pages/api/contacts/assign.js
import { PrismaClient } from '@prisma/client'
import withAuth from '../../../utils/withAuth'

const prisma = new PrismaClient()

async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: `Method ${req.method} not allowed` })
  }
  
  try {
    const { contactId, userId } = req.body
    
    // Validate required fields
    if (!contactId) {
      return res.status(400).json({ success: false, message: 'Contact ID is required' })
    }
    
    // Check if contact exists
    const contact = await prisma.contact.findUnique({
      where: { id: contactId }
    })
    
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' })
    }
    
    // If userId is null, we're unassigning the contact
    if (userId === null) {
      // Only admins can unassign contacts
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Unauthorized. Admin access required to unassign contacts.' })
      }
      
      // Unassign contact and set status to Open
      const updatedContact = await prisma.contact.update({
        where: { id: contactId },
        data: {
          assignedTo: null,
          status: 'Open'
        }
      })
      
      return res.status(200).json({ success: true, data: updatedContact })
    }
    
    // If contact is already assigned, only admins can reassign
    if (contact.assignedTo && contact.assignedTo !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized. Only admins can reassign contacts.' })
    }
    
    // Check if the user exists
    if (userId) {
      const userExists = await prisma.user.findUnique({
        where: { id: userId }
      })
      
      if (!userExists) {
        return res.status(404).json({ success: false, message: 'User not found' })
      }
    }
    
    // Update contact assignment
    const updatedContact = await prisma.contact.update({
      where: { id: contactId },
      data: {
        assignedTo: userId,
        status: 'Assigned'
      }
    })
    
    return res.status(200).json({ success: true, data: updatedContact })
  } catch (error) {
    console.error('Error assigning contact:', error)
    return res.status(500).json({ success: false, message: 'Error assigning contact: ' + error.message })
  }
}

export default withAuth(handler)