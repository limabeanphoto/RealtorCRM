// pages/tasks.js
import { useState, useEffect } from 'react'
import TaskModal from '../components/tasks/TaskModal'
import TaskCard from '../components/tasks/TaskCard'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import Button from '../components/common/Button' // Import Button
import { FaTrash, FaSearch } from 'react-icons/fa'
import theme from '../styles/theme'

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [filter, setFilter] = useState('todo') // Changed default from 'all' to 'todo'
  const [purging, setPurging] = useState(false) // State for purge operation
  const [searchTerm, setSearchTerm] = useState('') // New state for search functionality
  
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
  
  // Handle task status change - updated for Active/Completed only
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

  // Handle purging all completed tasks
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
    // Make a copy of the task for editing
    // Note: We don't need to modify the dueDate here anymore
    // The TaskModal component will handle the conversion
    setEditingTask({
      ...task
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
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Filter tasks based on status and search term
  const filteredTasks = tasks.filter(task => {
    // First filter by status (To-Do/Completed)
    const statusMatch = 
      (filter === 'todo' && task.status !== 'Completed') ||
      (filter === 'completed' && task.status === 'Completed');
    
    // Then filter by search term if one exists
    if (!searchTerm) return statusMatch;
    
    const searchLower = searchTerm.toLowerCase();
    
    // Search in task title, description, contact name
    const titleMatch = task.title?.toLowerCase().includes(searchLower);
    const descMatch = task.description?.toLowerCase().includes(searchLower);
    const contactMatch = task.contact?.name?.toLowerCase().includes(searchLower);
    
    return statusMatch && (titleMatch || descMatch || contactMatch);
  });
  
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
          <Button
            onClick={() => {
              setEditingTask(null)
              setIsTaskModalOpen(true)
            }}
            tooltip="Open the form to create a new task"
          >
            New Task
          </Button>
        </div>
        
        {/* Task Filters and Search - Updated layout with search box */}
        <div style={{ 
          marginBottom: '1.5rem', 
          display: 'flex', 
          flexWrap: 'wrap',
          justifyContent: 'space-between', 
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Button
              onClick={() => setFilter('todo')}
              variant={filter === 'todo' ? 'primary' : 'outline'}
              tooltip={`Show tasks that are not completed (${counts.todo})`}
            >
              To-Do ({counts.todo})
            </Button>
            
            <Button
              onClick={() => setFilter('completed')}
              variant={filter === 'completed' ? 'primary' : 'outline'}
              tooltip={`Show tasks that have been completed (${counts.completed})`}
            >
              Completed ({counts.completed})
            </Button>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Search Box */}
            <div style={{ 
              position: 'relative',
              display: 'flex',
              alignItems: 'center'
            }}>
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={handleSearchChange}
                style={{
                  padding: '0.5rem 0.5rem 0.5rem 2rem', // Space for the icon
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  width: '250px'
                }}
              />
              <FaSearch 
                size={14} 
                style={{ 
                  position: 'absolute', 
                  left: '0.75rem',
                  color: '#a0aec0'
                }} 
              />
            </div>
            
            {/* Purge button - only visible in Completed view */}
            {filter === 'completed' && counts.completed > 0 && (
              <Button
                onClick={handlePurgeCompleted}
                disabled={purging}
                variant="outline"
                style={{ color: '#e74c3c', borderColor: '#e74c3c' }} // Danger color
                tooltip="Permanently delete all completed tasks"
              >
                <FaTrash size={14} style={{ marginRight: '0.5rem' }} />
                {purging ? 'Purging...' : 'Purge All Completed'}
              </Button>
            )}
          </div>
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
              {searchTerm 
                ? 'No tasks matching your search.' 
                : filter === 'todo' 
                  ? 'No tasks to do. Create your first task to get started!' 
                  : 'No completed tasks.'}
            </p>
            {filter === 'todo' && !searchTerm && (
              <Button
                onClick={() => {
                  setEditingTask(null)
                  setIsTaskModalOpen(true)
                }}
                tooltip="Create your very first task"
              >
                Create Your First Task
              </Button>
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