import theme from '../../styles/theme';

export default function Card({ 
  children, 
  title, 
  icon, 
  accentColor, 
  footer, 
  onClick,
  style = {}
}) {
  const cardAccentColor = accentColor || theme.colors.brand.primary;
  const isClickable = !!onClick;
  
  return (
    <div 
      onClick={onClick}
      style={{
        backgroundColor: 'white',
        borderRadius: theme.borderRadius.md,
        boxShadow: theme.shadows.sm,
        overflow: 'hidden',
        borderTop: `4px solid ${cardAccentColor}`,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        cursor: isClickable ? 'pointer' : 'default',
        ...style,
        ...(isClickable && {
          ':hover': {
            transform: 'translateY(-3px)',
            boxShadow: theme.shadows.md,
          }
        })
      }}
    >
      {/* Card Header */}
      {(title || icon) && (
        <div style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <h3 style={{ 
            margin: 0, 
            color: cardAccentColor,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            {icon && <span>{icon}</span>}
            {title}
          </h3>
        </div>
      )}
      
      {/* Card Content */}
      <div style={{ padding: '1.5rem' }}>
        {children}
      </div>
      
      {/* Card Footer */}
      {footer && (
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid #f0f0f0',
          backgroundColor: '#fafafa',
        }}>
          {footer}
        </div>
      )}
    </div>
  );
}