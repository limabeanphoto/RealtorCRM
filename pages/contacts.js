// pages/contacts.js
import { useState, useEffect } from 'react';
import ContactForm from '../components/contacts/ContactForm';
import ContactModal from '../components/contacts/ContactModal';
import ContactCard from '../components/contacts/ContactCard';
import CallModal from '../components/calls/CallModal';
import TaskModal from '../components/tasks/TaskModal';
import ContactReassignForm from '../components/admin/ContactReassignForm';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import Button from '../components/common/Button';
import { FaSearch, FaUserEdit, FaFilter } from 'react-icons/fa';
import theme from '../styles/theme';

export default function Contacts() {
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

  // Filtering state - simplified to match Tasks page
  const [filter, setFilter] = useState('all'); // all, followUp, noAnswer, dealClosed, notInterested
  const [searchTerm, setSearchTerm] = useState('');

  // Get user from localStorage
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
  }, []);

  // Fetch contacts based on filters
  useEffect(() => {
    fetchContacts();
  }, [filter]); // Re-fetch when filters change

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Build URL with filter parameters
      let url = '/api/contacts';
      const params = [];

      // Add outcome filter if not "all"
      if (filter !== 'all') {
        // Map filter values to actual outcome strings
        const outcomeMap = {
          followUp: 'Follow Up',
          noAnswer: 'No Answer',
          dealClosed: 'Deal Closed',
          notInterested: 'Not Interested'
        };

        if (outcomeMap[filter]) {
          params.push(`lastCallOutcome=${encodeURIComponent(outcomeMap[filter])}`);
        }
      }

      // Add query params to URL if there are any
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (data.success) {
        setContacts(data.data);
      } else {
        console.error('Error fetching contacts:', data.message);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      setLoading(false);
    }
  };

  // Handle contact status update
  const handleContactUpdate = (updatedContact) => {
    setContacts(prevContacts =>
      prevContacts.map(contact =>
        contact.id === updatedContact.id ? updatedContact : contact
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
        setContacts([data.data, ...contacts]);
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
        // Update the contact in the list
        setContacts(contacts.map(contact =>
          contact.id === data.data.id ? data.data : contact
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
    // Update the contact in the list
    setContacts(contacts.map(contact =>
      contact.id === updatedContact.id ? updatedContact : contact
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

  // Handle opening the edit modal for a contact
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

  // Handle editing a task (Updated)
  const handleEditTask = (task) => {
    // Find the contact associated with this task
    const associatedContact = contacts.find(c => c.id === task.contactId);

    if (!associatedContact) {
      console.error("Could not find contact associated with task:", task);
      alert("Error: Could not find the contact for this task."); // User feedback
      return;
    }

    setSelectedTask({
       ...task,
       // Ensure dueDate is formatted correctly for the modal's input type="datetime-local"
       // Handle cases where dueDate might be null or invalid
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
         // --- Update the task within the specific contact in the state ---
         const updatedTask = data.data;
         setContacts(prevContacts => prevContacts.map(contact => {
           if (contact.id === updatedTask.contactId) {
             return {
               ...contact,
               tasks: contact.tasks.map(task =>
                 task.id === updatedTask.id ? updatedTask : task
               )
             };
           }
           return contact;
         }));
         // --- End of update ---
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
           // Optionally add the new call to the contact's calls array if it exists
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

  // Handle task form submission (Updated)
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

        // --- Update the task list within the relevant contact ---
        setContacts(prevContacts => prevContacts.map(contact => {
          if (contact.id === updatedOrNewTask.contactId) {
            let updatedTasks;
            if (isUpdating) {
              // Map existing tasks, replacing the updated one
              updatedTasks = contact.tasks.map(task =>
                task.id === updatedOrNewTask.id ? updatedOrNewTask : task
              );
            } else {
              // Add the new task to the beginning of the array
              updatedTasks = [updatedOrNewTask, ...(contact.tasks || [])];
            }
            return { ...contact, tasks: updatedTasks };
          }
          return contact;
        }));
        // --- End of update ---

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

  // Filter contacts based on search term
  const filteredContacts = contacts.filter(contact => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        contact.name.toLowerCase().includes(searchLower) ||
        (contact.company && contact.company.toLowerCase().includes(searchLower)) ||
        contact.phone.includes(searchTerm) ||
        (contact.email && contact.email.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });

  // Prepare initial task data for task modal
  const getInitialTaskData = () => {
    // If editing a task, use the selectedTask (which now includes formatted dueDate)
    if (selectedTask) {
      return { ...selectedTask }; // selectedTask already has formatted dueDate from handleEditTask
    }

    // If creating a new task (potentially from a call)
    let initialData = {};
    if (selectedContact) {
      initialData.contactId = selectedContact.id;
    }
    if (selectedCall) {
      initialData.callId = selectedCall.id;
      initialData.title = `Follow up with ${selectedContact?.name || 'contact'}`; // Added safety check
      initialData.description = `Follow-up from call on ${new Date(selectedCall.date).toLocaleDateString()}${selectedCall.notes ? `: ${selectedCall.notes}` : ''}`;
    }
    return initialData;
  };

  // Count contacts by outcome for filtering tabs
  const getContactCounts = () => {
    return {
      all: contacts.length,
      followUp: contacts.filter(c => c.lastCallOutcome === 'Follow Up').length,
      noAnswer: contacts.filter(c => c.lastCallOutcome === 'No Answer').length,
      dealClosed: contacts.filter(c => c.lastCallOutcome === 'Deal Closed').length,
      notInterested: contacts.filter(c => c.lastCallOutcome === 'Not Interested').length
    };
  };

  const contactCounts = getContactCounts();

  // Function to close the Task Modal and reset states (Updated)
  const closeTaskModal = () => {
    setIsTaskModalOpen(false);
    setSelectedTask(null);
    setSelectedContact(null); // Reset selected contact as well
    setSelectedCall(null); // Reset selected call
  };

  return (
    <ProtectedRoute>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1>Contacts</h1>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            tooltip="Create a new contact"
          >
            Add Contact
          </Button>
        </div>

        {/* Improved Filtering System - Styled like Tasks page */}
        <div style={{ marginBottom: '1.5rem' }}>
          {/* Filter Buttons */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}> {/* Added flexWrap here */}
              <Button
                onClick={() => setFilter('all')}
                variant={filter === 'all' ? 'primary' : 'outline'}
                tooltip={`Show all contacts (${contactCounts.all})`}
                size="small" // Making buttons slightly smaller
              >
                All ({contactCounts.all})
              </Button>

              <Button
                onClick={() => setFilter('followUp')}
                variant={filter === 'followUp' ? 'primary' : 'outline'}
                tooltip={`Show contacts with Follow Up outcome (${contactCounts.followUp})`}
                 size="small"
              >
                Follow Up ({contactCounts.followUp})
              </Button>

              <Button
                onClick={() => setFilter('noAnswer')}
                variant={filter === 'noAnswer' ? 'primary' : 'outline'}
                tooltip={`Show contacts with No Answer outcome (${contactCounts.noAnswer})`}
                 size="small"
              >
                No Answer ({contactCounts.noAnswer})
              </Button>

              <Button
                onClick={() => setFilter('dealClosed')}
                variant={filter === 'dealClosed' ? 'primary' : 'outline'}
                tooltip={`Show contacts with Deal Closed outcome (${contactCounts.dealClosed})`}
                 size="small"
              >
                Deal Closed ({contactCounts.dealClosed})
              </Button>

              <Button
                onClick={() => setFilter('notInterested')}
                variant={filter === 'notInterested' ? 'primary' : 'outline'}
                tooltip={`Show contacts with Not Interested outcome (${contactCounts.notInterested})`}
                 size="small"
              >
                Not Interested ({contactCounts.notInterested})
              </Button>
            </div>

            {/* Search Box */}
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center'
            }}>
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: '0.5rem 0.5rem 0.5rem 2rem', // Space for the icon
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  width: '200px' // Slightly reduced width
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
                contact={contact} // Pass the full contact object which now includes updated tasks
                onEditClick={handleOpenEditModal}
                onLogCallClick={handleLogCall}
                onAddTaskClick={handleAddTask}
                onDeleteContact={handleDeleteContact}
                onEditTask={handleEditTask} // Correct handler passed
                onTaskStatusChange={handleTaskStatusChange} // Correct handler passed
                onContactUpdate={handleContactUpdate} // Pass handler to update contact details if needed from ContactCard
                currentUser={user}
                // For admin users, add reassignment option
                onReassignClick={user && user.role === 'admin' ? handleOpenReassignModal : undefined}
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
                : filter !== 'all'
                  ? `No contacts found with the selected filter.`
                  : 'No contacts found. Add your first contact to get started.'}
            </p>
            <Button
              onClick={() => setIsAddModalOpen(true)}
            >
              Add Contact
            </Button>
          </div>
        )}

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

        {/* Task Modal (Updated onClose) */}
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={closeTaskModal} // Use the dedicated close function
          contact={selectedContact} // Pass the associated contact (now set correctly in handleEditTask)
          contacts={contacts} // Pass full contacts list for potential dropdown
          initialData={getInitialTaskData()} // Use the function to get initial/editing data
          onSubmit={handleTaskSubmit} // Use the updated submit handler
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
