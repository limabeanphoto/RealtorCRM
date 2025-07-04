// pages/api/users/[id]/assignedNumber.js
import { PrismaClient } from '@prisma/client'
import { withAdminAuth } from '../../../../utils/withAuth'

const prisma = new PrismaClient()

async function handler(req, res) {
  // Only allow PUT requests
  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, message: `Method ${req.method} not allowed` })
  }
  
  // Admin check is now handled by withAdminAuth
  
  const { id } = req.query
  const { assignedCallNumber } = req.body
  
  // Check if the user exists
  const userExists = await prisma.user.findUnique({
    where: { id }
  })
  
  if (!userExists) {
    return res.status(404).json({ success: false, message: 'User not found' })
  }
  
  try {
    // Update assigned call number
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        assignedCallNumber
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        cellPhone: true,
        assignedCallNumber: true,
        role: true
      }
    })
    
    return res.status(200).json({ success: true, data: updatedUser })
  } catch (error) {
    console.error('Error updating assigned call number:', error)
    return res.status(500).json({ success: false, message: 'Error updating assigned call number' })
  }
}

export default withAdminAuth(handler)