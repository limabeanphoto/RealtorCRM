import theme from '../../styles/theme';

export default function MetricCard({ title, value, icon, color, subtext }) {
  // Use brand primary color as default if none provided
  const cardColor = color || theme.colors.brand.primary;
  
  return (
    <div style={{
      flex: '1',
      minWidth: '200px',
      padding: '1.5rem',
      borderRadius: theme.borderRadius.md,
      backgroundColor: 'white',
      boxShadow: theme.shadows.sm,
      textAlign: 'center',
      border: `1px solid ${cardColor}`,
      borderTop: `4px solid ${cardColor}`,
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      ":hover": {
        transform: 'translateY(-2px)',
        boxShadow: theme.shadows.md
      }
    }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
        {icon}
      </div>
      <h3 style={{ margin: '0', color: cardColor }}>{title}</h3>
      <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0', color: cardColor }}>
        {value}
      </p>
      {subtext && (
        <p style={{ margin: 0, fontSize: '0.9rem', color: theme.colors.brand.text }}>
          {subtext}
        </p>
      )}
    </div>
  );
}