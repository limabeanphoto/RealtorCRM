import Layout from '../components/Layout';
import '../styles/globals.css';
import '../styles/dashboard.css';
import { useEffect } from 'react';
import { setupAuthInterceptor } from '../utils/authInterceptor';

function MyApp({ Component, pageProps }) {
  // Initialize the auth interceptor once when the app starts
  useEffect(() => {
    setupAuthInterceptor();
  }, []);

  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}

export default MyApp