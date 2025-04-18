// pages/api/contacts/[id]/status.js
import { PrismaClient } from '@prisma/client'
import withAuth from '../../../../utils/withAuth'

const prisma = new PrismaClient()

async function handler(req, res) {
  const { id } = req.query
  
  if (!id) {
    return res.status(400).json({ success: false, message: 'Contact ID is required' })
  }
  
  // PUT - Update contact status
  if (req.method === 'PUT') {
    try {
      const { lastCallOutcome } = req.body
      
      // Validate required fields
      if (!lastCallOutcome) {
        return res.status(400).json({ 
          success: false, 
          message: 'Last call outcome is required' 
        })
      }
      
      // Check if contact exists
      const existingContact = await prisma.contact.findUnique({
        where: { id }
      })
      
      if (!existingContact) {
        return res.status(404).json({ success: false, message: 'Contact not found' })
      }
      
      // For non-admin users, verify they are assigned to this contact
      if (req.user.role !== 'admin' && existingContact.assignedTo !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'You do not have permission to update this contact'
        })
      }
      
      // Update data object with outcome status
      const updateData = {
        lastCallOutcome
      }

      // Set assignment status based on call outcome
      if (lastCallOutcome === 'Not Interested' || lastCallOutcome === 'Deal Closed') {
        // Change assignment status to Closed
        updateData.status = 'Closed'
        // Keep the existing assignedTo (maintain ownership)
      } else if (lastCallOutcome === 'Follow Up' || lastCallOutcome === 'No Answer') {
        // If contact is in Closed status, bring it back to Active
        if (existingContact.status === 'Closed') {
          updateData.status = 'Active'
        }
        // If it's Open, and a user is updating it, assign it to them
        else if (existingContact.status === 'Open') {
          updateData.status = 'Active'
          updateData.assignedTo = req.user.id
        }
        // If it's already Active, maintain that status and assignment
      }
      
      // Update contact status
      const updatedContact = await prisma.contact.update({
        where: { id },
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
      console.error('Error updating contact status:', error)
      return res.status(500).json({ success: false, message: 'Error updating contact status' })
    }
  }
  
  else {
    // Method not allowed
    return res.status(405).json({ success: false, message: `Method ${req.method} not allowed` })
  }
}

export default withAuth(handler)