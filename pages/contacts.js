// pages/contacts.js
import { useState, useEffect } from 'react'
import ContactForm from '../components/contacts/ContactForm'
import ContactModal from '../components/contacts/ContactModal'
import ContactCard from '../components/contacts/ContactCard'
import CallModal from '../components/calls/CallModal'
import TaskModal from '../components/tasks/TaskModal'
import ProtectedRoute from '../components/auth/ProtectedRoute'

export default function Contacts() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  
  // State for modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isCallModalOpen, setIsCallModalOpen] = useState(false)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState(null)
  const [selectedCall, setSelectedCall] = useState(null)
  const [selectedTask, setSelectedTask] = useState(null)
  
  // Added state for filters
  const [filter, setFilter] = useState('all') // all, open, assigned
  
  // Get user from localStorage
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}')
    setUser(userData)
  }, [])
  
  // Fetch contacts
  useEffect(() => {
    fetchContacts()
  }, [filter]) // Re-fetch when filter changes

  const fetchContacts = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      // Build URL with filter parameters
      let url = '/api/contacts'
      if (filter === 'open') {
        url += '?status=Open'
      } else if (filter === 'assigned' && user?.id) {
        url += `?assignedTo=${user.id}`
      }
      
      const response = await fetch(url, {
         headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      
      if (data.success) {
        setContacts(data.data)
      } else {
        console.error('Error fetching contacts:', data.message)
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Error fetching contacts:', error)
      setLoading(false)
    }
  }
  
  // Handle adding a new contact
  const handleAddContact = async (formData) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Add the new contact to the list if it matches current filter
        if (filter === 'all' || 
            (filter === 'open' && data.data.status === 'Open') ||
            (filter === 'assigned' && data.data.assignedTo === user?.id)) {
          setContacts([data.data, ...contacts])
        }
        return { success: true, data: data.data }
      } else {
        alert('Error creating contact: ' + data.message)
        return { success: false, message: data.message }
      }
    } catch (error) {
      console.error('Error creating contact:', error)
      alert('Error creating contact')
      return { success: false, message: error.message }
    }
  }

  // Handle editing a contact
  const handleEditContact = async (formData) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/contacts/${formData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Update the contact in the list
        setContacts(contacts.map(contact => 
          contact.id === data.data.id ? data.data : contact
        ))
        return { success: true, data: data.data }
      } else {
        alert('Error updating contact: ' + data.message)
        return { success: false, message: data.message }
      }
    } catch (error) {
      console.error('Error updating contact:', error)
      alert('Error updating contact')
      return { success: false, message: error.message }
    }
  }

  // Handle deleting a contact
  const handleDeleteContact = async (contactId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Remove the contact from the list
        setContacts(contacts.filter(contact => contact.id !== contactId))
        return { success: true }
      } else {
        alert('Error deleting contact: ' + data.message)
        return { success: false, message: data.message }
      }
    } catch (error) {
      console.error('Error deleting contact:', error)
      alert('Error deleting contact')
      return { success: false, message: error.message }
    }
  }

  // Handle opening the edit modal for a contact
  const handleOpenEditModal = (contact) => {
    setSelectedContact(contact)
    setIsEditModalOpen(true)
  }

  // Handle logging a call
  const handleLogCall = (contact) => {
    setSelectedContact(contact)
    setSelectedCall(null)
    setIsCallModalOpen(true)
  }

  // Handle adding a task
  const handleAddTask = (contact, call = null) => {
    setSelectedContact(contact)
    setSelectedCall(call)
    setSelectedTask(null)
    setIsTaskModalOpen(true)
  }

  // Handle editing a task
  const handleEditTask = (task) => {
    setSelectedTask(task)
    setSelectedContact(null) // We'll get the contact from the task
    setIsTaskModalOpen(true)
  }

  // Handle task status change
  const handleTaskStatusChange = async (taskId, newStatus) => {
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
        return { success: true, data: data.data }
      } else {
        alert('Error updating task status: ' + data.message)
        return { success: false, message: data.message }
      }
    } catch (error) {
      console.error('Error updating task status:', error)
      alert('Error updating task status')
      return { success: false, message: error.message }
    }
  }

  // Handle call form submission
  const handleCallSubmit = async (formData) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/calls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('Call logged successfully')
        return { success: true, data: data.data }
      } else {
        alert('Error logging call: ' + data.message)
        return { success: false, message: data.message }
      }
    } catch (error) {
      console.error('Error logging call:', error)
      alert('Error logging call')
      return { success: false, message: error.message }
    }
  }

  // Handle task form submission
  const handleTaskSubmit = async (formData) => {
    try {
      const token = localStorage.getItem('token')
      
      // Check if we're updating an existing task or creating a new one
      const isUpdating = !!formData.id
      
      const url = isUpdating ? `/api/tasks/${formData.id}` : '/api/tasks'
      const method = isUpdating ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert(`Task ${isUpdating ? 'updated' : 'created'} successfully`)
        return { success: true, data: data.data }
      } else {
        alert(`Error ${isUpdating ? 'updating' : 'creating'} task: ` + data.message)
        return { success: false, message: data.message }
      }
    } catch (error) {
      console.error(`Error ${formData.id ? 'updating' : 'creating'} task:`, error)
      alert(`Error ${formData.id ? 'updating' : 'creating'} task`)
      return { success: false, message: error.message }
    }
  }
  
  // Get counts for filter badges
  const getCounts = () => {
    const openCount = contacts.filter(contact => contact.status === 'Open').length
    const assignedCount = contacts.filter(contact => contact.assignedTo === user?.id).length
    
    return {
      all: contacts.length,
      open: openCount,
      assigned: assignedCount
    }
  }
  
  const counts = getCounts()
  
  // Filter contacts based on search term
  const [searchTerm, setSearchTerm] = useState('')
  
  const filteredContacts = contacts.filter(contact => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        contact.name.toLowerCase().includes(searchLower) ||
        (contact.company && contact.company.toLowerCase().includes(searchLower)) ||
        contact.phone.includes(searchTerm) ||
        (contact.email && contact.email.toLowerCase().includes(searchLower))
      )
    }
    return true
  })
  
  // Prepare initial task data for task modal when creating from a call
  const getInitialTaskData = () => {
    let initialData = {}
    
    if (selectedContact) {
      initialData.contactId = selectedContact.id
    }
    
    if (selectedCall) {
      initialData.callId = selectedCall.id
      initialData.title = `Follow up with ${selectedContact.name}`
      initialData.description = `Follow-up from call on ${new Date(selectedCall.date).toLocaleDateString()}${selectedCall.notes ? `: ${selectedCall.notes}` : ''}`
    }
    
    if (selectedTask) {
      // If editing a task, use all its data
      initialData = {
        ...selectedTask,
        dueDate: new Date(selectedTask.dueDate).toISOString().slice(0, 16)
      }
    }
    
    return initialData
  }
  
  return (
    <ProtectedRoute>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1>Contacts</h1>
          <button
            onClick={() => setIsAddModalOpen(true)}
            style={{
              backgroundColor: '#4a69bd',
              color: 'white',
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Add Contact
          </button>
        </div>
        
        {/* Filters and Search */}
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          justifyContent: 'space-between', 
          gap: '1rem', 
          marginBottom: '1.5rem' 
        }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
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
              All Contacts ({counts.all})
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
              onClick={() => setFilter('assigned')}
              style={{
                backgroundColor: filter === 'assigned' ? '#4a69bd' : '#e2e8f0',
                color: filter === 'assigned' ? 'white' : '#4a5568',
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              My Contacts ({counts.assigned})
            </button>
          </div>
          
          <div>
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '0.5rem',
                borderRadius: '4px',
                border: '1px solid #ddd',
                width: '250px'
              }}
            />
          </div>
        </div>
        
        {/* Contact Cards List */}
        {loading ? (
          <p>Loading contacts...</p>
        ) : filteredContacts.length > 0 ? (
          <div>
            {filteredContacts.map(contact => (
              <ContactCard
                key={contact.id}
                contact={contact}
                onEditClick={handleOpenEditModal}
                onLogCallClick={handleLogCall}
                onAddTaskClick={handleAddTask}
                onDeleteContact={handleDeleteContact}
                onEditTask={handleEditTask}
                onTaskStatusChange={handleTaskStatusChange}
              />
            ))}
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '2rem', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '8px' 
          }}>
            <p style={{ marginBottom: '1rem' }}>
              {searchTerm 
                ? 'No contacts found matching your search.' 
                : 'No contacts found. Add your first contact to get started.'}
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              style={{
                backgroundColor: '#4a69bd',
                color: 'white',
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Add Contact
            </button>
          </div>
        )}

        {/* Add Contact Modal */}
        <ContactModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          contact={{}}
          onSubmit={handleAddContact}
          mode="add"
        />

        {/* Edit Contact Modal */}
        <ContactModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          contact={selectedContact || {}}
          onSubmit={handleEditContact}
          mode="edit"
        />

        {/* Call Modal */}
        <CallModal
          isOpen={isCallModalOpen}
          onClose={() => setIsCallModalOpen(false)}
          contact={selectedContact}
          onSubmit={handleCallSubmit}
        />

        {/* Task Modal */}
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          contact={selectedContact}
          contacts={contacts}
          initialData={getInitialTaskData()}
          onSubmit={handleTaskSubmit}
        />
      </div>
    </ProtectedRoute>
  )
}