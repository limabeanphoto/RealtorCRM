// components/dashboard/TasksSummary.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FaTasks, FaClock, FaExclamationTriangle, FaCheck, FaChevronRight } from 'react-icons/fa';
import theme from '../../styles/theme';
import Button from '../common/Button';

export default function TasksSummary({ animationDelay = 0 }) {
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  
  // Fetch tasks data
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.error('No authentication token found');
          setLoading(false);
          return;
        }
        
        // Get today's date
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];
        
        // Fetch tasks due today or overdue and not yet completed
        const response = await fetch('/api/tasks', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (data.success) {
          // Filter for incomplete tasks that are due today or overdue
          const now = new Date();
          
          const filteredTasks = data.data
            .filter(task => {
              // Check if task is not completed
              if (task.status === 'Completed') return false;
              
              // Parse task due date
              const dueDate = new Date(task.dueDate);
              
              // Check if due date is today or in the past
              return dueDate <= now;
            })
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
            .slice(0, 3); // Get only top 3 most urgent tasks
          
          setTasks(filteredTasks);
        } else {
          console.error('Error fetching tasks:', data.message);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        setLoading(false);
      }
    };
    
    fetchTasks();
    
    // Animation timer
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, animationDelay * 1000);
    
    return () => clearTimeout(timer);
  }, [animationDelay]);
  
  // Format date for display
  const formatDate = (dateString) => {
    const options = { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return new Date(dateString).toLocaleString(undefined, options);
  };
  
  // Get time status (overdue, due today, etc.)
  const getTimeStatus = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due - now;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffTime < 0) {
      return { text: 'Overdue', style: { color: '#dc3545' } };
    } else if (diffDays === 0) {
      return { text: 'Due today', style: { color: '#ffc107' } };
    } else {
      return { text: `Due in ${diffDays} days`, style: { color: theme.colors.brand.text } };
    }
  };
  
  // Count overdue tasks
  const overdueCount = tasks.filter(task => {
    const now = new Date();
    const due = new Date(task.dueDate);
    return due < now;
  }).length;
  
  // Navigate to tasks page
  const handleViewAllTasks = () => {
    router.push('/tasks');
  };
  
  // Handle task completion
  const handleCompleteTask = async (taskId) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'Completed',
          completed: true
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Remove the completed task from the list
        setTasks(tasks.filter(task => task.id !== taskId));
      } else {
        console.error('Error completing task:', data.message);
      }
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };
  
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: theme.borderRadius.md,
      padding: '1.5rem',
      boxShadow: theme.shadows.sm,
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
      transition: `opacity 0.5s ease, transform 0.5s ease`,
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1rem' 
      }}>
        <h3 style={{ 
          margin: 0, 
          color: theme.colors.brand.primary,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <FaTasks />
          Tasks Due
          {overdueCount > 0 && (
            <span style={{
              backgroundColor: '#dc3545',
              color: 'white',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8rem',
            }}>
              {overdueCount}
            </span>
          )}
        </h3>
      </div>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '1rem' }}>
          Loading tasks...
        </div>
      ) : tasks.length > 0 ? (
        <div>
          {tasks.map((task, index) => {
            const timeStatus = getTimeStatus(task.dueDate);
            
            return (
              <div 
                key={task.id}
                style={{
                  padding: '0.75rem',
                  borderBottom: index < tasks.length - 1 ? '1px solid #f0f0f0' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
                  transition: `opacity 0.5s ease ${animationDelay + 0.2 + (index * 0.1)}s, transform 0.5s ease ${animationDelay + 0.2 + (index * 0.1)}s`,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                    {task.title}
                  </div>
                  <div style={{ 
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      ...timeStatus.style
                    }}>
                      <FaClock size={12} />
                      {timeStatus.text}
                    </span>
                    <span style={{ color: theme.colors.brand.text }}>
                      {formatDate(task.dueDate)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleCompleteTask(task.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#f0f0f0',
                    color: theme.colors.brand.primary,
                    fontSize: '1rem',
                  }}
                  title="Mark as completed"
                >
                  <FaCheck size={14} />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ 
          textAlign: 'center', 
          padding: '1rem', 
          color: theme.colors.brand.text 
        }}>
          No tasks due today. Great job!
        </div>
      )}
      
      <div style={{ 
        textAlign: 'center', 
        marginTop: '1rem',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
        transition: `opacity 0.5s ease ${animationDelay + 0.7}s, transform 0.5s ease ${animationDelay + 0.7}s`,
      }}>
        <Button
          onClick={handleViewAllTasks}
          variant="primary"
          size="small"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          View All Tasks <FaChevronRight size={12} />
        </Button>
      </div>
    </div>
  );
}