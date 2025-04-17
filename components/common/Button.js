import React from 'react';
import { useTheme } from '../../styles/theme'; // Assuming theme context is used

function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary', // primary, secondary, outline, text
  size = 'medium', // small, medium, large
  disabled = false,
  fullWidth = false,
  style = {},
  tooltip = '', // <-- Add tooltip prop
  ...props // Capture any other props
}) {
  const theme = useTheme(); // Assuming theme context hook

  const variants = {
    primary: {
      backgroundColor: theme.colors.brand.primary,
      color: theme.colors.white,
    },
    secondary: {
      backgroundColor: theme.colors.brand.secondary,
      color: theme.colors.white,
    },
    outline: {
      backgroundColor: 'transparent',
      color: theme.colors.brand.primary,
      border: `1px solid ${theme.colors.brand.primary}`,
    },
    text: {
      backgroundColor: 'transparent',
      color: theme.colors.brand.text,
      padding: 0, // Adjust as needed for text buttons
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
      title={tooltip} // <-- Use the tooltip prop here
      style={{
        ...variants[variant],
        ...sizes[size],
        width: fullWidth ? '100%' : 'auto',
        border: variant === 'outline' ? `1px solid ${theme.colors.brand.primary}` : 'none',
        borderRadius: theme.borderRadius.sm,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.7 : 1,
        transition: 'all 0.2s ease',
        fontWeight: '500',
        ...style
      }}
      {...props} // Spread any other props
    >
      {children}
    </button>
  );
}

export default Button;
