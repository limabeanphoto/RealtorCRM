// pages/api/tasks.js - Updated for simplified Active/Completed status
import { PrismaClient } from '@prisma/client'

// Initialize Prisma client
const prisma = new PrismaClient()

export default async function handler(req, res) {
  // Handle different HTTP methods
  if (req.method === 'GET') {
    try {
      // Get query parameters for filtering
      const { contactId, status } = req.query
      
      // Build query conditions
      const where = {}
      
      if (contactId) {
        where.contactId = contactId
      }
      
      if (status) {
        where.status = status
      }
      
      // Get all tasks with optional filtering
      const tasks = await prisma.task.findMany({
        where,
        include: {
          contact: {
            select: {
              id: true,
              name: true,
              company: true,
              phone: true
            }
          },
          call: {
            select: {
              id: true,
              date: true,
              outcome: true
            }
          }
        },
        orderBy: [
          {
            status: 'asc' // Incomplete tasks first
          },
          {
            dueDate: 'asc' // Earlier due dates first
          }
        ]
      })
      
      return res.status(200).json({ success: true, data: tasks })
    } catch (error) {
      console.error('Error fetching tasks:', error)
      return res.status(500).json({ success: false, message: 'Error fetching tasks' })
    }
  } 
  
  else if (req.method === 'POST') {
    try {
      const { title, description, status, priority, dueDate, contactId, callId } = req.body
      
      // Validate required fields
      if (!title || !dueDate) {
        return res.status(400).json({ 
          success: false, 
          message: 'Title and due date are required' 
        })
      }
      
      // Map 'Active' status to 'Open' for backward compatibility
      const mappedStatus = status === 'Active' ? 'Active' : status || 'Active'
      
      // Create task
      const newTask = await prisma.task.create({
        data: {
          title,
          description: description || null,
          status: mappedStatus,
          priority: priority || 'Medium',
          dueDate: new Date(dueDate),
          contactId: contactId || null,
          callId: callId || null,
          completed: mappedStatus === 'Completed' // Set completed based on status
        },
        include: {
          contact: {
            select: {
              id: true,
              name: true,
              company: true,
              phone: true
            }
          },
          call: {
            select: {
              id: true,
              date: true,
              outcome: true
            }
          }
        }
      })
      
      return res.status(201).json({ success: true, data: newTask })
    } catch (error) {
      console.error('Error creating task:', error)
      return res.status(500).json({ success: false, message: error.message })
    }
  } 
  
  else if (req.method === 'PUT') {
    try {
      const { id, title, description, status, priority, dueDate, contactId, callId, completed } = req.body
      
      // Validate task ID
      if (!id) {
        return res.status(400).json({ success: false, message: 'Task ID is required' })
      }
      
      // Check if task exists
      const existingTask = await prisma.task.findUnique({
        where: { id }
      })
      
      if (!existingTask) {
        return res.status(404).json({ success: false, message: 'Task not found' })
      }
      
      // Handle completion status based on simplified system
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
      
      // Map status for compatibility
      const mappedStatus = status === 'Active' ? 'Active' : status
      
      // Update task
      const updatedTask = await prisma.task.update({
        where: { id },
        data: {
          title: title || undefined,
          description: description !== undefined ? description : undefined,
          status: mappedStatus || undefined,
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
              phone: true
            }
          },
          call: {
            select: {
              id: true,
              date: true,
              outcome: true
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
  
  else if (req.method === 'DELETE') {
    try {
      const { id } = req.query
      
      // Validate task ID
      if (!id) {
        return res.status(400).json({ success: false, message: 'Task ID is required' })
      }
      
      // Delete task
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