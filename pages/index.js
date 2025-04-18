// pages/index.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardBase from '../components/dashboard/DashboardBase';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import Layout from '../components/Layout';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token) {
      // Redirect to login if not authenticated
      router.push('/login');
      return;
    }
  }, [router]);
  
  return (
    <ProtectedRoute>
      <Layout>
        <div className="page-transition" style={{ width: '100%' }}>
          <DashboardBase />
        </div>
      </Layout>
    </ProtectedRoute>
  );
}