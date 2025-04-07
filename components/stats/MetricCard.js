export default function MetricCard({ title, value, icon, color = '#4a69bd', subtext }) {
    return (
      <div style={{
        flex: '1',
        minWidth: '200px',
        padding: '1.5rem',
        borderRadius: '8px',
        backgroundColor: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        textAlign: 'center',
        border: `1px solid ${color}`,
        borderTop: `4px solid ${color}`
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
          {icon}
        </div>
        <h3 style={{ margin: '0', color }}>{title}</h3>
        <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.5rem 0', color }}>
          {value}
        </p>
        {subtext && (
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>
            {subtext}
          </p>
        )}
      </div>
    )
  }