// pages/calls.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import CallModal from '../components/calls/CallModal';
import CallCard from '../components/calls/CallCard';
import TaskModal from '../components/tasks/TaskModal';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import Button from '../components/common/Button';
import { FaSearch, FaFilter } from 'react-icons/fa';
import theme from '../styles/theme';

export default function Calls() {
  const router = useRouter();
  const [calls, setCalls] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [selectedCall, setSelectedCall] = useState(null);
  
  // Added for filtering calls
  const [filter, setFilter] = useState('all'); // all, deals, recent
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fetch calls and contacts
  useEffect(() => {
    fetchData();
  }, [filter]);

  // Function to refresh dashboard metrics after logging a call or deal
  const refreshDashboardMetrics = () => {
    // Get the DashboardSummary component from localStorage if it exists
    const dashboardComponent = window.localStorage.getItem('dashboardComponent');
    
    if (dashboardComponent) {
      // Call the refreshMetrics function if it exists
      if (typeof dashboardComponent.refreshMetrics === 'function') {
        dashboardComponent.refreshMetrics();
      }
    } else {
      // Alternative approach: refresh dashboard page if user is on dashboard
      if (router.pathname === '/' || router.pathname === '/dashboard') {
        router.reload();
      }
    }
    
    // For a more robust solution, we can use a custom event
    // that the dashboard component listens for
    const refreshEvent = new CustomEvent('refreshDashboardMetrics');
    window.dispatchEvent(refreshEvent);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Build URL with filter parameters (in a real implementation, 
      // you might add query params to the API to filter on the server side)
      let url = '/api/calls';
      
      // Fetch calls
      const callsResponse = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const callsData = await callsResponse.json();
      
      // Fetch contacts for the dropdown
      const contactsResponse = await fetch('/api/contacts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const contactsData = await contactsResponse.json();
      
      if (callsData.success) {
        // Filter calls based on the selected filter (client-side for now)
        let filteredCalls = callsData.data;
        
        if (filter === 'deals') {
          filteredCalls = filteredCalls.filter(call => call.isDeal);
        } else if (filter === 'recent') {
          // Get calls from the last 7 days
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          filteredCalls = filteredCalls.filter(call => new Date(call.date) >= oneWeekAgo);
        }
        
        setCalls(filteredCalls);
      } else {
        console.error('Error fetching calls:', callsData.message);
      }
      
      if (contactsData.success) {
        setContacts(contactsData.data);
      } else {
        console.error('Error fetching contacts:', contactsData.message);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };
  
  // Handle creating a new call
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
        // Add the new call to the list if it matches current filter
        if (filter === 'all' || 
            (filter === 'deals' && data.data.isDeal) ||
            (filter === 'recent')) { // New calls are always recent
          setCalls([data.data, ...calls]);
        }
        
        // Refresh dashboard metrics after logging a call
        refreshDashboardMetrics();
        
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

  // Handle editing a call
  const handleEditCall = async (formData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/calls/${formData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update the call in the list
        setCalls(calls.map(call => 
          call.id === data.data.id ? data.data : call
        ));
        
        // Refresh dashboard metrics after updating a call
        refreshDashboardMetrics();
        
        return { success: true, data: data.data };
      } else {
        alert('Error updating call: ' + data.message);
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Error updating call:', error);
      alert('Error updating call');
      return { success: false, message: error.message };
    }
  };

  // Handle deleting a call
  const handleDeleteCall = async (callId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/calls/${callId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Remove the call from the list
        setCalls(calls.filter(call => call.id !== callId));
        
        // Refresh dashboard metrics after deleting a call
        refreshDashboardMetrics();
        
      } else {
        alert('Error deleting call: ' + data.message);
      }
    } catch (error) {
      console.error('Error deleting call:', error);
      alert('Error deleting call');
    }
  };

  // Open modal to select a contact
  const handleNewCall = () => {
    setSelectedContact(null); // Clear any selected contact first
    setIsCallModalOpen(true);
  };

  // Handle opening the edit modal
  const handleOpenEditModal = (call) => {
    setSelectedCall(call);
    setIsEditModalOpen(true);
  };

  // Handle opening task modal for a call
  const handleAddTask = (call) => {
    setSelectedCall(call);
    setIsTaskModalOpen(true);
  };

  // Handle contact selection for new call
  const handleContactSelect = (e) => {
    const contactId = e.target.value;
    
    if (contactId) {
      const contact = contacts.find(c => c.id === contactId);
      setSelectedContact(contact);
    } else {
      setSelectedContact(null);
    }
  };
  
  // Handle task submission
  const handleTaskSubmit = async (formData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Task created successfully');
        return { success: true, data: data.data };
      } else {
        alert('Error creating task: ' + data.message);
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Error creating task');
      return { success: false, message: error.message };
    }
  };
  
  // Get counts for filters
  const getCounts = () => {
    const allCount = calls.length;
    const dealsCount = calls.filter(call => call.isDeal).length;
    
    // Count calls from the last 7 days
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const recentCount = calls.filter(call => new Date(call.date) >= oneWeekAgo).length;
    
    return {
      all: allCount,
      deals: dealsCount,
      recent: recentCount
    };
  };
  
  const counts = getCounts();
  
  // Filter calls based on search term
  const filteredCalls = calls.filter(call => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        call.contact.name.toLowerCase().includes(searchLower) ||
        (call.contact.company && call.contact.company.toLowerCase().includes(searchLower)) ||
        call.notes?.toLowerCase().includes(searchLower) ||
        call.outcome.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });
  
  return (
    <ProtectedRoute>
      <div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '1.5rem'
        }}>
          <h1>Calls</h1>
          <Button 
            onClick={handleNewCall}
            tooltip="Open the form to log a new call"
          >
            Log New Call
          </Button>
        </div>
        
        {/* Filters and Search - Updated to match Tasks and Contacts pages */}
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          justifyContent: 'space-between', 
          gap: '1rem', 
          marginBottom: '1.5rem' 
        }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button
              onClick={() => setFilter('all')}
              variant={filter === 'all' ? 'primary' : 'outline'}
              tooltip={`Show all recorded calls (${counts.all})`}
            >
              All Calls ({counts.all})
            </Button>
            
            <Button
              onClick={() => setFilter('deals')}
              variant={filter === 'deals' ? 'primary' : 'outline'}
              tooltip={`Show only calls marked as deals (${counts.deals})`}
            >
              Deals ({counts.deals})
            </Button>
            
            <Button
              onClick={() => setFilter('recent')}
              variant={filter === 'recent' ? 'primary' : 'outline'}
              tooltip={`Show calls from the last 7 days (${counts.recent})`}
            >
              Recent ({counts.recent})
            </Button>
          </div>
          
          <div style={{ 
            position: 'relative',
            display: 'flex',
            alignItems: 'center'
          }}>
            <input
              type="text"
              placeholder="Search calls..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '0.5rem 0.5rem 0.5rem 2rem', // Space for the icon
                borderRadius: '4px',
                border: '1px solid #ddd',
                width: '250px' // Fixed width matching other pages
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
        
        {/* Call Cards List */}
        {loading ? (
          <p>Loading calls...</p>
        ) : filteredCalls.length > 0 ? (
          <div>
            {filteredCalls.map(call => (
              <CallCard
                key={call.id}
                call={call}
                onEditClick={handleOpenEditModal}
                onDeleteClick={handleDeleteCall}
                onAddTaskClick={handleAddTask}
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
                ? 'No calls found matching your search.' 
                : 'No calls recorded yet. Log your first call to get started.'}
            </p>
            <Button
              onClick={handleNewCall}
              tooltip="Open the form to log your first call"
            >
              Log New Call
            </Button>
          </div>
        )}

        {/* New Call Modal */}
        <CallModal
          isOpen={isCallModalOpen}
          onClose={() => {
            setIsCallModalOpen(false);
            setSelectedContact(null); // Clear selected contact on close
          }}
          contact={selectedContact} // Pass selected contact
          contacts={contacts} // Pass full contact list
          onContactSelect={handleContactSelect} // Pass handler for selection
          onSubmit={handleCallSubmit}
          onMetricsUpdate={refreshDashboardMetrics} // Pass refresh function
          mode="new"
        />

        {/* Edit Call Modal */}
        <CallModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          call={selectedCall}
          contacts={contacts} // Pass contacts for editing too
          onSubmit={handleEditCall}
          onMetricsUpdate={refreshDashboardMetrics} // Pass refresh function
          mode="edit"
        />

        {/* Task Modal for Call Follow-up */}
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          contact={selectedCall?.contact}
          contacts={contacts}
          initialData={{
            contactId: selectedCall?.contact?.id,
            callId: selectedCall?.id,
            title: selectedCall ? `Follow up with ${selectedCall.contact.name}` : '',
            description: selectedCall ? `Follow-up from call on ${new Date(selectedCall.date).toLocaleDateString()}${selectedCall.notes ? `: ${selectedCall.notes}` : ''}` : '',
          }}
          onSubmit={handleTaskSubmit}
        />
      </div>
    </ProtectedRoute>
  );
}