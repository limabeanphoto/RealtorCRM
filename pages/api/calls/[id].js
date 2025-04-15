import { PrismaClient } from '@prisma/client'
import withAuth from '../../../utils/withAuth'

const prisma = new PrismaClient()

async function handler(req, res) {
  const { id } = req.query
  
  if (!id) {
    return res.status(400).json({ success: false, message: 'Call ID is required' })
  }
  
  // GET - Get call details
  if (req.method === 'GET') {
    try {
      const call = await prisma.call.findUnique({
        where: { id },
        include: {
          contact: {
            select: {
              id: true,
              name: true,
              company: true,
              phone: true
            }
          }
        }
      })
      
      if (!call) {
        return res.status(404).json({ success: false, message: 'Call not found' })
      }
      
      return res.status(200).json({ success: true, data: call })
    } catch (error) {
      console.error('Error fetching call:', error)
      return res.status(500).json({ success: false, message: 'Error fetching call' })
    }
  }
  
  // PUT - Update call
  else if (req.method === 'PUT') {
    try {
      const { duration, notes, outcome, isDeal, dealValue } = req.body
      
      // Check if call exists
      const existingCall = await prisma.call.findUnique({
        where: { id }
      })
      
      if (!existingCall) {
        return res.status(404).json({ success: false, message: 'Call not found' })
      }
      
      // Update call
      const updatedCall = await prisma.call.update({
        where: { id },
        data: {
          duration: duration !== undefined ? duration : existingCall.duration,
          notes: notes !== undefined ? notes : existingCall.notes,
          outcome: outcome || existingCall.outcome,
          isDeal: isDeal !== undefined ? isDeal : existingCall.isDeal,
          dealValue: dealValue !== undefined ? dealValue : existingCall.dealValue
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
        }
      })
      
      return res.status(200).json({ success: true, data: updatedCall })
    } catch (error) {
      console.error('Error updating call:', error)
      return res.status(500).json({ success: false, message: 'Error updating call' })
    }
  }
  
  // DELETE - Delete call
  else if (req.method === 'DELETE') {
    try {
      // Check if call exists
      const existingCall = await prisma.call.findUnique({
        where: { id }
      })
      
      if (!existingCall) {
        return res.status(404).json({ success: false, message: 'Call not found' })
      }
      
      // Delete call
      await prisma.call.delete({
        where: { id }
      })
      
      return res.status(200).json({ success: true, message: 'Call deleted successfully' })
    } catch (error) {
      console.error('Error deleting call:', error)
      return res.status(500).json({ success: false, message: 'Error deleting call' })
    }
  }
  
  else {
    // Method not allowed
    return res.status(405).json({ success: false, message: `Method ${req.method} not allowed` })
  }
}

export default withAuth(handler)