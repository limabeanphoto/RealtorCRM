import React from 'react';
import theme from '../../styles/theme';

export default function Card({ 
  children, 
  title, 
  icon, 
  accentColor, 
  footer, 
  onClick,
  style = {},
  variant = 'classic', // classic, modern, glass, gradient, elevated, minimal
  hover = true,
  padding = 'normal', // none, small, normal, large
  headerActions = null,
  loading = false,
  ...props
}) {
  const cardAccentColor = accentColor || theme.colors.brand.primary;
  const isClickable = !!onClick;
  
  // Padding variants
  const paddingVariants = {
    none: '0',
    small: '0.75rem',
    normal: '1.5rem',
    large: '2rem'
  };
  
  // Card variants with modern styling
  const cardVariants = {
    classic: {
      backgroundColor: 'white',
      borderRadius: theme.borderRadius.md,
      boxShadow: theme.shadows.sm,
      border: 'none',
      borderTop: `4px solid ${cardAccentColor}`,
    },
    modern: {
      backgroundColor: 'white',
      borderRadius: theme.borderRadius.lg,
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
      border: `1px solid ${cardAccentColor}20`,
      borderTop: `4px solid ${cardAccentColor}`,
      background: `linear-gradient(135deg, white 0%, ${cardAccentColor}05 100%)`,
    },
    glass: {
      background: 'rgba(255, 255, 255, 0.25)',
      backdropFilter: 'blur(10px)',
      borderRadius: theme.borderRadius.lg,
      border: '1px solid rgba(255, 255, 255, 0.3)',
      boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
    },
    gradient: {
      background: `linear-gradient(135deg, ${cardAccentColor}10, ${theme.colors.brand.secondary}10)`,
      borderRadius: theme.borderRadius.lg,
      border: `1px solid ${cardAccentColor}30`,
      boxShadow: `0 8px 32px 0 ${cardAccentColor}20`,
    },
    elevated: {
      backgroundColor: 'white',
      borderRadius: theme.borderRadius.lg,
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
      border: 'none',
      borderLeft: `6px solid ${cardAccentColor}`,
    },
    minimal: {
      backgroundColor: 'white',
      borderRadius: theme.borderRadius.sm,
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      border: `1px solid ${cardAccentColor}15`,
    }
  };

  // Hover effects for different variants
  const hoverEffects = {
    classic: {
      transform: 'translateY(-3px)',
      boxShadow: theme.shadows.md,
    },
    modern: {
      transform: 'translateY(-4px)',
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
    },
    elevated: {
      transform: 'translateY(-6px)',
      boxShadow: '0 25px 80px rgba(0, 0, 0, 0.2)',
    },
    minimal: {
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      borderColor: `${cardAccentColor}30`,
    }
  };

  // Loading skeleton styles
  const LoadingSkeleton = () => (
    <div style={{
      animation: 'pulse 1.5s ease-in-out infinite',
      background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
      borderRadius: theme.borderRadius.sm,
      height: '1rem',
      marginBottom: '0.5rem',
    }}
    />
  );

  const cardStyles = {
    ...cardVariants[variant],
    overflow: 'hidden',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: isClickable ? 'pointer' : 'default',
    position: 'relative',
    
    // Enhanced focus states for accessibility
    ':focus': isClickable ? {
      outline: `2px solid ${cardAccentColor}`,
      outlineOffset: '2px',
    } : {},
    
    // Apply hover effects only if hover is enabled and card is clickable
    ...(hover && isClickable && {
      ':hover': hoverEffects[variant],
    }),
    
    ...style
  };

  return (
    <>
      {/* Add keyframes for loading animation */}
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
      
      <div 
        onClick={isClickable ? onClick : undefined}
        style={cardStyles}
        role={isClickable ? 'button' : 'article'}
        tabIndex={isClickable ? 0 : undefined}
        onKeyDown={isClickable ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick?.(e);
          }
        } : undefined}
        {...props}
      >
        {/* Card Header */}
        {(title || icon || headerActions) && (
          <div style={{
            padding: `${paddingVariants[padding]} ${paddingVariants[padding]} 0 ${paddingVariants[padding]}`,
            borderBottom: variant === 'minimal' ? 'none' : '1px solid rgba(0, 0, 0, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: variant === 'minimal' ? '0' : '1rem',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              flex: 1,
            }}>
              {icon && (
                <div style={{
                  fontSize: '1.25rem',
                  color: cardAccentColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '2rem',
                  height: '2rem',
                  borderRadius: theme.borderRadius.sm,
                  background: `${cardAccentColor}15`,
                }}>
                  {icon}
                </div>
              )}
              {title && (
                <h3 style={{ 
                  margin: 0, 
                  color: variant === 'glass' ? cardAccentColor : '#2c3e50',
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  lineHeight: '1.2',
                }}>
                  {title}
                </h3>
              )}
            </div>
            {headerActions && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {headerActions}
              </div>
            )}
          </div>
        )}
        
        {/* Card Content */}
        <div style={{ 
          padding: title || icon || headerActions ? 
            `0 ${paddingVariants[padding]} ${paddingVariants[padding]} ${paddingVariants[padding]}` : 
            paddingVariants[padding],
        }}>
          {loading ? (
            <div>
              <LoadingSkeleton />
              <LoadingSkeleton />
              <div style={{ width: '60%' }}>
                <LoadingSkeleton />
              </div>
            </div>
          ) : (
            children
          )}
        </div>
        
        {/* Card Footer */}
        {footer && !loading && (
          <div style={{
            padding: `0 ${paddingVariants[padding]} ${paddingVariants[padding]} ${paddingVariants[padding]}`,
            borderTop: variant === 'minimal' ? 'none' : '1px solid rgba(0, 0, 0, 0.08)',
            backgroundColor: variant === 'glass' ? 'rgba(255, 255, 255, 0.1)' : 
                             variant === 'gradient' ? 'rgba(255, 255, 255, 0.5)' : 
                             '#fafafa',
            marginTop: '1rem',
          }}>
            {footer}
          </div>
        )}
      </div>
    </>
  );
}