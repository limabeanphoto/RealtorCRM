import React from 'react';
import { FaList, FaTh, FaColumns } from 'react-icons/fa';
import theme from '../../styles/theme';

const TaskViewToggle = ({ 
  viewMode = 'board', 
  onViewModeChange, 
  disabled = false,
  size = 'medium', // small, medium, large
  variant = 'modern', // classic, modern, minimal
  showLabels = true,
  className = ''
}) => {
  const views = [
    {
      id: 'list',
      label: 'List View',
      icon: FaList,
      tooltip: 'View tasks in a list format'
    },
    {
      id: 'board',
      label: 'Board View', 
      icon: FaColumns,
      tooltip: 'View tasks in kanban board columns'
    }
  ];

  const handleViewChange = (newView) => {
    if (disabled || newView === viewMode) return;
    
    if (onViewModeChange) {
      onViewModeChange(newView);
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          padding: '0.375rem 0.75rem',
          fontSize: '0.75rem',
          iconSize: 12,
          gap: '0.25rem'
        };
      case 'large':
        return {
          padding: '0.75rem 1.25rem',
          fontSize: '1rem',
          iconSize: 18,
          gap: '0.5rem'
        };
      default: // medium
        return {
          padding: '0.5rem 1rem',
          fontSize: '0.875rem',
          iconSize: 14,
          gap: '0.375rem'
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <div className={`task-view-toggle ${className}`}>
      <style jsx>{`
        .task-view-toggle {
          display: inline-flex;
          background: ${variant === 'minimal' ? 'transparent' : 'white'};
          border: ${variant === 'minimal' ? 'none' : `1px solid ${theme.colors.neutral[300]}`};
          border-radius: ${theme.borderRadius.lg};
          padding: ${variant === 'minimal' ? '0' : '0.25rem'};
          box-shadow: ${variant === 'modern' ? theme.shadows.sm : 'none'};
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }

        .task-view-toggle:hover {
          border-color: ${variant !== 'minimal' ? theme.colors.brand.primary : 'transparent'};
          box-shadow: ${variant === 'modern' ? `0 0 0 3px ${theme.colors.brand.primary}15` : 'none'};
        }

        .view-option {
          display: flex;
          align-items: center;
          gap: ${sizeStyles.gap};
          padding: ${sizeStyles.padding};
          font-size: ${sizeStyles.fontSize};
          font-weight: 500;
          color: ${theme.colors.neutral[600]};
          background: transparent;
          border: ${variant === 'minimal' ? `1px solid ${theme.colors.neutral[300]}` : 'none'};
          border-radius: ${variant === 'minimal' ? theme.borderRadius.md : theme.borderRadius.lg};
          cursor: ${disabled ? 'not-allowed' : 'pointer'};
          transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
          position: relative;
          z-index: 2;
          outline: none;
          opacity: ${disabled ? 0.5 : 1};
          margin: ${variant === 'minimal' ? '0 0.25rem 0 0' : '0'};
        }

        .view-option:last-child {
          margin-right: 0;
        }

        .view-option:hover {
          color: ${disabled ? theme.colors.neutral[600] : theme.colors.brand.primary};
          background: ${disabled ? 'transparent' : 
                       variant === 'minimal' ? `${theme.colors.brand.primary}10` : 
                       `${theme.colors.brand.primary}05`};
          transform: ${disabled ? 'none' : 'translateY(-1px)'};
        }

        .view-option:active {
          transform: ${disabled ? 'none' : 'translateY(0)'};
          transition-duration: 0.1s;
        }

        .view-option:focus-visible {
          outline: 2px solid ${theme.colors.brand.primary};
          outline-offset: 2px;
        }

        .view-option.active {
          color: ${variant === 'minimal' ? theme.colors.brand.primary : 'white'};
          background: ${variant === 'minimal' ? `${theme.colors.brand.primary}15` : theme.colors.brand.primary};
          box-shadow: ${variant === 'modern' ? `0 2px 8px ${theme.colors.brand.primary}30` : 'none'};
          border-color: ${variant === 'minimal' ? theme.colors.brand.primary : 'transparent'};
          transform: ${variant === 'modern' ? 'translateY(-1px)' : 'none'};
        }

        .view-option.active:hover {
          background: ${variant === 'minimal' ? `${theme.colors.brand.primary}25` : theme.colors.brand.primary};
          color: ${variant === 'minimal' ? theme.colors.brand.primary : 'white'};
        }

        .view-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s ease;
        }

        .view-option:hover .view-icon {
          transform: ${disabled ? 'none' : 'scale(1.1)'};
        }

        .view-option.active .view-icon {
          transform: scale(1.05);
        }

        .view-label {
          user-select: none;
          white-space: nowrap;
          display: ${showLabels ? 'block' : 'none'};
        }

        /* Sliding indicator for modern variant */
        .slide-indicator {
          position: absolute;
          top: ${variant === 'minimal' ? 'auto' : '0.25rem'};
          bottom: ${variant === 'minimal' ? '0' : '0.25rem'};
          left: 0;
          width: 50%;
          height: ${variant === 'minimal' ? '2px' : 'calc(100% - 0.5rem)'};
          background: ${variant === 'minimal' ? theme.colors.brand.primary : 
                       `linear-gradient(135deg, ${theme.colors.brand.primary}, ${theme.colors.brand.secondary})`};
          border-radius: ${variant === 'minimal' ? '1px' : theme.borderRadius.lg};
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          transform: translateX(${viewMode === 'board' ? '100%' : '0%'});
          z-index: 1;
          box-shadow: ${variant === 'modern' ? theme.shadows.sm : 'none'};
          opacity: ${variant === 'classic' ? 0 : 1};
        }

        /* Responsive adjustments */
        @media (max-width: 640px) {
          .view-label {
            display: ${showLabels && size !== 'small' ? 'block' : 'none'};
          }
          
          .view-option {
            padding: 0.5rem;
          }
        }

        /* Accessibility enhancements */
        @media (prefers-reduced-motion: reduce) {
          .view-option,
          .slide-indicator,
          .view-icon {
            transition: none;
          }
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .task-view-toggle {
            border-width: 2px;
          }
          
          .view-option.active {
            outline: 2px solid currentColor;
          }
        }
      `}</style>

      {/* Sliding indicator for modern/minimal variants */}
      {variant !== 'classic' && (
        <div className="slide-indicator" aria-hidden="true" />
      )}

      {views.map((view) => {
        const IconComponent = view.icon;
        const isActive = viewMode === view.id;
        
        return (
          <button
            key={view.id}
            className={`view-option ${isActive ? 'active' : ''}`}
            onClick={() => handleViewChange(view.id)}
            disabled={disabled}
            title={view.tooltip}
            aria-label={view.label}
            aria-pressed={isActive}
            role="button"
            type="button"
          >
            <span className="view-icon">
              <IconComponent size={sizeStyles.iconSize} />
            </span>
            {showLabels && (
              <span className="view-label">
                {view.label.replace(' View', '')}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default TaskViewToggle;