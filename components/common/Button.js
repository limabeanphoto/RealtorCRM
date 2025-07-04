import React from 'react';
import theme from '../../styles/theme'; // <-- Import the theme object directly

function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary', // primary, secondary, outline, text, gradient, glass, modern
  size = 'medium', // small, medium, large
  disabled = false,
  fullWidth = false,
  style = {},
  tooltip = '',
  loading = false,
  icon = null,
  iconPosition = 'left', // left, right
  ...props
}) {
  // Enhanced variants with modern styling
  const variants = {
    primary: {
      backgroundColor: theme.colors.brand.primary,
      color: '#ffffff',
      boxShadow: `0 4px 14px 0 ${theme.colors.brand.primary}40`,
      border: 'none',
      // Hover effects handled via pseudo-selectors in style object
    },
    secondary: {
      backgroundColor: theme.colors.brand.secondary,
      color: '#ffffff',
      boxShadow: `0 4px 14px 0 ${theme.colors.brand.secondary}40`,
      border: 'none',
    },
    outline: {
      backgroundColor: 'transparent',
      color: theme.colors.brand.primary,
      border: `2px solid ${theme.colors.brand.primary}`,
      boxShadow: 'none',
    },
    text: {
      backgroundColor: 'transparent',
      color: theme.colors.brand.text,
      padding: 0,
      border: 'none',
      boxShadow: 'none',
    },
    gradient: {
      background: `linear-gradient(135deg, ${theme.colors.brand.primary}, ${theme.colors.brand.secondary})`,
      color: '#ffffff',
      border: 'none',
      boxShadow: `0 8px 32px 0 ${theme.colors.brand.primary}30`,
    },
    glass: {
      background: 'rgba(255, 255, 255, 0.25)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      color: theme.colors.brand.primary,
      boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
    },
    modern: {
      background: `linear-gradient(135deg, ${theme.colors.brand.primary}15, ${theme.colors.brand.secondary}15)`,
      backdropFilter: 'blur(10px)',
      border: `1px solid ${theme.colors.brand.primary}30`,
      color: theme.colors.brand.primary,
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    }
  };

  const sizes = {
    small: {
      padding: icon ? '0.375rem 0.75rem' : '0.375rem 1rem',
      fontSize: '0.875rem',
      gap: '0.375rem',
    },
    medium: {
      padding: icon ? '0.5rem 1rem' : '0.5rem 1.25rem',
      fontSize: '1rem',
      gap: '0.5rem',
    },
    large: {
      padding: icon ? '0.75rem 1.25rem' : '0.75rem 1.75rem',
      fontSize: '1.125rem',
      gap: '0.625rem',
    }
  };

  // Enhanced button styles with modern interactions
  const buttonStyles = {
    ...variants[variant],
    ...sizes[size],
    width: fullWidth ? '100%' : 'auto',
    borderRadius: variant === 'text' ? '0' : theme.borderRadius.md,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    fontWeight: '600',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    outline: 'none',
    fontFamily: 'inherit',
    textDecoration: 'none',
    userSelect: 'none',
    
    // Enhanced focus states for accessibility
    ':focus': {
      outline: `2px solid ${theme.colors.brand.primary}`,
      outlineOffset: '2px',
    },
    
    // Modern hover effects
    ':hover': !disabled && !loading ? {
      transform: variant === 'text' ? 'none' : 'translateY(-2px)',
      boxShadow: variant === 'outline' ? `0 6px 20px ${theme.colors.brand.primary}20` :
                 variant === 'text' ? 'none' :
                 variant === 'glass' ? '0 12px 40px rgba(31, 38, 135, 0.5)' :
                 variant === 'gradient' ? `0 12px 40px ${theme.colors.brand.primary}40` :
                 variant === 'modern' ? '0 8px 30px rgba(0, 0, 0, 0.15)' :
                 `0 8px 25px ${theme.colors.brand.primary}50`,
      ...(variant === 'outline' && {
        backgroundColor: `${theme.colors.brand.primary}10`,
      }),
      ...(variant === 'text' && {
        backgroundColor: `${theme.colors.brand.primary}10`,
        borderRadius: theme.borderRadius.sm,
        padding: sizes[size].padding || '0.5rem 1rem',
      }),
      ...(variant === 'glass' && {
        background: 'rgba(255, 255, 255, 0.35)',
      }),
      ...(variant === 'modern' && {
        background: `linear-gradient(135deg, ${theme.colors.brand.primary}25, ${theme.colors.brand.secondary}25)`,
      }),
    } : {},
    
    // Active state
    ':active': !disabled && !loading ? {
      transform: variant === 'text' ? 'none' : 'translateY(0)',
      transition: 'transform 0.1s ease',
    } : {},
    
    ...style
  };

  // Loading spinner component
  const LoadingSpinner = () => (
    <div
      style={{
        width: '1em',
        height: '1em',
        border: `2px solid ${buttonStyles.color}30`,
        borderTop: `2px solid ${buttonStyles.color}`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginRight: children ? '0.5rem' : '0',
      }}
    />
  );

  // Content with icon support
  const buttonContent = (
    <>
      {loading && <LoadingSpinner />}
      {!loading && icon && iconPosition === 'left' && (
        <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>
      )}
      {children && (
        <span style={{ 
          display: 'flex', 
          alignItems: 'center',
          ...(loading && { marginLeft: '0.5rem' })
        }}>
          {children}
        </span>
      )}
      {!loading && icon && iconPosition === 'right' && (
        <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>
      )}
    </>
  );

  return (
    <>
      {/* Add keyframes for loading animation */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      
      <button
        type={type}
        onClick={disabled || loading ? undefined : onClick}
        disabled={disabled || loading}
        title={tooltip}
        style={buttonStyles}
        {...props}
      >
        {buttonContent}
      </button>
    </>
  );
}

export default Button;
