import { PrismaClient } from '@prisma/client'

// Initialize Prisma client
const prisma = new PrismaClient()

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: `Method ${req.method} not allowed` })
  }

  try {
    // Get goal ID from query params
    const { goalId } = req.query
    
    if (!goalId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Goal ID is required' 
      })
    }

    // Get goal details
    const goal = await prisma.goal.findUnique({
      where: { id: goalId }
    })
    
    if (!goal) {
      return res.status(404).json({ 
        success: false, 
        message: 'Goal not found' 
      })
    }

    // Calculate current progress based on goal type
    let currentValue = 0
    
    if (goal.goalType === 'calls') {
      // Count calls in the date range
      currentValue = await prisma.call.count({
        where: {
          date: {
            gte: goal.startDate,
            lte: goal.endDate
          },
          userId: goal.userId || undefined
        }
      })
    } 
    else if (goal.goalType === 'deals') {
      // Count deals in the date range
      currentValue = await prisma.call.count({
        where: {
          date: {
            gte: goal.startDate,
            lte: goal.endDate
          },
          isDeal: true,
          userId: goal.userId || undefined
        }
      })
    } 
    else if (goal.goalType === 'contacts') {
      // Count contacts added in the date range
      currentValue = await prisma.contact.count({
        where: {
          createdAt: {
            gte: goal.startDate,
            lte: goal.endDate
          }
        }
      })
    }

    // Calculate progress percentage
    const progressPercentage = Math.min(100, Math.round((currentValue / goal.targetValue) * 100))
    
    // Calculate days remaining and completion status
    const now = new Date()
    const daysTotal = Math.ceil((goal.endDate - goal.startDate) / (1000 * 60 * 60 * 24))
    const daysElapsed = Math.ceil((now - goal.startDate) / (1000 * 60 * 60 * 24))
    const daysRemaining = Math.max(0, Math.ceil((goal.endDate - now) / (1000 * 60 * 60 * 24)))
    
    // Calculate if the goal is on track
    // Expected progress = days elapsed / total days
    const expectedProgress = daysTotal > 0 ? (daysElapsed / daysTotal) * 100 : 0
    const isOnTrack = progressPercentage >= expectedProgress
    
    // Projected final value based on current rate
    const projectedValue = daysElapsed > 0 
      ? Math.round(currentValue * (daysTotal / daysElapsed))
      : 0

    return res.status(200).json({
      success: true,
      goal,
      progress: {
        currentValue,
        targetValue: goal.targetValue,
        progressPercentage,
        daysRemaining,
        daysTotal,
        daysElapsed,
        isOnTrack,
        projectedValue
      }
    })
  } catch (error) {
    console.error('Error fetching goal progress:', error)
    return res.status(500).json({ success: false, message: 'Error fetching goal progress' })
  }
}