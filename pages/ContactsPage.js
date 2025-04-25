import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ContactTable from '../components/contacts/ContactTable';
import ContactModal from '../components/contacts/ContactModal';
import CallModal from '../components/calls/CallModal';
import TaskModal from '../components/tasks/TaskModal';
import ContactReassignForm from '../components/admin/ContactReassignForm';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import Button from '../components/common/Button';
import theme from '../styles/theme';
import { FaPlus, FaUpload, FaUserAlt } from 'react-icons/fa';

export default function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // State for modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [selectedCall, setSelectedCall] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  // Get user from localStorage
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
  }, []);

  // Fetch contacts with their tasks
  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Fetch contacts
      const contactsResponse = await fetch('/api/contacts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const contactsData = await contactsResponse.json();

      if (contactsData.success) {
        // Fetch tasks and calls for each contact
        const contactsWithTasksAndCalls = await Promise.all(
          contactsData.data.map(async (contact) => {
            try {
              // Fetch tasks
              const tasksResponse = await fetch(`/api/tasks?contactId=${contact.id}`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              
              const tasksData = await tasksResponse.json();
              
              // Fetch calls
              const callsResponse = await fetch(`/api/calls?contactId=${contact.id}`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              
              const callsData = await callsResponse.json();
              
              return {
                ...contact,
                tasks: tasksData.success ? tasksData.data : [],
                calls: callsData.success ? callsData.data : []
              };
            } catch (error) {
              console.error(`Error fetching data for contact ${contact.id}:`, error);
              return {
                ...contact,
                tasks: [],
                calls: []
              };
            }
          })
        );
        
        setContacts(contactsWithTasksAndCalls);
      } else {
        console.error('Error fetching contacts:', contactsData.message);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      setLoading(false);
    }
  };

  // Handle contact update
  const handleContactUpdate = (updatedContact) => {
    setContacts(prevContacts =>
      prevContacts.map(contact =>
        contact.id === updatedContact.id ? { ...updatedContact, tasks: contact.tasks, calls: contact.calls } : contact
      )
    );
  };

  // Handle adding a new contact
  const handleAddContact = async (formData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      // Handle duplicate detection response
      if (response.status === 409 && data.duplicates) {
        return {
          success: false,
          message: data.message,
          duplicates: data.duplicates
        };
      }

      // Handle force create with duplicates
      if (formData.forceCreate && !data.success) {
        // If force create is requested but original request failed,
        // retry with the special flag to skip duplicate checks
        const forceResponse = await fetch('/api/contacts/force-create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            ...formData,
            skipDuplicateCheck: true
          })
        });

        const forceData = await forceResponse.json();

        if (forceData.success) {
          // Add the new contact to the list
          setContacts([forceData.data, ...contacts]);
          return { success: true, data: forceData.data };
        } else {
          alert('Error creating contact: ' + forceData.message);
          return { success: false, message: forceData.message };
        }
      }

      if (data.success) {
        // Add the new contact to the list
        setContacts([{ ...data.data, tasks: [], calls: [] }, ...contacts]);
        return { success: true, data: data.data };
      } else {
        alert('Error creating contact: ' + data.message);
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Error creating contact:', error);
      alert('Error creating contact');
      return { success: false, message: error.message };
    }
  };

  const handleViewExistingContact = (contact) => {
    // Open the edit modal with the existing contact
    setSelectedContact(contact);
    setIsEditModalOpen(true);
  };

  // Handle editing a contact
  const handleEditContact = async (formData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/contacts/${formData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        // Update the contact in the list, preserving tasks and calls
        setContacts(contacts.map(contact =>
          contact.id === data.data.id ? { ...data.data, tasks: contact.tasks, calls: contact.calls } : contact
        ));
        return { success: true, data: data.data };
      } else {
        alert('Error updating contact: ' + data.message);
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Error updating contact:', error);
      alert('Error updating contact');
      return { success: false, message: error.message };
    }
  };

  // Handle reassigning a contact (admin only)
  const handleReassignContact = (updatedContact) => {
    // Update the contact in the list preserving tasks and calls
    setContacts(contacts.map(contact =>
      contact.id === updatedContact.id ? { ...updatedContact, tasks: contact.tasks, calls: contact.calls } : contact
    ));

    // Close the reassign modal
    setIsReassignModalOpen(false);
  };

  // Handle deleting a contact
  const handleDeleteContact = async (contactId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        // Remove the contact from the list
        setContacts(contacts.filter(contact => contact.id !== contactId));
        return { success: true };
      } else {
        alert('Error deleting contact: ' + data.message);
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
      alert('Error deleting contact');
      return { success: false, message: error.message };
    }
  };

  // Handle opening the edit modal
  const handleOpenEditModal = (contact) => {
    setSelectedContact(contact);
    setIsEditModalOpen(true);
  };

  // Handle opening the reassign modal (admin only)
  const handleOpenReassignModal = (contact) => {
    setSelectedContact(contact);
    setIsReassignModalOpen(true);
  };

  // Handle logging a call
  const handleLogCall = (contact) => {
    setSelectedContact(contact);
    setSelectedCall(null);
    setIsCallModalOpen(true);
  };

  // Handle adding a task
  const handleAddTask = (contact, call = null) => {
    setSelectedContact(contact);
    setSelectedCall(call);
    setSelectedTask(null); // Ensure no previous edit task is selected
    setIsTaskModalOpen(true);
  };

  // Handle editing a task
  const handleEditTask = (task) => {
    // Find the contact associated with this task
    const associatedContact = contacts.find(c => c.id === task.contactId);

    if (!associatedContact) {
      console.error("Could not find contact associated with task:", task);
      alert("Error: Could not find the contact for this task.");
      return;
    }

    setSelectedTask({
       ...task,
       // Ensure dueDate is formatted correctly for the modal's input type="datetime-local"
       dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : ''
    });
    setSelectedContact(associatedContact); // Set the correct contact
    setSelectedCall(null); // Clear any selected call
    setIsTaskModalOpen(true);
  };

  // Handle task status change
  const handleTaskStatusChange = async (taskId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
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
      });

      const data = await response.json();

      if (data.success) {
        // Update the task within the specific contact in the state
        const updatedTask = data.data;
        setContacts(prevContacts => prevContacts.map(contact => {
          if (contact.id === updatedTask.contactId) {
            return {
              ...contact,
              tasks: (contact.tasks || []).map(task =>
                task.id === updatedTask.id ? updatedTask : task
              )
            };
          }
          return contact;
        }));
        
        return { success: true, data: data.data };
      } else {
        alert('Error updating task status: ' + data.message);
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      alert('Error updating task status');
      return { success: false, message: error.message };
    }
  };
  
  // Handle call form submission
  const handleCallSubmit = async (formData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/calls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        // Update the contact in the list with new lastCallOutcome
        const updatedContact = {
          ...selectedContact,
          lastCallOutcome: data.data.outcome,
          lastCallDate: data.data.date,
          // Add the new call to the contact's calls array
          calls: selectedContact.calls ? [data.data, ...selectedContact.calls] : [data.data]
        };

        handleContactUpdate(updatedContact); // Updates the contact in the main list

        return { success: true, data: data.data };
      } else {
        alert('Error logging call: ' + data.message);
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Error logging call:', error);
      alert('Error logging call');
      return { success: false, message: error.message };
    }
  };

  // Handle task form submission
  const handleTaskSubmit = async (formData) => {
    try {
      const token = localStorage.getItem('token');

      // Check if we're updating an existing task or creating a new one
      const isUpdating = !!formData.id;

      const url = isUpdating ? `/api/tasks/${formData.id}` : '/api/tasks';
      const method = isUpdating ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        const updatedOrNewTask = data.data;

        // Update the task list within the relevant contact
        setContacts(prevContacts => prevContacts.map(contact => {
          if (contact.id === updatedOrNewTask.contactId) {
            const currentTasks = contact.tasks || [];
            let updatedTasks;
            
            if (isUpdating) {
              // Map existing tasks, replacing the updated one
              updatedTasks = currentTasks.map(task =>
                task.id === updatedOrNewTask.id ? updatedOrNewTask : task
              );
            } else {
              // Add the new task to the beginning of the array
              updatedTasks = [updatedOrNewTask, ...currentTasks];
            }
            
            return { ...contact, tasks: updatedTasks };
          }
          return contact;
        }));

        return { success: true, data: updatedOrNewTask };
      } else {
        alert(`Error ${isUpdating ? 'updating' : 'creating'} task: ` + data.message);
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error(`Error ${formData.id ? 'updating' : 'creating'} task:`, error);
      alert(`Error ${formData.id ? 'updating' : 'creating'} task`);
      return { success: false, message: error.message };
    }
  };

  // Function to close the Task Modal and reset states
  const closeTaskModal = () => {
    setIsTaskModalOpen(false);
    setSelectedTask(null);
    setSelectedContact(null);
    setSelectedCall(null);
  };

  // Navigate to import contacts page
  const handleImportContacts = () => {
    router.push('/admin/contacts/import');
  };

  // Navigate to assign contacts page
  const handleAssignContacts = () => {
    router.push('/admin/contacts/assign');
  };

  return (
    <ProtectedRoute>
      <div style={{ 
        width: '100%',
        margin: '0',
        padding: '0',
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '100%',
        minHeight: '100vh',
        backgroundColor: theme.colors.brand.background
      }}>
        <div style={{ 
          padding: '1rem',
          marginBottom: '1rem',
          backgroundColor: 'white',
          boxShadow: theme.shadows.sm
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <h1 style={{ 
              margin: 0, 
              color: theme.colors.brand.primary, 
              fontSize: 'clamp(1.25rem, 4vw, 1.75rem)', 
              fontWeight: 'bold' 
            }}>
              Contacts
            </h1>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {user && user.role === 'admin' && (
                <Button
                  onClick={handleAssignContacts}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    paddingLeft: '1rem',
                    paddingRight: '1rem',
                    fontSize: 'clamp(0.8rem, 2vw, 1rem)'
                  }}
                  variant="outline"
                >
                  <FaUserAlt size={12} />
                  Assign Contacts
                </Button>
              )}
              
              <Button
                onClick={handleImportContacts}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  paddingLeft: '1rem',
                  paddingRight: '1rem',
                  fontSize: 'clamp(0.8rem, 2vw, 1rem)'
                }}
                variant="secondary"
              >
                <FaUpload size={12} />
                Import Contacts
              </Button>
              
              <Button
                onClick={() => setIsAddModalOpen(true)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  paddingLeft: '1rem',
                  paddingRight: '1rem',
                  fontSize: 'clamp(0.8rem, 2vw, 1rem)'
                }}
              >
                <FaPlus size={12} />
                Add Contact
              </Button>
            </div>
          </div>
        </div>

        {/* Contact Table - Maximize width */}
        <div style={{ 
          width: '100%',
          padding: '0 1rem',
          flex: 1,
          position: 'relative',
          minHeight: 0
        }}>
          <ContactTable
            contacts={contacts}
            onEditContact={handleOpenEditModal}
            onLogCall={handleLogCall}
            onAddTask={handleAddTask}
            onDeleteContact={handleDeleteContact}
            onContactUpdate={handleContactUpdate}
            onReassignContact={handleOpenReassignModal}
            onEditTask={handleEditTask}
            onTaskStatusChange={handleTaskStatusChange}
            loading={loading}
            currentUser={user}
          />
        </div>

        {/* Add Contact Modal */}
        <ContactModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          contact={{}} // Empty for adding
          onSubmit={handleAddContact}
          mode="add"
          onViewExistingContact={handleViewExistingContact} // For duplicate handling
        />

        {/* Edit Contact Modal */}
        <ContactModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          contact={selectedContact || {}} // Use selected contact for editing
          onSubmit={handleEditContact}
          mode="edit"
        />

        {/* Call Modal */}
        <CallModal
          isOpen={isCallModalOpen}
          onClose={() => setIsCallModalOpen(false)}
          contact={selectedContact} // Pass selected contact
          onSubmit={handleCallSubmit}
          // Pass handleAddTask to create follow-up task from CallModal
          onCreateTask={handleAddTask}
        />

        {/* Task Modal */}
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={closeTaskModal}
          task={selectedTask}
          contact={selectedContact}
          contacts={contacts} // Pass full contacts list for potential dropdown
          onSubmit={handleTaskSubmit}
        />

        {/* Admin-only Reassign Modal */}
        {user && user.role === 'admin' && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: isReassignModalOpen ? 'flex' : 'none',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => setIsReassignModalOpen(false)} // Close on overlay click
          >
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                maxWidth: '500px',
                width: '90%', // Use percentage for better responsiveness
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '1.5rem' // Add some padding
              }}
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
            >
              {selectedContact && ( // Ensure contact is selected before rendering form
                <ContactReassignForm
                  contact={selectedContact}
                  onCancel={() => setIsReassignModalOpen(false)}
                  onSuccess={handleReassignContact}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}