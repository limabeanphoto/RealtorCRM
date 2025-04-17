import React from 'react';
import theme from '../../styles/theme'; // <-- Import the theme object directly

function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary', // primary, secondary, outline, text
  size = 'medium', // small, medium, large
  disabled = false,
  fullWidth = false,
  style = {},
  tooltip = '',
  ...props
}) {
  // No need for useTheme() hook anymore
  // const theme = useTheme();

  const variants = {
    primary: {
      backgroundColor: theme.colors.brand.primary, // Use imported theme
      color: theme.colors.white || '#ffffff', // Add fallback for white if not in theme
    },
    secondary: {
      backgroundColor: theme.colors.brand.secondary, // Use imported theme
      color: theme.colors.white || '#ffffff', // Add fallback for white
    },
    outline: {
      backgroundColor: 'transparent',
      color: theme.colors.brand.primary, // Use imported theme
      border: `1px solid ${theme.colors.brand.primary}`, // Use imported theme
    },
    text: {
      backgroundColor: 'transparent',
      color: theme.colors.brand.text, // Use imported theme
      padding: 0,
    }
  };

  const sizes = {
    small: {
      padding: '0.25rem 0.75rem',
      fontSize: '0.9rem',
    },
    medium: {
      padding: '0.5rem 1rem',
      fontSize: '1rem',
    },
    large: {
      padding: '0.75rem 1.5rem',
      fontSize: '1.1rem',
    }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
      style={{
        ...variants[variant],
        ...sizes[size],
        width: fullWidth ? '100%' : 'auto',
        border: variants[variant].border || 'none', // Access border from variant if exists
        borderRadius: theme.borderRadius.sm, // Use imported theme
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.7 : 1,
        transition: 'all 0.2s ease',
        fontWeight: '500',
        ...style
      }}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
