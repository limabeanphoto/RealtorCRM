// Task Priority Management Utility
// Centralizes task priority and status definitions, styling, and business logic

import { FaExclamationTriangle, FaMinus, FaChevronDown, FaClock, FaExclamationCircle, FaCalendarCheck, FaCalendarAlt, FaCheck, FaHourglassHalf } from 'react-icons/fa';
import theme from '../styles/theme';

// Task Priority Definitions
export const TASK_PRIORITIES = {
  'high': {
    id: 'high',
    label: 'High',
    description: 'Urgent task requiring immediate attention',
    color: theme.colors.error[500],
    backgroundColor: theme.colors.error[50],
    borderColor: theme.colors.error[200],
    darkColor: theme.colors.error[400],
    darkBackgroundColor: theme.colors.error[900],
    icon: FaExclamationTriangle,
    weight: 3,
    defaultDueOffset: 1 // 1 day
  },
  'medium': {
    id: 'medium',
    label: 'Medium',
    description: 'Important task with moderate urgency',
    color: theme.colors.warning[500],
    backgroundColor: theme.colors.warning[50],
    borderColor: theme.colors.warning[200],
    darkColor: theme.colors.warning[400],
    darkBackgroundColor: theme.colors.warning[900],
    icon: FaMinus,
    weight: 2,
    defaultDueOffset: 3 // 3 days
  },
  'low': {
    id: 'low',
    label: 'Low',
    description: 'Task with flexible timing',
    color: theme.colors.success[500],
    backgroundColor: theme.colors.success[50],
    borderColor: theme.colors.success[200],
    darkColor: theme.colors.success[400],
    darkBackgroundColor: theme.colors.success[900],
    icon: FaChevronDown,
    weight: 1,
    defaultDueOffset: 7 // 7 days
  }
};

// Task Status Definitions (based on due date and completion)
export const TASK_STATUSES = {
  'overdue': {
    id: 'overdue',
    label: 'Overdue',
    description: 'Task is past due date',
    color: theme.colors.error[600],
    backgroundColor: theme.colors.error[50],
    borderColor: theme.colors.error[200],
    darkColor: theme.colors.error[400],
    darkBackgroundColor: theme.colors.error[900],
    icon: FaExclamationCircle,
    priority: 4,
    requiresAction: true
  },
  'due-today': {
    id: 'due_today',
    label: 'Due Today',
    description: 'Task is due today',
    color: theme.colors.warning[600],
    backgroundColor: theme.colors.warning[50],
    borderColor: theme.colors.warning[200],
    darkColor: theme.colors.warning[400],
    darkBackgroundColor: theme.colors.warning[900],
    icon: FaExclamationTriangle,
    priority: 3,
    requiresAction: true
  },
  'upcoming': {
    id: 'upcoming',
    label: 'Upcoming',
    description: 'Task is due soon',
    color: theme.colors.info[500],
    backgroundColor: theme.colors.info[50],
    borderColor: theme.colors.info[200],
    darkColor: theme.colors.info[400],
    darkBackgroundColor: theme.colors.info[900],
    icon: FaClock,
    priority: 2,
    requiresAction: false
  },
  'future': {
    id: 'future',
    label: 'Future',
    description: 'Task is due in the future',
    color: theme.colors.neutral[500],
    backgroundColor: theme.colors.neutral[50],
    borderColor: theme.colors.neutral[200],
    darkColor: theme.colors.neutral[400],
    darkBackgroundColor: theme.colors.neutral[800],
    icon: FaCalendarAlt,
    priority: 1,
    requiresAction: false
  },
  'completed': {
    id: 'completed',
    label: 'Completed',
    description: 'Task has been completed',
    color: theme.colors.success[500],
    backgroundColor: theme.colors.success[50],
    borderColor: theme.colors.success[200],
    darkColor: theme.colors.success[400],
    darkBackgroundColor: theme.colors.success[900],
    icon: FaCheck,
    priority: 0,
    requiresAction: false
  },
  'no-due-date': {
    id: 'no_due_date',
    label: 'No Due Date',
    description: 'Task has no specified due date',
    color: theme.colors.info[500],
    backgroundColor: theme.colors.info[50],
    borderColor: theme.colors.info[200],
    darkColor: theme.colors.info[400],
    darkBackgroundColor: theme.colors.info[900],
    icon: FaHourglassHalf,
    priority: 1,
    requiresAction: false
  }
};

// Helper Functions
export const getPriorityConfig = (priority) => {
  return TASK_PRIORITIES[priority] || {
    id: 'unknown',
    label: priority || 'Unknown',
    description: 'Unknown priority',
    color: theme.colors.neutral[500],
    backgroundColor: theme.colors.neutral[50],
    borderColor: theme.colors.neutral[200],
    darkColor: theme.colors.neutral[400],
    darkBackgroundColor: theme.colors.neutral[800],
    icon: FaMinus,
    weight: 0,
    defaultDueOffset: 7
  };
};

export const getTaskStatusConfig = (status) => {
  return TASK_STATUSES[status] || {
    id: 'unknown',
    label: status || 'Unknown',
    description: 'Unknown status',
    color: theme.colors.neutral[500],
    backgroundColor: theme.colors.neutral[50],
    borderColor: theme.colors.neutral[200],
    darkColor: theme.colors.neutral[400],
    darkBackgroundColor: theme.colors.neutral[800],
    icon: FaClock,
    priority: 0,
    requiresAction: false
  };
};

// Calculate task status based on due date and completion
export const calculateTaskStatus = (task) => {
  if (!task) return 'unknown';
  
  // Check if task is completed
  if (task.completed || task.status === 'Completed') {
    return 'completed';
  }
  
  // Check if task has no due date
  if (!task.dueDate) {
    return 'no-due-date';
  }
  
  const now = new Date();
  const dueDate = new Date(task.dueDate);
  const diffTime = dueDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffTime < 0) {
    return 'overdue';
  } else if (diffDays <= 0) {
    return 'due-today';
  } else if (diffDays <= 3) {
    return 'upcoming';
  } else {
    return 'future';
  }
};

// Get priority styles for consistent theming
export const getPriorityStyles = (priority, variant = 'badge') => {
  const config = getPriorityConfig(priority);
  
  const baseStyles = {
    color: config.color,
    backgroundColor: config.backgroundColor,
    borderColor: config.borderColor,
  };

  switch (variant) {
    case 'badge':
      return {
        ...baseStyles,
        padding: '0.25rem 0.5rem',
        borderRadius: theme.borderRadius.sm,
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.medium,
        border: `1px solid ${config.borderColor}`,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem'
      };
    case 'indicator':
      return {
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        backgroundColor: config.color,
        display: 'inline-block',
        marginRight: '0.5rem'
      };
    case 'button':
      return {
        ...baseStyles,
        padding: '0.375rem 0.75rem',
        borderRadius: theme.borderRadius.md,
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.medium,
        border: `1px solid ${config.borderColor}`,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        ':hover': {
          backgroundColor: config.color,
          color: 'white',
          transform: 'translateY(-1px)'
        }
      };
    case 'dropdown':
      return {
        ...baseStyles,
        padding: '0.5rem 0.75rem',
        borderRadius: theme.borderRadius.md,
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.normal,
        border: `1px solid ${config.borderColor}`,
        minWidth: '100px',
        cursor: 'pointer'
      };
    default:
      return baseStyles;
  }
};

// Get task status styles
export const getTaskStatusStyles = (status, variant = 'badge') => {
  const config = getTaskStatusConfig(status);
  
  const baseStyles = {
    color: config.color,
    backgroundColor: config.backgroundColor,
    borderColor: config.borderColor,
  };

  switch (variant) {
    case 'badge':
      return {
        ...baseStyles,
        padding: '0.25rem 0.5rem',
        borderRadius: theme.borderRadius.sm,
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.medium,
        border: `1px solid ${config.borderColor}`,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem'
      };
    case 'compact':
      return {
        ...baseStyles,
        padding: '0.125rem 0.25rem',
        borderRadius: theme.borderRadius.sm,
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.medium,
        border: `1px solid ${config.borderColor}`,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem'
      };
    case 'minimal':
      return {
        color: config.color,
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.medium,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem'
      };
    default:
      return baseStyles;
  }
};

// Priority comparison and sorting
export const comparePriorities = (priorityA, priorityB) => {
  const configA = getPriorityConfig(priorityA);
  const configB = getPriorityConfig(priorityB);
  return configB.weight - configA.weight; // Higher weight = higher priority
};

export const sortTasksByPriority = (tasks) => {
  return tasks.sort((a, b) => {
    // First sort by completion status (incomplete first)
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    
    // Then sort by priority
    const priorityComparison = comparePriorities(a.priority, b.priority);
    if (priorityComparison !== 0) {
      return priorityComparison;
    }
    
    // Then sort by due date (earliest first)
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    
    // Tasks with due dates come before those without
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;
    
    // Finally sort by creation date (newest first)
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
};

// Task filtering utilities
export const filterTasksByStatus = (tasks, status) => {
  return tasks.filter(task => calculateTaskStatus(task) === status);
};

export const filterTasksByPriority = (tasks, priority) => {
  return tasks.filter(task => task.priority === priority);
};

export const getOverdueTasks = (tasks) => {
  return filterTasksByStatus(tasks, 'overdue');
};

export const getDueTodayTasks = (tasks) => {
  return filterTasksByStatus(tasks, 'due-today');
};

export const getUpcomingTasks = (tasks, days = 7) => {
  return tasks.filter(task => {
    if (!task.dueDate || task.completed) return false;
    
    const now = new Date();
    const dueDate = new Date(task.dueDate);
    const diffTime = dueDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 && diffDays <= days;
  });
};

export const getHighPriorityTasks = (tasks) => {
  return tasks.filter(task => task.priority === 'high' && !task.completed);
};

// Task priority change business logic
export const handlePriorityChange = async (taskId, oldPriority, newPriority) => {
  const actions = [];
  const oldConfig = getPriorityConfig(oldPriority);
  const newConfig = getPriorityConfig(newPriority);

  // If priority increased to high, check if due date needs adjustment
  if (newPriority === 'high' && oldPriority !== 'high') {
    actions.push({
      type: 'suggest_due_date_adjustment',
      data: {
        taskId,
        suggestedDueDate: new Date(Date.now() + newConfig.defaultDueOffset * 24 * 60 * 60 * 1000),
        reason: 'High priority task should have an earlier due date'
      }
    });
  }

  // Add notification for priority changes
  actions.push({
    type: 'priority_change_notification',
    data: {
      taskId,
      oldPriority,
      newPriority,
      message: `Task priority changed from ${oldConfig.label} to ${newConfig.label}`
    }
  });

  return actions;
};

// Get priority options for dropdowns
export const getPriorityOptions = () => {
  return Object.keys(TASK_PRIORITIES).map(priority => ({
    value: priority,
    label: TASK_PRIORITIES[priority].label,
    config: TASK_PRIORITIES[priority]
  }));
};

export const getTaskStatusOptions = () => {
  return Object.keys(TASK_STATUSES).map(status => ({
    value: status,
    label: TASK_STATUSES[status].label,
    config: TASK_STATUSES[status]
  }));
};

// Validation functions
export const isValidPriority = (priority) => {
  return Object.keys(TASK_PRIORITIES).includes(priority);
};

export const isValidTaskStatus = (status) => {
  return Object.keys(TASK_STATUSES).includes(status);
};

// Time-based utilities
export const getTaskUrgencyScore = (task) => {
  if (!task.dueDate) return 0;
  
  const now = new Date();
  const dueDate = new Date(task.dueDate);
  const diffTime = dueDate - now;
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  
  const priorityWeight = getPriorityConfig(task.priority).weight;
  
  // Calculate urgency score (higher = more urgent)
  let urgencyScore = priorityWeight * 10;
  
  if (diffDays < 0) {
    // Overdue tasks get high urgency
    urgencyScore += Math.abs(diffDays) * 5;
  } else if (diffDays <= 1) {
    // Due today or tomorrow
    urgencyScore += 20;
  } else if (diffDays <= 3) {
    // Due within 3 days
    urgencyScore += 10;
  } else if (diffDays <= 7) {
    // Due within a week
    urgencyScore += 5;
  }
  
  return Math.round(urgencyScore);
};

// Get default due date based on priority
export const getDefaultDueDate = (priority) => {
  const config = getPriorityConfig(priority);
  const now = new Date();
  return new Date(now.getTime() + config.defaultDueOffset * 24 * 60 * 60 * 1000);
};

// Format relative time for display
export const formatRelativeTime = (date) => {
  const now = new Date();
  const target = new Date(date);
  const diffTime = target - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
  
  if (diffTime < 0) {
    const overdueDays = Math.abs(diffDays);
    const overdueHours = Math.abs(diffHours);
    
    if (overdueDays >= 1) {
      return `${overdueDays} day${overdueDays !== 1 ? 's' : ''} overdue`;
    } else if (overdueHours >= 1) {
      return `${overdueHours} hour${overdueHours !== 1 ? 's' : ''} overdue`;
    } else {
      return 'Overdue';
    }
  } else if (diffDays <= 0) {
    if (diffHours <= 1) {
      return 'Due within 1 hour';
    } else if (diffHours <= 6) {
      return `Due in ${diffHours} hours`;
    } else {
      return 'Due today';
    }
  } else if (diffDays === 1) {
    return 'Due tomorrow';
  } else if (diffDays <= 7) {
    return `Due in ${diffDays} days`;
  } else {
    return `Due in ${Math.ceil(diffDays / 7)} week${Math.ceil(diffDays / 7) !== 1 ? 's' : ''}`;
  }
};

export default {
  TASK_PRIORITIES,
  TASK_STATUSES,
  getPriorityConfig,
  getTaskStatusConfig,
  calculateTaskStatus,
  getPriorityStyles,
  getTaskStatusStyles,
  comparePriorities,
  sortTasksByPriority,
  filterTasksByStatus,
  filterTasksByPriority,
  getOverdueTasks,
  getDueTodayTasks,
  getUpcomingTasks,
  getHighPriorityTasks,
  handlePriorityChange,
  getPriorityOptions,
  getTaskStatusOptions,
  isValidPriority,
  isValidTaskStatus,
  getTaskUrgencyScore,
  getDefaultDueDate,
  formatRelativeTime
};