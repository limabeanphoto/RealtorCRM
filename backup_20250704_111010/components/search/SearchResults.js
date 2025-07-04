import { useRouter } from 'next/router'
import theme from '../../styles/theme'

export default function SearchResults({ results, onClose }) {
  const router = useRouter()

  // Format date for display
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  // Navigate to item and close search
  const navigateToItem = (type, id) => {
    switch (type) {
      case 'contact':
        router.push(`/contacts?id=${id}`)
        break
      case 'call':
        router.push(`/calls?id=${id}`)
        break
      case 'task':
        router.push(`/tasks?id=${id}`)
        break
    }
    onClose()
  }

  // Display message if no results found
  if (results.total === 0) {
    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        padding: '1rem',
        marginTop: '0.5rem',
        maxHeight: '400px',
        overflowY: 'auto'
      }}>
        <p style={{ textAlign: 'center', color: theme.colors.brand.text }}>
          No results found. Try a different search term.
        </p>
      </div>
    )
  }

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      padding: '1rem',
      marginTop: '0.5rem',
      maxHeight: '400px',
      overflowY: 'auto',
      zIndex: 1000,
      position: 'absolute',
      width: '100%',
      color: theme.colors.brand.text // Added this line to set text color
    }}>
      {/* Contacts Results */}
      {results.contacts.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <h3 style={{ 
            fontSize: '0.9rem', 
            color: theme.colors.brand.text, 
            marginBottom: '0.5rem',
            borderBottom: '1px solid #f0f0f0',
            paddingBottom: '0.25rem'
          }}>
            Contacts
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {results.contacts.map(contact => (
              <li 
                key={contact.id}
                onClick={() => navigateToItem('contact', contact.id)}
                style={{
                  padding: '0.5rem',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s',
                  color: theme.colors.brand.text // Added color here for list items
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div style={{ fontWeight: 'bold', color: 'inherit' }}>{contact.name}</div>
                <div style={{ fontSize: '0.8rem', color: theme.colors.brand.text }}>
                  {contact.company || 'No company'} • {contact.phone}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Calls Results */}
      {results.calls.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <h3 style={{ 
            fontSize: '0.9rem', 
            color: theme.colors.brand.text, 
            marginBottom: '0.5rem',
            borderBottom: '1px solid #f0f0f0',
            paddingBottom: '0.25rem'
          }}>
            Calls
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {results.calls.map(call => (
              <li 
                key={call.id}
                onClick={() => navigateToItem('call', call.id)}
                style={{
                  padding: '0.5rem',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s',
                  color: theme.colors.brand.text // Added color here for list items
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div style={{ fontWeight: 'bold', color: 'inherit' }}>
                  Call with {call.contact?.name || 'Unknown'}
                </div>
                <div style={{ fontSize: '0.8rem', color: theme.colors.brand.text }}>
                  {formatDate(call.date)} • {call.outcome}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tasks Results */}
      {results.tasks.length > 0 && (
        <div>
          <h3 style={{ 
            fontSize: '0.9rem', 
            color: theme.colors.brand.text, 
            marginBottom: '0.5rem',
            borderBottom: '1px solid #f0f0f0',
            paddingBottom: '0.25rem'
          }}>
            Tasks
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {results.tasks.map(task => (
              <li 
                key={task.id}
                onClick={() => navigateToItem('task', task.id)}
                style={{
                  padding: '0.5rem',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s',
                  color: theme.colors.brand.text // Added color here for list items
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div style={{ fontWeight: 'bold', color: 'inherit' }}>{task.title}</div>
                <div style={{ fontSize: '0.8rem', color: theme.colors.brand.text }}>
                  Due: {formatDate(task.dueDate)} • {task.status}
                  {task.contact && ` • ${task.contact.name}`}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}