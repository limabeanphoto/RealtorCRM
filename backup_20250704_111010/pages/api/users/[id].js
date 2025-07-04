// pages/api/users/[id].js
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import withAuth from '../../../utils/withAuth'

const prisma = new PrismaClient()

async function handler(req, res) {
  const { id } = req.query
  
  // Check if the user exists
  const userExists = await prisma.user.findUnique({
    where: { id }
  })
  
  if (!userExists) {
    return res.status(404).json({ success: false, message: 'User not found' })
  }
  
  // GET - Get user details
  if (req.method === 'GET') {
    // Users can view their own data, admins can view anyone's data
    if (req.user.id !== id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' })
    }
    
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          cellPhone: true,
          assignedCallNumber: true,
          role: true,
          createdAt: true,
          lastLoginAt: true,
          dailyCallGoal: true,
          dailyDealGoal: true,
          dailyContactGoal: true,
          openPhoneApiKey: true
        }
      })
      
      return res.status(200).json({ success: true, data: user })
    } catch (error) {
      console.error('Error fetching user:', error)
      return res.status(500).json({ success: false, message: 'Error fetching user' })
    }
  }
  
  // PUT - Update user
  else if (req.method === 'PUT') {
    // Users can update their own data, admins can update anyone's data
    const canUpdateRole = req.user.role === 'admin'
    const canUpdateAssignedNumber = req.user.role === 'admin'
    
    if (req.user.id !== id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' })
    }
    
    try {
      const { 
        email, 
        password, 
        currentPassword,
        newPassword,
        firstName, 
        lastName, 
        cellPhone, 
        assignedCallNumber, 
        role,
        dailyCallGoal,
        dailyDealGoal,
        dailyContactGoal,
        openPhoneApiKey
      } = req.body
      
      // Prepare data object for update
      const updateData = {}
      
      if (email) updateData.email = email
      if (firstName) updateData.firstName = firstName
      if (lastName) updateData.lastName = lastName
      if (cellPhone !== undefined) updateData.cellPhone = cellPhone
      
      // Handle goal fields
      if (dailyCallGoal !== undefined) updateData.dailyCallGoal = dailyCallGoal
      if (dailyDealGoal !== undefined) updateData.dailyDealGoal = dailyDealGoal
      if (dailyContactGoal !== undefined) updateData.dailyContactGoal = dailyContactGoal
      
      // Handle OpenPhone API key
      if (openPhoneApiKey !== undefined) updateData.openPhoneApiKey = openPhoneApiKey
      
      // Only admins can update these fields
      if (canUpdateAssignedNumber && assignedCallNumber !== undefined) {
        updateData.assignedCallNumber = assignedCallNumber
      }
      
      if (canUpdateRole && role) {
        updateData.role = role
      }
      
      // Handle password changes - support both old and new formats
      if (newPassword && currentPassword) {
        // Verify current password
        const user = await prisma.user.findUnique({
          where: { id },
          select: { passwordHash: true }
        })
        
        if (!user) {
          return res.status(404).json({ success: false, message: 'User not found' })
        }
        
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash)
        if (!isCurrentPasswordValid) {
          return res.status(400).json({ success: false, message: 'Current password is incorrect' })
        }
        
        const salt = await bcrypt.genSalt(10)
        updateData.passwordHash = await bcrypt.hash(newPassword, salt)
      } else if (password) {
        // Legacy password update (for admin use)
        const salt = await bcrypt.genSalt(10)
        updateData.passwordHash = await bcrypt.hash(password, salt)
      }
      
      // Update user
      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          cellPhone: true,
          assignedCallNumber: true,
          role: true,
          createdAt: true,
          lastLoginAt: true,
          dailyCallGoal: true,
          dailyDealGoal: true,
          dailyContactGoal: true,
          openPhoneApiKey: true
        }
      })
      
      return res.status(200).json({ success: true, data: updatedUser })
    } catch (error) {
      console.error('Error updating user:', error)
      return res.status(500).json({ success: false, message: 'Error updating user' })
    }
  }
  
  // DELETE - Remove user (admin only)
  else if (req.method === 'DELETE') {
    // Only admins can delete users
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized. Admin access required.' })
    }
    
    try {
      // Delete user
      await prisma.user.delete({
        where: { id }
      })
      
      return res.status(200).json({ success: true, message: 'User deleted successfully' })
    } catch (error) {
      console.error('Error deleting user:', error)
      return res.status(500).json({ success: false, message: 'Error deleting user' })
    }
  }
  
  else {
    return res.status(405).json({ success: false, message: `Method ${req.method} not allowed` })
  }
}

export default withAuth(handler)