import theme from '../../styles/theme';

export default function Spinner({ size = 'medium', color = 'primary' }) {
  const spinnerColor = theme.colors.brand[color] || theme.colors.brand.primary;
  
  // Determine size
  const getSize = () => {
    switch (size) {
      case 'small': return '20px';
      case 'large': return '40px';
      default: return '30px';
    }
  };
  
  const spinnerSize = getSize();
  
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '1rem',
    }}>
      <div style={{
        width: spinnerSize,
        height: spinnerSize,
        border: `3px solid ${theme.colors.brand.background}`,
        borderTop: `3px solid ${spinnerColor}`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}