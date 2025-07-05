import React, { useState, useEffect } from 'react';
import { FaList, FaTh, FaPlus, FaFilter, FaSort } from 'react-icons/fa';
import TaskBoardColumn from './TaskBoardColumn';
import TaskViewToggle from './TaskViewToggle';
import MiniTaskCard from './MiniTaskCard';
import Button from '../common/Button';
import theme from '../../styles/theme';

const TaskBoard = ({ 
  tasks = [], 
  onTaskUpdate, 
  onTaskCreate, 
  onTaskEdit, 
  onTaskDelete,
  viewMode = 'board', 
  onViewModeChange,
  loading = false,
  className = '',
  showFilters = true,
  showSort = true,
  showCreateButton = true
}) => {
  const [filteredTasks, setFilteredTasks] = useState(tasks);
  const [sortBy, setSortBy] = useState('dueDate');
  const [sortOrder, setSortOrder] = useState('asc');
  const [statusFilter, setStatusFilter] = useState('all');
  const [draggedTask, setDraggedTask] = useState(null);
  const [isClient, setIsClient] = useState(false);

  // Client-side rendering check
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Define board columns
  const columns = [
    { 
      id: 'backlog', 
      title: 'Backlog', 
      color: theme.colors.neutral[400],
      bgColor: theme.colors.neutral[50],
      filterFn: (task) => task.status === 'Active' && !isTaskToday(task) && !isTaskTomorrow(task) && !isTaskOverdue(task)
    },
    { 
      id: 'today', 
      title: 'Today', 
      color: theme.colors.warning[500],
      bgColor: theme.colors.warning[50],
      filterFn: (task) => task.status === 'Active' && isTaskToday(task)
    },
    { 
      id: 'tomorrow', 
      title: 'Tomorrow', 
      color: theme.colors.info[500],
      bgColor: theme.colors.info[50],
      filterFn: (task) => task.status === 'Active' && isTaskTomorrow(task)
    },
    { 
      id: 'overdue', 
      title: 'Overdue', 
      color: theme.colors.error[500],
      bgColor: theme.colors.error[50],
      filterFn: (task) => task.status === 'Active' && isTaskOverdue(task)
    },
    { 
      id: 'completed', 
      title: 'Completed', 
      color: theme.colors.success[500],
      bgColor: theme.colors.success[50],
      filterFn: (task) => task.status === 'Completed'
    }
  ];

  // Helper functions for date categorization
  const isTaskToday = (task) => {
    if (!task.dueDate) return false;
    const today = new Date();
    const taskDate = new Date(task.dueDate);
    return taskDate.toDateString() === today.toDateString();
  };

  const isTaskTomorrow = (task) => {
    if (!task.dueDate) return false;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const taskDate = new Date(task.dueDate);
    return taskDate.toDateString() === tomorrow.toDateString();
  };

  const isTaskOverdue = (task) => {
    if (!task.dueDate) return false;
    const today = new Date();
    const taskDate = new Date(task.dueDate);
    return taskDate < today && taskDate.toDateString() !== today.toDateString();
  };

  // Filter and sort tasks
  useEffect(() => {
    let filtered = [...tasks];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    // Sort tasks
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'dueDate') {
        aValue = new Date(aValue || '9999-12-31');
        bValue = new Date(bValue || '9999-12-31');
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredTasks(filtered);
  }, [tasks, statusFilter, sortBy, sortOrder]);

  // Handle drag and drop
  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, columnId) => {
    e.preventDefault();
    
    if (!draggedTask) return;

    // Calculate new status based on column
    let newStatus = draggedTask.status;
    let newDueDate = draggedTask.dueDate;

    switch (columnId) {
      case 'today':
        newStatus = 'Active';
        newDueDate = new Date().toISOString().split('T')[0];
        break;
      case 'tomorrow':
        newStatus = 'Active';
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        newDueDate = tomorrow.toISOString().split('T')[0];
        break;
      case 'completed':
        newStatus = 'Completed';
        break;
      case 'backlog':
      case 'overdue':
        newStatus = 'Active';
        break;
      default:
        break;
    }

    // Only update if there's a change
    if (newStatus !== draggedTask.status || newDueDate !== draggedTask.dueDate) {
      onTaskUpdate(draggedTask.id, { 
        status: newStatus, 
        dueDate: newDueDate 
      });
    }

    setDraggedTask(null);
  };

  // Handle task status change
  const handleTaskStatusChange = (taskId, newStatus) => {
    onTaskUpdate(taskId, { status: newStatus });
  };

  // Get tasks for a specific column
  const getColumnTasks = (column) => {
    return filteredTasks.filter(column.filterFn);
  };

  // Loading state
  if (loading) {
    return (
      <div className="task-board-loading">
        <div className="loading-spinner"></div>
        <p>Loading tasks...</p>
      </div>
    );
  }

  // Only render on client side to avoid hydration issues
  if (!isClient) {
    return null;
  }

  return (
    <div className={`task-board ${className}`}>
      <style jsx>{`
        .task-board {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          container-type: inline-size;
        }

        .task-board-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
          padding: 1rem 0;
          border-bottom: 1px solid ${theme.colors.neutral[200]};
        }

        .task-board-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: ${theme.colors.neutral[900]};
          margin: 0;
        }

        .task-board-controls {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .task-board-filters {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .task-board-filter {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.5rem 0.75rem;
          border: 1px solid ${theme.colors.neutral[300]};
          border-radius: ${theme.borderRadius.md};
          background: white;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .task-board-filter:hover {
          border-color: ${theme.colors.brand.primary};
          background: ${theme.colors.brand.primary}05;
        }

        .task-board-filter select {
          border: none;
          background: transparent;
          outline: none;
          cursor: pointer;
          font-size: 0.875rem;
          color: ${theme.colors.neutral[700]};
        }

        .task-board-content {
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .task-board-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 1rem;
          height: 100%;
          overflow-x: auto;
          padding: 0.5rem 0;
        }

        .task-list-view {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding: 1rem 0;
        }

        .task-board-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 200px;
          color: ${theme.colors.neutral[600]};
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid ${theme.colors.neutral[200]};
          border-top: 3px solid ${theme.colors.brand.primary};
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Responsive behavior */
        @container (max-width: 768px) {
          .task-board-grid {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }
          
          .task-board-header {
            flex-direction: column;
            align-items: stretch;
          }
          
          .task-board-controls {
            justify-content: space-between;
          }
        }

        @container (max-width: 1024px) {
          .task-board-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @container (max-width: 1200px) {
          .task-board-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        /* Accessibility */
        @media (prefers-reduced-motion: reduce) {
          .loading-spinner {
            animation: none;
          }
        }
      `}</style>

      {/* Header */}
      <div className="task-board-header">
        <h2 className="task-board-title">Task Board</h2>
        
        <div className="task-board-controls">
          {/* View Toggle */}
          <TaskViewToggle 
            viewMode={viewMode} 
            onViewModeChange={onViewModeChange}
          />

          {/* Filters */}
          {showFilters && (
            <div className="task-board-filters">
              <div className="task-board-filter">
                <FaFilter size={12} />
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                  aria-label="Filter by status"
                >
                  <option value="all">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              {/* Sort */}
              {showSort && (
                <div className="task-board-filter">
                  <FaSort size={12} />
                  <select 
                    value={`${sortBy}-${sortOrder}`} 
                    onChange={(e) => {
                      const [field, order] = e.target.value.split('-');
                      setSortBy(field);
                      setSortOrder(order);
                    }}
                    aria-label="Sort tasks"
                  >
                    <option value="dueDate-asc">Due Date (Early)</option>
                    <option value="dueDate-desc">Due Date (Late)</option>
                    <option value="title-asc">Title (A-Z)</option>
                    <option value="title-desc">Title (Z-A)</option>
                    <option value="createdAt-desc">Created (Recent)</option>
                    <option value="createdAt-asc">Created (Oldest)</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Create Button */}
          {showCreateButton && onTaskCreate && (
            <Button
              onClick={onTaskCreate}
              variant="primary"
              size="medium"
              icon={<FaPlus size={14} />}
              tooltip="Create new task"
            >
              New Task
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="task-board-content">
        {viewMode === 'board' ? (
          <div className="task-board-grid">
            {columns.map((column) => (
              <TaskBoardColumn
                key={column.id}
                column={column}
                tasks={getColumnTasks(column)}
                onTaskEdit={onTaskEdit}
                onTaskStatusChange={handleTaskStatusChange}
                onTaskDelete={onTaskDelete}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
                onDragStart={handleDragStart}
              />
            ))}
          </div>
        ) : (
          <div className="task-list-view">
            {filteredTasks.map((task) => (
              <MiniTaskCard
                key={task.id}
                task={task}
                onEditTask={onTaskEdit}
                onStatusChange={handleTaskStatusChange}
                onDeleteTask={onTaskDelete}
              />
            ))}
            {filteredTasks.length === 0 && (
              <div style={{ 
                textAlign: 'center', 
                padding: '2rem', 
                color: theme.colors.neutral[500] 
              }}>
                No tasks found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskBoard;