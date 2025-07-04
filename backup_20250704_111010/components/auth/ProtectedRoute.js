// components/auth/ProtectedRoute.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { checkAuthStatus } from '../../utils/tokenUtils';

/**
 * Enhanced ProtectedRoute component with token expiration checking
 * This replaces your existing ProtectedRoute with additional security
 */
export default function ProtectedRoute({ children, adminOnly = false }) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuthentication = () => {
      try {
        // Check token status using our utility
        const authStatus = checkAuthStatus();
        
        // If token is expired or missing, redirect to login
        if (authStatus.shouldRedirect) {
          console.log('Authentication check failed - redirecting to login');
          router.push('/login');
          return;
        }

        // Get user data for role checking
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        
        // Check admin requirement
        if (adminOnly && userData.role !== 'admin') {
          console.log('Admin access required - redirecting to dashboard');
          router.push('/');
          return;
        }

        // All checks passed
        setIsAuthorized(true);
        
        // Optional: Log token expiration info for debugging
        if (authStatus.expiresAt) {
          const timeRemaining = Math.floor(authStatus.timeRemaining / (1000 * 60)); // minutes
          console.log(`Token expires in ${timeRemaining} minutes at ${authStatus.expiresAt.toLocaleString()}`);
        }
        
      } catch (error) {
        console.error('Auth check error:', error);
        // On any error, redirect to login for safety
        router.push('/login');
        return;
      } finally {
        setIsChecking(false);
      }
    };

    // Run the check
    checkAuthentication();
  }, [router, adminOnly]);

  // Show loading state while checking
  if (isChecking) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '200px',
        padding: '2rem'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #4a69bd',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '1rem'
        }}></div>
        <p>Verifying authentication...</p>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Only render children if authorized
  if (!isAuthorized) {
    return null; // This prevents flash of content before redirect
  }

  return children;
}