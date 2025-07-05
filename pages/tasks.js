// pages/tasks.js
import { useState, useEffect } from 'react'
import TaskModal from '../components/tasks/TaskModal'
import TaskCard from '../components/tasks/TaskCard'
import TaskBoard from '../components/tasks/TaskBoard'
import TaskViewToggle from '../components/tasks/TaskViewToggle'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import Button from '../components/common/Button'
import { FaTrash, FaSearch, FaPlus } from 'react-icons/fa'
import theme from '../styles/theme'

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [filter, setFilter] = useState('todo') // Changed default from 'all' to 'todo'
  const [purging, setPurging] = useState(false) // State for purge operation
  const [searchTerm, setSearchTerm] = useState('') // Search functionality
  const [viewMode, setViewMode] = useState('list') // New: list or board view
  
  // Fetch tasks and contacts
  useEffect(() => {
    async function fetchData() {
      try {
        // Check if we're on the client side before accessing localStorage
        if (typeof window === 'undefined') return;
        
        const token = localStorage.getItem('token')
        
        // Fetch tasks
        const tasksResponse = await fetch('/api/tasks', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const tasksData = await tasksResponse.json()
        
        if (tasksData.success) {
          // Ensure tasks have priority (default to medium if missing)
          const tasksWithPriority = tasksData.data.map(task => ({
            ...task,
            priority: task.priority || 'medium'
          }))
          setTasks(tasksWithPriority)
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
      // Check if we're on the client side before accessing localStorage
      if (typeof window === 'undefined') return { success: false, message: 'Client-side only operation' };
      
      const token = localStorage.getItem('token')
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          priority: formData.priority || 'medium' // Ensure priority is set
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Add the new task to the list
        const newTaskWithPriority = {
          ...data.data,
          priority: data.data.priority || 'medium'
        }
        setTasks([newTaskWithPriority, ...tasks])
        return { success: true, data: newTaskWithPriority }
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
      // Check if we're on the client side before accessing localStorage
      if (typeof window === 'undefined') return { success: false, message: 'Client-side only operation' };
      
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/tasks/${formData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          priority: formData.priority || 'medium' // Ensure priority is set
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Update the task in the list
        const updatedTaskWithPriority = {
          ...data.data,
          priority: data.data.priority || 'medium'
        }
        setTasks(tasks.map(task => 
          task.id === data.data.id ? updatedTaskWithPriority : task
        ))
        return { success: true, data: updatedTaskWithPriority }
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
      // Check if we're on the client side before accessing localStorage
      if (typeof window === 'undefined') return;
      
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
        const updatedTask = {
          ...data.data,
          priority: data.data.priority || 'medium'
        }
        setTasks(tasks.map(task => 
          task.id === data.data.id ? updatedTask : task
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
      // Check if we're on the client side before accessing localStorage
      if (typeof window === 'undefined') return;
      
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

  // Handle task duplication
  const handleDuplicateTask = async (task) => {
    const duplicatedTask = {
      title: `${task.title} (Copy)`,
      description: task.description,
      priority: task.priority || 'medium',
      contactId: task.contactId,
      dueDate: task.dueDate,
      status: 'Active'
    }
    
    const result = await handleCreateTask(duplicatedTask)
    if (result.success) {
      // Optionally open the edit modal for the duplicated task
      // setEditingTask(result.data)
      // setIsTaskModalOpen(true)
    }
  }

  // Handle purging all completed tasks
  const handlePurgeCompleted = async () => {
    if (!confirm('Are you sure you want to delete ALL completed tasks? This cannot be undone.')) {
      return;
    }
    
    setPurging(true);
    
    try {
      // Check if we're on the client side before accessing localStorage
      if (typeof window === 'undefined') return;
      
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
      priority: task.priority || 'medium' // Ensure priority is set
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
      <div className="modern-page-container">
        {/* Header Section */}
        <div className="page-header" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <h1 className="responsive-heading" style={{ 
            margin: 0,
            background: `linear-gradient(135deg, ${theme.colors.brand.primary}, ${theme.colors.brand.secondary})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Tasks
          </h1>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* View Toggle */}
            <TaskViewToggle 
              currentView={viewMode}
              onViewChange={setViewMode}
              size="medium"
              variant="modern"
            />
            
            {/* New Task Button */}
            <Button
              onClick={() => {
                setEditingTask(null)
                setIsTaskModalOpen(true)
              }}
              variant="gradient"
              className="hover-lift"
              tooltip="Create a new task"
            >
              <FaPlus size={14} style={{ marginRight: '0.5rem' }} />
              New Task
            </Button>
          </div>
        </div>
        
        {/* Controls Section */}
        <div className="controls-section" style={{ 
          marginBottom: '2rem', 
          display: 'flex', 
          flexWrap: 'wrap',
          justifyContent: 'space-between', 
          alignItems: 'center',
          gap: '1rem',
          padding: '1.5rem',
          backgroundColor: 'white',
          borderRadius: theme.borderRadius.lg,
          boxShadow: theme.shadows.sm,
          border: '1px solid #f0f0f0'
        }}>
          {/* Filter Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Button
              onClick={() => setFilter('todo')}
              variant={filter === 'todo' ? 'modern' : 'outline'}
              size="medium"
              className="transition-all"
              tooltip={`Show active tasks (${counts.todo})`}
            >
              To-Do ({counts.todo})
            </Button>
            
            <Button
              onClick={() => setFilter('completed')}
              variant={filter === 'completed' ? 'modern' : 'outline'}
              size="medium"
              className="transition-all"
              tooltip={`Show completed tasks (${counts.completed})`}
            >
              Completed ({counts.completed})
            </Button>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
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
                className="modern-input"
                style={{
                  padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                  borderRadius: theme.borderRadius.md,
                  border: '2px solid #e5e7eb',
                  width: '280px',
                  fontSize: '0.875rem',
                  transition: 'all 0.2s ease'
                }}
              />
              <FaSearch 
                size={16} 
                style={{ 
                  position: 'absolute', 
                  left: '1rem',
                  color: theme.colors.neutral[400]
                }} 
              />
            </div>
            
            {/* Purge button - only visible in Completed view */}
            {filter === 'completed' && counts.completed > 0 && (
              <Button
                onClick={handlePurgeCompleted}
                disabled={purging}
                variant="outline"
                size="medium"
                className="hover-lift-gentle"
                style={{ 
                  color: theme.colors.error[500], 
                  borderColor: theme.colors.error[300],
                  ':hover': {
                    backgroundColor: theme.colors.error[50]
                  }
                }}
                tooltip="Permanently delete all completed tasks"
              >
                <FaTrash size={14} style={{ marginRight: '0.5rem' }} />
                {purging ? 'Purging...' : 'Purge All'}
              </Button>
            )}
          </div>
        </div>
        
        {/* Content Section */}
        <div className="content-section">
          {loading ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '4rem 2rem',
              backgroundColor: 'white',
              borderRadius: theme.borderRadius.lg,
              boxShadow: theme.shadows.sm
            }}>
              <div className="loader-spin" style={{ margin: '0 auto 1rem' }}></div>
              <p style={{ color: theme.colors.neutral[600], fontSize: '1.1rem' }}>Loading tasks...</p>
            </div>
          ) : filteredTasks.length > 0 ? (
            <div>
              {viewMode === 'board' ? (
                <TaskBoard
                  tasks={filteredTasks}
                  onStatusChange={handleStatusChange}
                  onEdit={handleOpenEditModal}
                  onDelete={handleDeleteTask}
                  onDuplicate={handleDuplicateTask}
                  loading={loading}
                />
              ) : (
                <div className="task-list stagger-list" style={{
                  display: 'grid',
                  gap: '1rem'
                }}>
                  {filteredTasks.map((task, index) => (
                    <div key={task.id} className={`fade-in-up stagger-${Math.min(index + 1, 8)}`}>
                      <TaskCard 
                        task={task} 
                        onStatusChange={handleStatusChange}
                        onDelete={handleDeleteTask}
                        onEdit={() => handleOpenEditModal(task)}
                        onDuplicate={() => handleDuplicateTask(task)}
                        className="hover-lift-gentle"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state" style={{ 
              textAlign: 'center', 
              padding: '4rem 2rem', 
              backgroundColor: 'white',
              borderRadius: theme.borderRadius.lg,
              boxShadow: theme.shadows.sm,
              border: '1px solid #f0f0f0'
            }}>
              <div style={{ 
                fontSize: '4rem', 
                marginBottom: '1rem',
                opacity: 0.3
              }}>
                📋
              </div>
              <h3 style={{ 
                marginBottom: '1rem',
                color: theme.colors.neutral[700],
                fontSize: '1.25rem'
              }}>
                {searchTerm 
                  ? 'No tasks matching your search' 
                  : filter === 'todo' 
                    ? 'No tasks to do' 
                    : 'No completed tasks'}
              </h3>
              <p style={{ 
                marginBottom: '2rem',
                color: theme.colors.neutral[500],
                fontSize: '1rem'
              }}>
                {searchTerm 
                  ? 'Try adjusting your search terms' 
                  : filter === 'todo' 
                    ? 'Create your first task to get started!' 
                    : 'Complete some tasks to see them here'}
              </p>
              {filter === 'todo' && !searchTerm && (
                <Button
                  onClick={() => {
                    setEditingTask(null)
                    setIsTaskModalOpen(true)
                  }}
                  variant="gradient"
                  size="large"
                  className="hover-lift scale-in"
                  tooltip="Create your very first task"
                >
                  <FaPlus size={16} style={{ marginRight: '0.5rem' }} />
                  Create Your First Task
                </Button>
              )}
            </div>
          )}
        </div>

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