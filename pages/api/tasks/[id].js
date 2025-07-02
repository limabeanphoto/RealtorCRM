import { PrismaClient } from '@prisma/client'

// Initialize Prisma client
const prisma = new PrismaClient()

export default async function handler(req, res) {
  const { id } = req.query
  
  if (!id) {
    return res.status(400).json({ success: false, message: 'Task ID is required' })
  }
  
  // GET single task
  if (req.method === 'GET') {
    try {
      const task = await prisma.task.findUnique({
        where: { id },
        include: {
          contact: {
            select: {
              id: true,
              name: true,
              company: true,
              phone: true,
              email: true
            }
          },
          call: {
            select: {
              id: true,
              date: true,
              outcome: true,
              notes: true
            }
          }
        }
      })
      
      if (!task) {
        return res.status(404).json({ success: false, message: 'Task not found' })
      }
      
      return res.status(200).json({ success: true, data: task })
    } catch (error) {
      console.error('Error fetching task:', error)
      return res.status(500).json({ success: false, message: 'Error fetching task' })
    }
  }
  
  // PUT (update) single task
  else if (req.method === 'PUT') {
    try {
      const { title, description, status, priority, dueDate, contactId, callId, completed } = req.body
      
      // Check if task exists
      const existingTask = await prisma.task.findUnique({
        where: { id }
      })
      
      if (!existingTask) {
        return res.status(404).json({ success: false, message: 'Task not found' })
      }
      
      // Handle completion status with simplified Active/Completed system
      const wasCompleted = existingTask.status === 'Completed'
      const isNowCompleted = status === 'Completed'
      let completedAt = existingTask.completedAt
      
      if (!wasCompleted && isNowCompleted) {
        // Task is being marked as completed
        completedAt = new Date()
      } else if (wasCompleted && !isNowCompleted) {
        // Task is being unmarked as completed
        completedAt = null
      }
      
      // Update task
      const updatedTask = await prisma.task.update({
        where: { id },
        data: {
          title: title || undefined,
          description: description !== undefined ? description : undefined,
          status: status || undefined,
          priority: priority || undefined,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          contactId: contactId !== undefined ? contactId : undefined,
          callId: callId !== undefined ? callId : undefined,
          completed: completed !== undefined ? completed : isNowCompleted,
          completedAt
        },
        include: {
          contact: {
            select: {
              id: true,
              name: true,
              company: true,
              phone: true,
              email: true
            }
          },
          call: {
            select: {
              id: true,
              date: true,
              outcome: true,
              notes: true
            }
          }
        }
      })
      
      return res.status(200).json({ success: true, data: updatedTask })
    } catch (error) {
      console.error('Error updating task:', error)
      return res.status(500).json({ success: false, message: error.message })
    }
  }
  
  // DELETE single task
  else if (req.method === 'DELETE') {
    try {
      // Check if task exists
      const existingTask = await prisma.task.findUnique({
        where: { id }
      })
      
      if (!existingTask) {
        return res.status(404).json({ success: false, message: 'Task not found' })
      }
      
      // Delete the task
      await prisma.task.delete({
        where: { id }
      })
      
      return res.status(200).json({ success: true, message: 'Task deleted successfully' })
    } catch (error) {
      console.error('Error deleting task:', error)
      return res.status(500).json({ success: false, message: error.message })
    }
  }
  
  else {
    // Method not allowed
    return res.status(405).json({ success: false, message: `Method ${req.method} not allowed` })
  }
}