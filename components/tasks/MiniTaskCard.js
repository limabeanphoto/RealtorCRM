import BaseCard from '../common/BaseCard';
import Button from '../common/Button';
import theme from '../../styles/theme';
import { FaCheck, FaCalendarAlt, FaPhone, FaEdit, FaTrash } from 'react-icons/fa';

const MiniTaskCard = ({ task, onEditTask, onUpdateStatus, onDeleteTask }) => {
  const getPriorityColor = (priority) => {
    const colors = {
      'High': '#e74c3c',
      'Medium': '#f39c12',
      'Low': '#3498db'
    };
    
    // Default to Low if priority is not defined
    return colors[priority] || colors['Low'];
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const isDueSoon = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const daysDiff = (due - now) / (1000 * 60 * 60 * 24);
    return daysDiff <= 2 && daysDiff >= 0;
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return '#28a745';
      case 'Active': return '#007bff';
      default: return '#6c757d';
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    if (onUpdateStatus) {
      const result = await onUpdateStatus(taskId, newStatus);
      // The parent component (ContactTable) will handle refreshing the data
      return result;
    }
  };

  const handleDelete = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      if (onDeleteTask) {
        await onDeleteTask(taskId);
      }
    }
  };

  // Styles for task card elements
  const HeaderContent = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
          {task.title}
        </div>
      </div>
      {/* High Priority Badge shown in header */}
      {task.priority === 'High' && (
        <span style={{
          backgroundColor: getPriorityColor(task.priority),
          color: 'white',
          padding: '0.2rem 0.5rem',
          borderRadius: '4px',
          fontSize: '0.75rem',
          fontWeight: '500',
          marginLeft: '0.5rem'
        }}>
          {task.priority}
        </span>
      )}
    </div>
  );

  const SubtitleContent = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
      <FaCalendarAlt />
      <span>Due: {formatDate(task.dueDate)}</span>
      {isDueSoon(task.dueDate) && !isOverdue(task.dueDate) && (
        <span style={{ 
          backgroundColor: '#fff3cd', 
          color: '#856404', 
          padding: '2px 6px', 
          borderRadius: '4px',
          fontSize: '0.75rem',
          fontWeight: 'bold'
        }}>
          Due Soon!
        </span>
      )}
      {isOverdue(task.dueDate) && (
        <span style={{ 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          padding: '2px 6px', 
          borderRadius: '4px',
          fontSize: '0.75rem',
          fontWeight: 'bold'
        }}>
          Overdue
        </span>
      )}
    </div>
  );

  const StatusDropdown = (
    <select
      value={task.status}
      onChange={(e) => {
        e.stopPropagation();
        handleStatusChange(task.id, e.target.value);
      }}
      style={{
        backgroundColor: getStatusColor(task.status),
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        padding: '0.25rem 0.5rem',
        fontSize: '0.8rem',
        cursor: 'pointer',
        fontWeight: 'bold',
        margin: '0.25rem 0'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <option value="Active">Active</option>
      <option value="Completed">Completed</option>
    </select>
  );

  const ButtonGroup = (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginLeft: '0.5rem' }}>
      <ButtonGroup>
        {/* Edit Button */}
        <Button 
          onClick={(e) => {
            e.stopPropagation();
            onEditTask(task);
          }}
          variant="outline"
          size="small"
          title="Edit task"
          style={{ borderRadius: '4px', padding: '0.25rem 0.5rem' }}
        >
          <FaEdit />
          <span style={{ marginLeft: '0.25rem' }}>Edit</span>
        </Button>
      </ButtonGroup>
    </div>
  );

  const ExpandedContent = (
    <div>
      {/* Status dropdown in expanded view */}
      <div style={{ 
        marginTop: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        flexWrap: 'wrap'
      }}>
        <strong>Current Status:</strong> {StatusDropdown}
      </div>

      {/* Description section */}
      {task.description && (
        <div style={{ marginTop: '1rem' }}>
          <strong>Description:</strong>
          <p style={{ margin: '0.5rem 0' }}>{task.description}</p>
        </div>
      )}

      {/* Created and Due Date information */}
      <div style={{ 
        marginTop: '1rem',
        padding: '0.5rem',
        backgroundColor: theme.colors.brand.background,
        borderRadius: '4px'
      }}>
        <div style={{ fontSize: '0.85rem', marginBottom: '0.3rem' }}>
          <strong>Created:</strong> {formatDate(task.createdAt)}
        </div>
        <div style={{ fontSize: '0.85rem' }}>
          <strong>Due:</strong> {formatDate(task.dueDate)}
          {isDueSoon(task.dueDate) && !isOverdue(task.dueDate) && (
            <span style={{ 
              marginLeft: '0.5rem',
              backgroundColor: '#fff3cd', 
              color: '#856404', 
              padding: '2px 6px', 
              borderRadius: '4px'
            }}>
              Due Soon!
            </span>
          )}
          {isOverdue(task.dueDate) && (
            <span style={{ 
              marginLeft: '0.5rem',
              backgroundColor: '#f8d7da', 
              color: '#721c24', 
              padding: '2px 6px', 
              borderRadius: '4px'
            }}>
              Overdue
            </span>
          )}
        </div>
      </div>

      {/* Priority section */}
      <div style={{ 
        marginTop: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <strong>Priority:</strong>
        <span style={{
          backgroundColor: getPriorityColor(task.priority),
          color: 'white',
          padding: '0.2rem 0.5rem',
          borderRadius: '4px',
          fontSize: '0.85rem',
          fontWeight: '500'
        }}>
          {task.priority}
        </span>
      </div>

      {/* If this task is linked to a call */}
      {task.call && (
        <div style={{ 
          marginTop: '1rem',
          padding: '0.75rem',
          backgroundColor: '#e8f4fd',
          borderRadius: theme.borderRadius.sm,
          border: '1px solid #b8daff'
        }}>
          <h4 style={{ 
            margin: '0 0 0.5rem 0', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            color: '#004085'
          }}>
            <FaPhone /> Related Call
          </h4>
          <div style={{ fontSize: '0.9rem', color: '#004085' }}>
            <div>
              <strong>Date:</strong> {formatDate(task.call.date)}
            </div>
            <div>
              <strong>Outcome:</strong> {task.call.outcome}
            </div>
            {task.call.notes && (
              <div style={{ marginTop: '0.25rem' }}>
                <strong>Notes:</strong> {task.call.notes}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Task Completion info */}
      {task.completed && task.completedAt && (
        <div style={{ 
          marginTop: '1rem',
          color: '#28a745',
          fontSize: '0.85rem'
        }}>
          <FaCheck style={{ marginRight: '0.5rem' }} />
          Completed on {formatDate(task.completedAt)}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ 
        marginTop: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTop: '1px solid #eee',
        paddingTop: '1rem'
      }}>
        <Button 
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(task.id);
          }}
          variant="outline"
          size="small"
          title="Delete task"
          style={{ 
            color: '#dc3545', 
            borderColor: '#dc3545',
            padding: '0.25rem 0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}
        >
          <FaTrash />
          <span>Delete Task</span>
        </Button>
        
        <Button 
          onClick={(e) => {
            e.stopPropagation();
            onEditTask(task);
          }}
          variant="primary"
          size="small"
          title="Edit task details"
          style={{ 
            padding: '0.25rem 0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}
        >
          <FaEdit />
          <span>Edit Details</span>
        </Button>
      </div>
    </div>
  );

  return (
    <BaseCard
      title={HeaderContent}
      subtitle={SubtitleContent}
      actions={ButtonGroup}
      expandedContent={ExpandedContent}
      accentColor={getStatusColor(task.status)}
      style={{
        width: '90%',
        margin: '0.5rem auto',
        border: isOverdue(task.dueDate) ? '2px solid #f8d7da' : 
                isDueSoon(task.dueDate) ? '2px solid #fff3cd' : '1px solid #e2e8f0',
        backgroundColor: isOverdue(task.dueDate) ? '#fff5f5' : 
                        isDueSoon(task.dueDate) ? '#fffdf0' : 'white'
      }}
    />
  );
};

export default MiniTaskCard;  