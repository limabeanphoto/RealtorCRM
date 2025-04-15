// pages/tasks.js
import { useState, useEffect } from 'react'
import TaskModal from '../components/tasks/TaskModal'
import TaskCard from '../components/tasks/TaskCard'
import ProtectedRoute from '../components/auth/ProtectedRoute'

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [filter, setFilter] = useState('all') // all, open, completed
  
  // Fetch tasks and contacts
  useEffect(() => {
    async function fetchData() {
      try {
        const token = localStorage.getItem('token')
        
        // Fetch tasks
        const tasksResponse = await fetch('/api/tasks', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const tasksData = await tasksResponse.json()
        
        if (tasksData.success) {
          setTasks(tasksData.data)
        } else {
          console.error('Error fetching tasks:', tasksData.message)
        }
        
        // Fetch contacts for the form
        const contactsResponse = await fetch('/api/contacts', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const contactsData = await contactsResponse.json()
        
        if (contactsData.success) {
          setContacts(contactsData.data)
        } else {
          console.error('Error fetching contacts:', contactsData.message)
        }
        
        setLoading(false)
      } catch (error) {
        console.error('Error fetching data:', error)
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])
  
  // Handle task creation
  const handleCreateTask = async (formData) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Add the new task to the list
        setTasks([data.data, ...tasks])
        return { success: true, data: data.data }
      } else {
        alert('Error creating task: ' + data.message)
        return { success: false, message: data.message }
      }
    } catch (error) {
      console.error('Error creating task:', error)
      alert('Error creating task')
      return { success: false, message: error.message }
    }
  }
  
  // Handle task update
  const handleUpdateTask = async (formData) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/tasks/${formData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Update the task in the list
        setTasks(tasks.map(task => 
          task.id === data.data.id ? data.data : task
        ))
        return { success: true, data: data.data }
      } else {
        alert('Error updating task: ' + data.message)
        return { success: false, message: data.message }
      }
    } catch (error) {
      console.error('Error updating task:', error)
      alert('Error updating task')
      return { success: false, message: error.message }
    }
  }
  
  // Handle task status change
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          status: newStatus,
          completed: newStatus === 'Completed'
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Update the task in the list
        setTasks(tasks.map(task => 
          task.id === data.data.id ? data.data : task
        ))
      } else {
        alert('Error updating task status: ' + data.message)
      }
    } catch (error) {
      console.error('Error updating task status:', error)
      alert('Error updating task status')
    }
  }
  
  // Handle task deletion
  const handleDeleteTask = async (taskId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Remove the task from the list
        setTasks(tasks.filter(task => task.id !== taskId))
      } else {
        alert('Error deleting task: ' + data.message)
      }
    } catch (error) {
      console.error('Error deleting task:', error)
      alert('Error deleting task')
    }
  }

  // Handle opening the edit modal
  const handleOpenEditModal = (task) => {
    setEditingTask({
      ...task,
      dueDate: new Date(task.dueDate).toISOString().slice(0, 16)
    })
    setIsTaskModalOpen(true)
  }

  // Handle task form submit (create or update)
  const handleTaskSubmit = (formData) => {
    if (formData.id) {
      return handleUpdateTask(formData)
    } else {
      return handleCreateTask(formData)
    }
  }
  
  // Filter tasks based on status
  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true
    if (filter === 'open') return task.status !== 'Completed'
    if (filter === 'completed') return task.status === 'Completed'
    return true
  })
  
  // Get counts for filters
  const counts = {
    all: tasks.length,
    open: tasks.filter(task => task.status !== 'Completed').length,
    completed: tasks.filter(task => task.status === 'Completed').length
  }
  
  return (
    <ProtectedRoute>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1>Tasks</h1>
          <button
            onClick={() => {
              setEditingTask(null)
              setIsTaskModalOpen(true)
            }}
            style={{
              backgroundColor: '#4a69bd',
              color: 'white',
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            New Task
          </button>
        </div>
        
        {/* Task Filters */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => setFilter('all')}
            style={{
              backgroundColor: filter === 'all' ? '#4a69bd' : '#e2e8f0',
              color: filter === 'all' ? 'white' : '#4a5568',
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            All Tasks ({counts.all})
          </button>
          
          <button
            onClick={() => setFilter('open')}
            style={{
              backgroundColor: filter === 'open' ? '#4a69bd' : '#e2e8f0',
              color: filter === 'open' ? 'white' : '#4a5568',
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Open ({counts.open})
          </button>
          
          <button
            onClick={() => setFilter('completed')}
            style={{
              backgroundColor: filter === 'completed' ? '#4a69bd' : '#e2e8f0',
              color: filter === 'completed' ? 'white' : '#4a5568',
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Completed ({counts.completed})
          </button>
        </div>
        
        {/* Task List */}
        {loading ? (
          <p>Loading tasks...</p>
        ) : filteredTasks.length > 0 ? (
          <div>
            {filteredTasks.map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onStatusChange={handleStatusChange}
                onDelete={handleDeleteTask}
                onEdit={() => handleOpenEditModal(task)}
              />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <p style={{ marginBottom: '1rem' }}>No tasks found with the current filter.</p>
            <button
              onClick={() => {
                setEditingTask(null)
                setIsTaskModalOpen(true)
              }}
              style={{
                backgroundColor: '#4a69bd',
                color: 'white',
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Create Your First Task
            </button>
          </div>
        )}

        {/* Task Modal */}
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={() => {
            setIsTaskModalOpen(false)
            setEditingTask(null)
          }}
          task={editingTask}
          contacts={contacts}
          onSubmit={handleTaskSubmit}
        />
      </div>
    </ProtectedRoute>
  )
}