// components/auth/ProtectedRoute.js
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

export default function ProtectedRoute({ children, adminOnly = false }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = () => {
      const token = localStorage.getItem('token')
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      
      if (!token) {
        // Redirect to login if no token found
        router.push('/login')
        return
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
        <p>Loading...</p>
      </div>
    )
  }
  
  return children
}