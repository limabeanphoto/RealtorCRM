// File: components/common/Button.js
import theme from '../../styles/theme';

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'medium',
  fullWidth = false,
  onClick,
  type = 'button',
  disabled = false,
  style = {}
}) {
  // Define variant styles
  const variants = {
    primary: {
      backgroundColor: theme.colors.brand.primary,
      color: 'white',
    },
    secondary: {
      backgroundColor: theme.colors.brand.secondary,
      color: 'white',
    },
    accent: {
      backgroundColor: theme.colors.brand.accent,
      color: 'white',
    },
    danger: {
      backgroundColor: '#e74c3c',
      color: 'white',
    },
    outline: {
      backgroundColor: 'transparent',
      color: theme.colors.brand.primary,
      border: `1px solid ${theme.colors.brand.primary}`,
    },
    ghost: {
      backgroundColor: 'transparent',
      color: theme.colors.brand.text,
    }
  };
  
  // Define size styles
  const sizes = {
    small: {
      padding: '0.25rem 0.5rem',
      fontSize: '0.8rem',
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
    >
      {children}
    </button>
  );
}