// pages/tasks.js
import { useState, useEffect } from 'react'
import TaskModal from '../components/tasks/TaskModal'
import TaskCard from '../components/tasks/TaskCard'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import { FaTrash } from 'react-icons/fa'
import theme from '../styles/theme'

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [filter, setFilter] = useState('todo') // Changed default from 'all' to 'todo'
  const [purging, setPurging] = useState(false) // New state for purge operation
  
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
  
  // Handle task status change - updated for Active/Completed
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

  // NEW FUNCTION: Handle purging all completed tasks
  const handlePurgeCompleted = async () => {
    if (!confirm('Are you sure you want to delete ALL completed tasks? This cannot be undone.')) {
      return;
    }
    
    setPurging(true);
    
    try {
      const token = localStorage.getItem('token');
      const completedTasks = tasks.filter(task => task.status === 'Completed');
      
      if (completedTasks.length === 0) {
        alert('No completed tasks to purge');
        setPurging(false);
        return;
      }
      
      // Delete each completed task one by one
      const deletePromises = completedTasks.map(task => 
        fetch(`/api/tasks/${task.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      );
      
      await Promise.all(deletePromises);
      
      // Remove the completed tasks from state
      setTasks(tasks.filter(task => task.status !== 'Completed'));
      alert(`${completedTasks.length} completed tasks have been deleted`);
    } catch (error) {
      console.error('Error purging completed tasks:', error);
      alert('Error purging completed tasks');
    } finally {
      setPurging(false);
    }
  };
  
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
    if (filter === 'todo') return task.status !== 'Completed'
    if (filter === 'completed') return task.status === 'Completed'
    return true
  })
  
  // Get counts for filters
  const counts = {
    todo: tasks.filter(task => task.status !== 'Completed').length,
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
        
        {/* Task Filters - Updated to To-Do/Completed */}
        <div style={{ 
          marginBottom: '1.5rem', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => setFilter('todo')}
              style={{
                backgroundColor: filter === 'todo' ? theme.colors.brand.primary : '#e2e8f0',
                color: filter === 'todo' ? 'white' : '#4a5568',
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              To-Do ({counts.todo})
            </button>
            
            <button
              onClick={() => setFilter('completed')}
              style={{
                backgroundColor: filter === 'completed' ? theme.colors.brand.primary : '#e2e8f0',
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
          
          {/* Purge button - only visible in Completed view */}
          {filter === 'completed' && counts.completed > 0 && (
            <button
              onClick={handlePurgeCompleted}
              disabled={purging}
              style={{
                backgroundColor: '#e74c3c',
                color: 'white',
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '4px',
                cursor: purging ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                opacity: purging ? 0.7 : 1
              }}
            >
              <FaTrash size={14} />
              {purging ? 'Purging...' : 'Purge All Completed'}
            </button>
          )}
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
            <p style={{ marginBottom: '1rem' }}>
              {filter === 'todo' 
                ? 'No tasks to do. Create your first task to get started!' 
                : 'No completed tasks.'}
            </p>
            {filter === 'todo' && (
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
            )}
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