// components/auth/ProtectedRoute.js
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { isTokenExpired, refreshToken, initAuthListener } from '../../utils/tokenRefresh'
import Spinner from '../common/Spinner'

export default function ProtectedRoute({ children, adminOnly = false }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // Set up auth listener for auto refresh
    const cleanupListener = initAuthListener();
    
    // Check if user is authenticated
    const checkAuth = async () => {
      // Get token and user data from localStorage
      const token = localStorage.getItem('token')
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      
      if (!token) {
        // Redirect to login if no token found
        router.push('/login')
        return
      }
      
      // Check if token is expired
      if (isTokenExpired(token)) {
        // Try to refresh the token
        const refreshed = await refreshToken()
        
        if (!refreshed) {
          // Token refresh failed, redirect to login
          router.push('/login')
          return
        }
      }
      
      // Check if admin route requires admin role
      if (adminOnly && user.role !== 'admin') {
        // Redirect to regular dashboard if not admin
        router.push('/dashboard')
        return
      }
      
      setLoading(false)
    }
    
    checkAuth()
    
    // Clean up auth listener on unmount
    return () => {
      cleanupListener()
    }
  }, [router, adminOnly])
  
  if (loading) {
    // Show loading state while checking authentication
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Spinner />
      </div>
    )
  }
  
  return children
}