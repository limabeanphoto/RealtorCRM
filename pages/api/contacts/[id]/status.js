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
      
      // Update contact status
      const updatedContact = await prisma.contact.update({
        where: { id },
        data: {
          lastCallOutcome
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