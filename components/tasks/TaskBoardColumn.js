import React, { useState } from 'react';
import { FaPlus, FaEllipsisV } from 'react-icons/fa';
import MiniTaskCard from './MiniTaskCard';
import Button from '../common/Button';
import theme from '../../styles/theme';

const TaskBoardColumn = ({
  column,
  tasks = [],
  onTaskEdit,
  onTaskStatusChange,
  onTaskDelete,
  onDragOver,
  onDrop,
  onDragStart,
  onCreateTask,
  maxHeight = '70vh',
  showAddButton = false,
  className = ''
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleDragEnter = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    // Only set false if we're leaving the column container
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (onDragOver) onDragOver(e);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (onDrop) onDrop(e);
  };

  const handleCreateTask = () => {
    if (onCreateTask) {
      // Pass column context for smart defaults
      onCreateTask(column.id);
    }
  };

  return (
    <div className={`task-board-column ${className} ${isDragOver ? 'drag-over' : ''}`}>
      <style jsx>{`
        .task-board-column {
          display: flex;
          flex-direction: column;
          background: white;
          border-radius: ${theme.borderRadius.lg};
          border: 2px solid ${theme.colors.neutral[200]};
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          min-height: 400px;
          max-height: ${maxHeight};
          position: relative;
          container-type: inline-size;
        }

        .task-board-column.drag-over {
          border-color: ${column.color};
          background: ${column.bgColor}50;
          transform: scale(1.02);
          box-shadow: 0 8px 30px ${column.color}30;
        }

        .task-board-column:hover {
          border-color: ${column.color}60;
          box-shadow: 0 4px 20px ${theme.colors.neutral[200]};
        }

        .column-header {
          padding: 1rem;
          background: ${column.bgColor};
          border-bottom: 1px solid ${column.color}30;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .column-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          color: ${theme.colors.neutral[800]};
        }

        .column-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: ${column.color};
          box-shadow: 0 2px 8px ${column.color}40;
        }

        .column-count {
          background: ${column.color}20;
          color: ${column.color};
          padding: 0.25rem 0.5rem;
          border-radius: ${theme.borderRadius.full};
          font-size: 0.75rem;
          font-weight: 600;
          min-width: 1.5rem;
          text-align: center;
          margin-left: 0.5rem;
        }

        .column-menu {
          position: relative;
        }

        .column-menu-button {
          width: 24px;
          height: 24px;
          padding: 0;
          border: none;
          background: transparent;
          color: ${theme.colors.neutral[500]};
          border-radius: ${theme.borderRadius.sm};
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .column-menu-button:hover {
          background: ${column.color}20;
          color: ${column.color};
        }

        .column-menu-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          background: white;
          border: 1px solid ${theme.colors.neutral[200]};
          border-radius: ${theme.borderRadius.md};
          box-shadow: ${theme.shadows.lg};
          min-width: 150px;
          z-index: 20;
          opacity: ${showMenu ? 1 : 0};
          visibility: ${showMenu ? 'visible' : 'hidden'};
          transform: translateY(${showMenu ? '0' : '-8px'});
          transition: all 0.2s ease;
        }

        .column-menu-item {
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: ${theme.colors.neutral[700]};
          cursor: pointer;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
          transition: background-color 0.2s ease;
        }

        .column-menu-item:hover {
          background: ${theme.colors.neutral[100]};
        }

        .column-content {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .column-content::-webkit-scrollbar {
          width: 6px;
        }

        .column-content::-webkit-scrollbar-track {
          background: transparent;
        }

        .column-content::-webkit-scrollbar-thumb {
          background: ${theme.colors.neutral[300]};
          border-radius: 3px;
        }

        .column-content::-webkit-scrollbar-thumb:hover {
          background: ${theme.colors.neutral[400]};
        }

        .column-task {
          transition: all 0.2s ease;
          cursor: grab;
        }

        .column-task:active {
          cursor: grabbing;
          transform: rotate(2deg);
          z-index: 1000;
        }

        .column-task:hover {
          transform: translateY(-1px);
        }

        .column-empty {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
          color: ${theme.colors.neutral[500]};
          text-align: center;
          min-height: 120px;
        }

        .column-empty-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: ${column.bgColor};
          color: ${column.color};
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.75rem;
          font-size: 1.25rem;
        }

        .column-empty-text {
          font-size: 0.875rem;
          margin-bottom: 1rem;
          line-height: 1.4;
        }

        .column-add-button {
          width: 100%;
          border: 2px dashed ${column.color}40;
          background: transparent;
          color: ${column.color};
          padding: 0.75rem;
          border-radius: ${theme.borderRadius.md};
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          margin-top: auto;
        }

        .column-add-button:hover {
          border-color: ${column.color};
          background: ${column.bgColor}30;
        }

        .drag-placeholder {
          height: 80px;
          border: 2px dashed ${column.color};
          border-radius: ${theme.borderRadius.md};
          background: ${column.bgColor}30;
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${column.color};
          font-size: 0.875rem;
          margin: 0.5rem 0;
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        /* Container queries for responsive design */
        @container (max-width: 200px) {
          .column-header {
            padding: 0.75rem;
          }
          
          .column-title {
            font-size: 0.875rem;
          }
          
          .column-count {
            font-size: 0.625rem;
            padding: 0.125rem 0.375rem;
          }
        }

        /* Accessibility */
        @media (prefers-reduced-motion: reduce) {
          .task-board-column,
          .column-task,
          .column-menu-dropdown {
            transition: none;
          }
          
          .drag-placeholder {
            animation: none;
          }
        }

        /* Focus states */
        .task-board-column:focus-within {
          border-color: ${column.color};
          box-shadow: 0 0 0 3px ${column.color}20;
        }
      `}</style>

      {/* Column Header */}
      <div className="column-header">
        <div className="column-title">
          <div className="column-indicator" aria-hidden="true"></div>
          <h3>{column.title}</h3>
          <span className="column-count" aria-label={`${tasks.length} tasks`}>
            {tasks.length}
          </span>
        </div>

        <div className="column-menu">
          <button
            className="column-menu-button"
            onClick={() => setShowMenu(!showMenu)}
            aria-label="Column options"
            aria-expanded={showMenu}
            aria-haspopup="true"
          >
            <FaEllipsisV size={12} />
          </button>

          {showMenu && (
            <div className="column-menu-dropdown" role="menu">
              <button 
                className="column-menu-item" 
                role="menuitem"
                onClick={() => {
                  handleCreateTask();
                  setShowMenu(false);
                }}
              >
                Add Task
              </button>
              <button 
                className="column-menu-item" 
                role="menuitem"
                onClick={() => setShowMenu(false)}
              >
                Clear Completed
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Column Content */}
      <div 
        className="column-content"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        role="region"
        aria-label={`${column.title} tasks`}
      >
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <div
              key={task.id}
              className="column-task"
              draggable
              onDragStart={(e) => onDragStart && onDragStart(e, task)}
              role="button"
              tabIndex={0}
              aria-label={`Drag ${task.title}`}
            >
              <MiniTaskCard
                task={task}
                onEditTask={onTaskEdit}
                onStatusChange={onTaskStatusChange}
                onDeleteTask={onTaskDelete}
                compact={true}
              />
            </div>
          ))
        ) : (
          <div className="column-empty">
            <div className="column-empty-icon">
              <FaPlus />
            </div>
            <div className="column-empty-text">
              No tasks in {column.title.toLowerCase()}
            </div>
            {showAddButton && (
              <button className="column-add-button" onClick={handleCreateTask}>
                <FaPlus size={14} />
                Add Task
              </button>
            )}
          </div>
        )}

        {isDragOver && tasks.length > 0 && (
          <div className="drag-placeholder">
            Drop task here
          </div>
        )}
      </div>

      {/* Click outside handler */}
      {showMenu && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 5
          }}
          onClick={() => setShowMenu(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default TaskBoardColumn;