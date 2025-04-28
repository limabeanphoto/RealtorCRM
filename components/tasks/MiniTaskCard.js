import BaseCard from '../common/BaseCard';
import Button from '../common/Button';
import theme from '../../styles/theme';
import { FaCheck, FaCalendarAlt, FaPhone, FaEdit, FaTrash } from 'react-icons/fa';

const MiniTaskCard = ({ task, onEditTask, onUpdateStatus, onDeleteTask }) => {
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      timeZone: 'America/Los_Angeles' // Display in Pacific Time
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
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

  const StatusToggle = (
    <div 
      onClick={(e) => {
        e.stopPropagation();
        handleStatusChange(task.id, task.status === 'Completed' ? 'Active' : 'Completed');
      }}
      style={{
        backgroundColor: task.status === 'Completed' ? '#28a745' : 'white',
        border: `2px solid ${task.status === 'Completed' ? '#28a745' : '#ddd'}`,
        width: '24px',
        height: '24px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}
    >
      {task.status === 'Completed' && <FaCheck color="white" size={12} />}
    </div>
  );

  const ButtonGroup = (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginLeft: '0.5rem' }}>
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
    </div>
  );

  const ExpandedContent = (
    <div>
      {/* Status toggle in expanded view */}
      <div style={{ 
        marginTop: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        flexWrap: 'wrap'
      }}>
        <strong>Status:</strong>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {StatusToggle}
          <span>{task.status === 'Completed' ? 'Completed' : 'Active'}</span>
        </div>
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