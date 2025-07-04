import { useState } from 'react';
import { FaAngleDown, FaAngleUp } from 'react-icons/fa';
import theme from '../../styles/theme';

export default function BaseCard({ 
  title,
  subtitle,
  headerContent,
  expandedContent,
  actions,
  badges,
  isInitiallyExpanded = false,
  onToggleExpand,
  style = {},
  titleStyle = {},
  headerStyle = {},
  expandedContentStyle = {},
  variant = 'modern', // classic, modern, glass, gradient
  accentColor,
  hover = true,
  ...props
}) {
  const [isExpanded, setIsExpanded] = useState(isInitiallyExpanded);
  const cardAccentColor = accentColor || theme.colors.brand.primary;
  
  const toggleExpand = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    if (onToggleExpand) onToggleExpand(newExpandedState);
  };

  // Enhanced card variants
  const cardVariants = {
    classic: {
      border: '1px solid #e2e8f0',
      borderRadius: theme.borderRadius.md,
      backgroundColor: 'white',
      boxShadow: theme.shadows.sm,
      borderTop: `4px solid ${cardAccentColor}`,
    },
    modern: {
      border: `1px solid ${cardAccentColor}20`,
      borderRadius: theme.borderRadius.lg,
      backgroundColor: 'white',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
      borderTop: `4px solid ${cardAccentColor}`,
      background: `linear-gradient(135deg, white 0%, ${cardAccentColor}05 100%)`,
    },
    glass: {
      border: '1px solid rgba(255, 255, 255, 0.3)',
      borderRadius: theme.borderRadius.lg,
      background: 'rgba(255, 255, 255, 0.25)',
      backdropFilter: 'blur(10px)',
      boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
    },
    gradient: {
      border: `1px solid ${cardAccentColor}30`,
      borderRadius: theme.borderRadius.lg,
      background: `linear-gradient(135deg, ${cardAccentColor}10, ${theme.colors.brand.secondary}10)`,
      boxShadow: `0 8px 32px 0 ${cardAccentColor}20`,
    }
  };

  // Hover effects
  const hoverEffects = {
    classic: {
      transform: 'translateY(-2px)',
      boxShadow: theme.shadows.md,
    },
    modern: {
      transform: 'translateY(-3px)',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
      borderColor: `${cardAccentColor}40`,
    },
    glass: {
      transform: 'translateY(-2px)',
      background: 'rgba(255, 255, 255, 0.35)',
      boxShadow: '0 12px 40px rgba(31, 38, 135, 0.5)',
    },
    gradient: {
      transform: 'translateY(-2px)',
      background: `linear-gradient(135deg, ${cardAccentColor}15, ${theme.colors.brand.secondary}15)`,
      boxShadow: `0 12px 40px ${cardAccentColor}30`,
    }
  };

  const cardStyles = {
    ...cardVariants[variant],
    margin: '0 0 1rem 0',
    overflow: 'hidden',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    
    // Apply hover effects
    ...(hover && {
      ':hover': hoverEffects[variant],
    }),
    
    ...style
  };

  const headerStyles = {
    padding: '1.25rem',
    borderBottom: isExpanded ? '1px solid rgba(0, 0, 0, 0.08)' : 'none',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    
    ':hover': {
      backgroundColor: variant === 'glass' ? 'rgba(255, 255, 255, 0.1)' : 
                      variant === 'gradient' ? 'rgba(255, 255, 255, 0.3)' : 
                      `${cardAccentColor}05`,
    },
    
    ...headerStyle
  };

  const expandedContentStyles = {
    padding: '1.25rem',
    backgroundColor: variant === 'glass' ? 'rgba(255, 255, 255, 0.1)' : 
                    variant === 'gradient' ? 'rgba(255, 255, 255, 0.3)' : 
                    '#f9f9fa',
    borderTop: '1px solid rgba(0, 0, 0, 0.05)',
    animation: 'expandIn 0.3s ease-out',
    ...expandedContentStyle
  };

  return (
    <>
      {/* Add animation keyframes */}
      <style jsx>{`
        @keyframes expandIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      
      <div 
        style={cardStyles}
        {...props}
      >
        {/* Card Header */}
        <div 
          style={headerStyles}
          onClick={toggleExpand}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggleExpand();
            }
          }}
          role="button"
          tabIndex={0}
          aria-expanded={isExpanded}
          aria-controls="card-content"
        >
          <div style={{ flex: 1, marginRight: '0.5rem' }}>
            {title && (
              <h3 style={{ 
                margin: 0,
                fontSize: '1.125rem',
                fontWeight: '600',
                color: variant === 'glass' ? cardAccentColor : '#2c3e50',
                lineHeight: '1.2',
                ...titleStyle 
              }}>
                {title}
              </h3>
            )}
            {subtitle && (
              <div style={{
                marginTop: '0.25rem',
                fontSize: '0.875rem',
                color: variant === 'glass' ? cardAccentColor : theme.colors.brand.text,
                opacity: 0.8,
              }}>
                {subtitle}
              </div>
            )}
            {headerContent && (
              <div style={{ marginTop: '0.5rem' }}>
                {headerContent}
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {badges && (
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {badges}
              </div>
            )}
            {actions && (
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {actions}
              </div>
            )}
            
            {/* Enhanced Expand/Collapse Icon */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: '2rem',
              height: '2rem',
              borderRadius: '50%',
              backgroundColor: `${cardAccentColor}15`,
              color: cardAccentColor,
              marginLeft: '0.5rem',
              transition: 'all 0.2s ease',
              fontSize: '0.875rem',
              ':hover': {
                backgroundColor: `${cardAccentColor}25`,
                transform: 'scale(1.1)',
              }
            }}>
              {isExpanded ? <FaAngleUp /> : <FaAngleDown />}
            </div>
          </div>
        </div>
        
        {/* Expanded Content */}
        {isExpanded && (
          <div 
            id="card-content"
            style={expandedContentStyles}
          >
            {expandedContent}
          </div>
        )}
      </div>
    </>
  );
}