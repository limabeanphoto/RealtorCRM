// File: components/Layout.js
import { useRouter } from 'next/router';
import Link from 'next/link';
import theme from '../styles/theme';

export default function Layout({ children }) {
  const router = useRouter();
  
  // Function to check if the current path matches
  const isActive = (path) => {
    return router.pathname === path;
  };
  
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: '100vh', 
      backgroundColor: theme.colors.brand.background 
    }}>
      <nav style={{ 
        background: theme.colors.brand.primary, 
        padding: '1rem',
        boxShadow: theme.shadows.md,
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%',
        }}>
          <h1 style={{ 
            color: 'white', 
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            fontWeight: 700,
          }}>
            Realtor CRM
          </h1>
          <div style={{
            display: 'flex',
            gap: '1.5rem',
          }}>
            {[
              { href: '/', label: 'Dashboard' },
              { href: '/contacts', label: 'Contacts' },
              { href: '/calls', label: 'Calls' },
              { href: '/stats', label: 'Analytics' },
              { href: '/tasks', label: 'Tasks' },
            ].map(({ href, label }) => (
              <Link 
                key={href} 
                href={href}
                style={{ 
                  color: 'white', 
                  textDecoration: 'none',
                  fontWeight: isActive(href) ? '600' : '400',
                  padding: '0.5rem 0.75rem',
                  borderRadius: theme.borderRadius.sm,
                  backgroundColor: isActive(href) 
                    ? 'rgba(255, 255, 255, 0.2)' 
                    : 'transparent',
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </nav> 
      <main style={{ 
        padding: '2rem',
        flex: 1,
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
      }}>
        {children}
      </main>
      <footer style={{
        padding: '1.5rem',
        backgroundColor: 'white',
        borderTop: `1px solid ${theme.colors.brand.secondary}`,
        textAlign: 'center',
        color: theme.colors.brand.text,
      }}>
        <p style={{ margin: 0 }}>Realtor CRM • Simplifying sales tracking since 2024</p>
      </footer>
    </div>
  );
}