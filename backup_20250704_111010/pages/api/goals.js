import { PrismaClient } from '@prisma/client'

// Initialize Prisma client
const prisma = new PrismaClient()

export default async function handler(req, res) {
  // Handle different HTTP methods
  if (req.method === 'GET') {
    try {
      // Get query parameters
      const { userId } = req.query
      
      // Build query conditions
      const where = {}
      if (userId) {
        where.userId = userId
      }
      
      // Get all goals with optional filtering
      const goals = await prisma.goal.findMany({
        where,
        orderBy: {
          endDate: 'asc'
        }
      })
      
      return res.status(200).json({ success: true, data: goals })
    } catch (error) {
      console.error('Error fetching goals:', error)
      return res.status(500).json({ success: false, message: 'Error fetching goals' })
    }
  } 
  
  else if (req.method === 'POST') {
    try {
      const { title, description, goalType, targetValue, startDate, endDate, userId } = req.body
      
      // Validate required fields
      if (!title || !goalType || !targetValue || !startDate || !endDate) {
        return res.status(400).json({ 
          success: false, 
          message: 'Title, goal type, target value, start date, and end date are required' 
        })
      }
      
      // Create goal
      const newGoal = await prisma.goal.create({
        data: {
          title,
          description: description || null,
          goalType,
          targetValue: parseInt(targetValue),
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          userId: userId || null
        }
      })
      
      return res.status(201).json({ success: true, data: newGoal })
    } catch (error) {
      console.error('Error creating goal:', error)
      return res.status(500).json({ success: false, message: error.message })
    }
  } 
  
  else {
    // Method not allowed
    return res.status(405).json({ success: false, message: `Method ${req.method} not allowed` })
  }
}