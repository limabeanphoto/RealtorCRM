// pages/api/contacts/assign.js
import { PrismaClient } from '@prisma/client'
import { withAdminAuth } from '../../../utils/withAuth'

const prisma = new PrismaClient()

async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: `Method ${req.method} not allowed` })
  }
  
  try {
    const { contactId, userId, newStatus } = req.body
    
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
    
    // Admin check is now handled by withAdminAuth
    
    const updateData = {}
    
    // Handle unassignment - set contact back to Open status
    if (userId === null) {
      updateData.assignedTo = null
      updateData.status = newStatus || 'Open' // Default to Open if newStatus not provided
    } 
    // Handle assignment to a specific user
    else {
      // Check if the user exists
      const userExists = await prisma.user.findUnique({
        where: { id: userId }
      })
      
      if (!userExists) {
        return res.status(404).json({ success: false, message: 'User not found' })
      }
      
      updateData.assignedTo = userId
      
      // If a new status is specified, use it, otherwise set status to Active
      updateData.status = newStatus || 'Active'
    }
    
    // Update contact assignment
    const updatedContact = await prisma.contact.update({
      where: { id: contactId },
      data: updateData,
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
    console.error('Error assigning contact:', error)
    return res.status(500).json({ success: false, message: 'Error assigning contact: ' + error.message })
  }
}

export default withAdminAuth(handler)