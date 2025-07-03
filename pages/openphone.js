// OpenPhone Integration Management Page

import { useState, useEffect } from 'react';
import { FaPhone, FaSync, FaCheck, FaTimes, FaExclamationTriangle, FaCog, FaSms } from 'react-icons/fa';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import theme from '../styles/theme';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Spinner from '../components/common/Spinner';

export default function OpenPhonePage() {
  return (
    <ProtectedRoute>
      <div className="page-transition">
        <h1>OpenPhone Integration</h1>
        <OpenPhoneManager />
      </div>
    </ProtectedRoute>
  );
}

const OpenPhoneManager = () => {
  const [user, setUser] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [syncingTo, setSyncingTo] = useState(false);
  const [syncingFrom, setSyncingFrom] = useState(false);
  const [setupingWebhooks, setSetupingWebhooks] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    // Get user data and test connection if API key exists
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
    
    if (userData.openPhoneApiKey) {
      testConnection();
    } else {
      setLoading(false);
    }
  }, []);

  const testConnection = async () => {
    setTesting(true);
    try {
      const response = await fetch('/api/openphone?action=test-connection', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const result = await response.json();
      setConnectionStatus(result);
      
      if (result.success) {
        setMessage({ text: 'OpenPhone connection successful!', type: 'success' });
      } else {
        setMessage({ text: `Connection failed: ${result.error}`, type: 'error' });
      }
    } catch (error) {
      setConnectionStatus({ success: false, error: 'Network error' });
      setMessage({ text: 'Failed to test connection', type: 'error' });
    } finally {
      setTesting(false);
      setLoading(false);
    }
  };

  const syncContactsToOpenPhone = async () => {
    setSyncingTo(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await fetch('/api/openphone?action=sync-contacts-to-openphone', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (result.success) {
        const { total, synced, failed } = result.results;
        setMessage({
          text: `Sync completed: ${synced}/${total} contacts synced to OpenPhone${failed > 0 ? `, ${failed} failed` : ''}`,
          type: failed > 0 ? 'warning' : 'success'
        });
      } else {
        setMessage({ text: `Sync failed: ${result.error}`, type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'Failed to sync contacts', type: 'error' });
    } finally {
      setSyncingTo(false);
    }
  };

  const syncContactsFromOpenPhone = async () => {
    setSyncingFrom(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await fetch('/api/openphone?action=sync-contacts-from-openphone', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (result.success) {
        const { total, created, updated } = result.results;
        setMessage({
          text: `Sync completed: ${created} new contacts created, ${updated} contacts updated from ${total} OpenPhone contacts`,
          type: 'success'
        });
      } else {
        setMessage({ text: `Sync failed: ${result.error}`, type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'Failed to sync contacts', type: 'error' });
    } finally {
      setSyncingFrom(false);
    }
  };

  const setupWebhooks = async () => {
    setSetupingWebhooks(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await fetch('/api/openphone?action=setup-webhooks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (result.success) {
        setMessage({
          text: 'Webhooks configured successfully! Call logging will now work automatically.',
          type: 'success'
        });
      } else {
        setMessage({ text: `Webhook setup failed: ${result.error}`, type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'Failed to setup webhooks', type: 'error' });
    } finally {
      setSetupingWebhooks(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <Spinner />
          <p>Testing OpenPhone connection...</p>
        </div>
      </Card>
    );
  }

  if (!user?.openPhoneApiKey) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <FaExclamationTriangle 
            size={48} 
            color={theme.colors.brand.secondary} 
            style={{ marginBottom: '1rem' }}
          />
          <h2>OpenPhone Not Configured</h2>
          <p style={{ color: theme.colors.brand.text, marginBottom: '1.5rem' }}>
            You need to configure your OpenPhone API key in settings before using the integration.
          </p>
          <Button
            variant="primary"
            onClick={() => window.location.href = '/settings'}
          >
            <FaCog style={{ marginRight: '0.5rem' }} />
            Go to Settings
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      {/* Message */}
      {message.text && (
        <div style={{
          padding: '1rem',
          borderRadius: theme.borderRadius.md,
          backgroundColor: message.type === 'error' ? '#f8d7da' :
                           message.type === 'success' ? '#d4edda' :
                           message.type === 'warning' ? '#fff3cd' : '#f8f9fa',
          color: message.type === 'error' ? '#721c24' :
                 message.type === 'success' ? '#155724' :
                 message.type === 'warning' ? '#856404' : '#383d41',
          border: `1px solid ${message.type === 'error' ? '#f5c6cb' :
                               message.type === 'success' ? '#c3e6cb' :
                               message.type === 'warning' ? '#ffeaa7' : '#d6d8db'}`
        }}>
          {message.text}
        </div>
      )}

      {/* Connection Status */}
      <Card>
        <h2>Connection Status</h2>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem',
          backgroundColor: connectionStatus?.success ? '#d4edda' : '#f8d7da',
          borderRadius: theme.borderRadius.sm,
          marginBottom: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {connectionStatus?.success ? (
              <FaCheck color="#155724" />
            ) : (
              <FaTimes color="#721c24" />
            )}
            <span style={{
              color: connectionStatus?.success ? '#155724' : '#721c24',
              fontWeight: 'bold'
            }}>
              {connectionStatus?.success ? 'Connected to OpenPhone' : 'Connection Failed'}
            </span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={testConnection}
            disabled={testing}
          >
            {testing ? <Spinner size="sm" /> : 'Test Connection'}
          </Button>
        </div>

        {connectionStatus?.error && (
          <p style={{ color: '#721c24', fontSize: '0.9rem' }}>
            Error: {connectionStatus.error}
          </p>
        )}
      </Card>

      {/* Contact Sync */}
      <Card>
        <h2>Contact Synchronization</h2>
        <p style={{ color: theme.colors.brand.text, marginBottom: '1.5rem' }}>
          Keep your CRM and OpenPhone contacts in sync. You can sync contacts in both directions.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <h3>Sync to OpenPhone</h3>
            <p style={{ color: theme.colors.brand.text, fontSize: '0.9rem', marginBottom: '1rem' }}>
              Upload your CRM contacts to OpenPhone
            </p>
            <Button
              variant="primary"
              onClick={syncContactsToOpenPhone}
              disabled={syncingTo || !connectionStatus?.success}
              style={{ width: '100%' }}
            >
              {syncingTo ? (
                <><Spinner size="sm" style={{ marginRight: '0.5rem' }} /> Syncing...</>
              ) : (
                <><FaSync style={{ marginRight: '0.5rem' }} /> Sync to OpenPhone</>
              )}
            </Button>
          </div>

          <div>
            <h3>Sync from OpenPhone</h3>
            <p style={{ color: theme.colors.brand.text, fontSize: '0.9rem', marginBottom: '1rem' }}>
              Import contacts from OpenPhone to CRM
            </p>
            <Button
              variant="secondary"
              onClick={syncContactsFromOpenPhone}
              disabled={syncingFrom || !connectionStatus?.success}
              style={{ width: '100%' }}
            >
              {syncingFrom ? (
                <><Spinner size="sm" style={{ marginRight: '0.5rem' }} /> Syncing...</>
              ) : (
                <><FaSync style={{ marginRight: '0.5rem' }} /> Sync from OpenPhone</>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Webhooks Setup */}
      <Card>
        <h2>Automatic Call Logging</h2>
        <p style={{ color: theme.colors.brand.text, marginBottom: '1.5rem' }}>
          Set up webhooks to automatically log calls from OpenPhone to your CRM. This enables real-time call tracking and post-call popups.
        </p>

        <Button
          variant="primary"
          onClick={setupWebhooks}
          disabled={setupingWebhooks || !connectionStatus?.success}
        >
          {setupingWebhooks ? (
            <><Spinner size="sm" style={{ marginRight: '0.5rem' }} /> Setting up...</>
          ) : (
            <><FaCog style={{ marginRight: '0.5rem' }} /> Setup Webhooks</>
          )}
        </Button>
      </Card>

      {/* Features Available */}
      <Card>
        <h2>Available Features</h2>
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem',
            backgroundColor: '#f8f9fa',
            borderRadius: theme.borderRadius.sm
          }}>
            <FaPhone color={theme.colors.brand.primary} />
            <span><strong>Click-to-Call:</strong> Call contacts directly from CRM contact records</span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem',
            backgroundColor: '#f8f9fa',
            borderRadius: theme.borderRadius.sm
          }}>
            <FaSync color={theme.colors.brand.primary} />
            <span><strong>Automatic Call Logging:</strong> Calls are automatically logged to CRM with webhooks</span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem',
            backgroundColor: '#f8f9fa',
            borderRadius: theme.borderRadius.sm
          }}>
            <FaSms color={theme.colors.brand.primary} />
            <span><strong>SMS Integration:</strong> Send follow-up messages directly from call notes</span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem',
            backgroundColor: '#f8f9fa',
            borderRadius: theme.borderRadius.sm
          }}>
            <FaCheck color={theme.colors.brand.primary} />
            <span><strong>Post-Call Popups:</strong> Capture notes and update contact status after calls</span>
          </div>
        </div>
      </Card>
    </div>
  );
};