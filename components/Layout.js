export default function Layout({ children }) {
    return (
      <div>
        <nav style={{ background: '#4a69bd', padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h1 style={{ color: 'white', margin: 0 }}>Realtor CRM</h1>
            <div>
              <a href="/" style={{ color: 'white', marginRight: '1rem' }}>Dashboard</a>
              <a href="/contacts" style={{ color: 'white', marginRight: '1rem' }}>Contacts</a>
              <a href="/calls" style={{ color: 'white', marginRight: '1rem' }}>Calls</a>
              <a href="/stats" style={{ color: 'white', marginRight: '1rem' }}>Analytics</a>
              <a href="/tasks" style={{ color: 'white' }}>Tasks</a>
            </div>
          </div>
        </nav> 
        <main style={{ padding: '2rem' }}>
          {children}
        </main>
      </div>
    )
  }