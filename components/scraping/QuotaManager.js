import { useState, useEffect } from 'react';
import { FaEdit, FaSave, FaTimes, FaCog, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import theme from '../../styles/theme';

const QuotaManager = ({ onQuotaUpdate, showAdvanced = false }) => {
  const [quotas, setQuotas] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editValues, setEditValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchQuotas();
  }, []);

  const fetchQuotas = async () => {
    try {
      const response = await fetch('/api/scraping/config', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch quota configuration');
      }
      
      const data = await response.json();
      setQuotas(data.data.budgets);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching quotas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditValues({
      daily: quotas.daily,
      weekly: quotas.weekly,
      monthly: quotas.monthly,
      yearly: quotas.yearly
    });
    setEditing(true);
    setSuccess(null);
  };

  const handleCancel = () => {
    setEditing(false);
    setEditValues({});
    setError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      // Validate values
      const values = Object.values(editValues);
      if (values.some(v => v < 0)) {
        throw new Error('Budget values cannot be negative');
      }

      if (editValues.daily > editValues.weekly) {
        throw new Error('Daily budget cannot exceed weekly budget');
      }

      if (editValues.weekly > editValues.monthly) {
        throw new Error('Weekly budget cannot exceed monthly budget');
      }

      if (editValues.monthly > editValues.yearly) {
        throw new Error('Monthly budget cannot exceed yearly budget');
      }

      const response = await fetch('/api/scraping/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          budgets: editValues
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update quotas');
      }

      const data = await response.json();
      setQuotas(data.data.budgets);
      setEditing(false);
      setEditValues({});
      setSuccess('Quotas updated successfully!');

      if (onQuotaUpdate) {
        onQuotaUpdate(data.data.budgets);
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (period, value) => {
    setEditValues(prev => ({
      ...prev,
      [period]: parseFloat(value) || 0
    }));
  };

  const getStatusColor = (current, limit) => {
    const percentage = (current / limit) * 100;
    if (percentage >= 90) return '#ef4444';
    if (percentage >= 75) return '#f59e0b';
    if (percentage >= 50) return '#eab308';
    return '#10b981';
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center',
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.background
      }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          border: `4px solid ${theme.colors.brand.primary}20`,
          borderTop: `4px solid ${theme.colors.brand.primary}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto'
        }}></div>
        <p style={{ marginTop: '1rem', color: theme.colors.text.secondary }}>Loading quota settings...</p>
      </div>
    );
  }

  if (error && !quotas) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center',
        border: `1px solid #ef4444`,
        borderRadius: theme.borderRadius.md,
        backgroundColor: '#fef2f2'
      }}>
        <FaExclamationTriangle style={{ color: '#ef4444', fontSize: '2rem', marginBottom: '1rem' }} />
        <p style={{ color: '#dc2626', marginBottom: '1rem' }}>Error loading quota settings</p>
        <button 
          onClick={fetchQuotas}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: theme.colors.brand.primary,
            color: 'white',
            border: 'none',
            borderRadius: theme.borderRadius.sm,
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      border: `1px solid ${theme.colors.border}`,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.background,
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{ 
        padding: '1rem 1.5rem',
        borderBottom: `1px solid ${theme.colors.border}`,
        backgroundColor: theme.colors.brand.primary + '10',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0, color: theme.colors.brand.primary }}>
          <FaCog style={{ marginRight: '0.5rem' }} />
          Budget & Quota Management
        </h3>
        {!editing ? (
          <button
            onClick={handleEdit}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: theme.colors.brand.primary,
              color: 'white',
              border: 'none',
              borderRadius: theme.borderRadius.sm,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem'
            }}
          >
            <FaEdit />
            Edit Budgets
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: theme.borderRadius.sm,
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                opacity: saving ? 0.7 : 1
              }}
            >
              <FaSave />
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: theme.borderRadius.sm,
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                opacity: saving ? 0.7 : 1
              }}
            >
              <FaTimes />
              Cancel
            </button>
          </div>
        )}
      </div>

      <div style={{ padding: '1.5rem' }}>
        {/* Success Message */}
        {success && (
          <div style={{ 
            padding: '0.75rem',
            marginBottom: '1.5rem',
            borderRadius: theme.borderRadius.sm,
            backgroundColor: '#10b98110',
            border: '1px solid #10b98130',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <FaCheckCircle style={{ color: '#10b981' }} />
            <span style={{ color: '#10b981', fontWeight: 'bold' }}>
              {success}
            </span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{ 
            padding: '0.75rem',
            marginBottom: '1.5rem',
            borderRadius: theme.borderRadius.sm,
            backgroundColor: '#ef444410',
            border: '1px solid #ef444430',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <FaExclamationTriangle style={{ color: '#ef4444' }} />
            <span style={{ color: '#ef4444', fontWeight: 'bold' }}>
              {error}
            </span>
          </div>
        )}

        {/* Budget Configuration */}
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ marginBottom: '1rem', color: theme.colors.text.primary }}>
            Spending Limits
          </h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {['daily', 'weekly', 'monthly', 'yearly'].map(period => (
              <div
                key={period}
                style={{
                  padding: '1rem',
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.borderRadius.sm,
                  backgroundColor: editing ? '#f8f9fa' : theme.colors.background
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '0.5rem'
                }}>
                  <span style={{ 
                    fontWeight: 'bold', 
                    color: theme.colors.text.primary,
                    textTransform: 'capitalize'
                  }}>
                    {period} Budget
                  </span>
                </div>
                
                {editing ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.25rem', color: theme.colors.text.primary }}>$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editValues[period] || 0}
                      onChange={(e) => handleInputChange(period, e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: theme.borderRadius.sm,
                        fontSize: '1rem'
                      }}
                    />
                  </div>
                ) : (
                  <div style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: 'bold', 
                    color: theme.colors.brand.primary 
                  }}>
                    ${quotas[period].toFixed(2)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Budget Guidelines */}
        {editing && (
          <div style={{ 
            padding: '1rem',
            backgroundColor: theme.colors.brand.primary + '10',
            borderRadius: theme.borderRadius.sm,
            border: `1px solid ${theme.colors.brand.primary}30`,
            marginBottom: '2rem'
          }}>
            <h5 style={{ margin: '0 0 0.5rem 0', color: theme.colors.brand.primary }}>
              Budget Guidelines
            </h5>
            <div style={{ fontSize: '0.875rem', color: theme.colors.text.secondary }}>
              <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                <li>Daily budget should be less than weekly budget</li>
                <li>Weekly budget should be less than monthly budget</li>
                <li>Monthly budget should be less than yearly budget</li>
                <li>Set reasonable limits to control AI usage costs</li>
                <li>ScraperAPI has 5,000 free requests per month</li>
              </ul>
            </div>
          </div>
        )}

        {/* Cost Recommendations */}
        {showAdvanced && (
          <div>
            <h4 style={{ marginBottom: '1rem', color: theme.colors.text.primary }}>
              Cost Recommendations
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{
                padding: '1rem',
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.sm,
                backgroundColor: theme.colors.background
              }}>
                <h5 style={{ margin: '0 0 0.5rem 0', color: theme.colors.brand.primary }}>
                  Light Usage (1-50 scrapes/month)
                </h5>
                <div style={{ fontSize: '0.875rem', color: theme.colors.text.secondary }}>
                  <div>Recommended monthly budget: $0-5</div>
                  <div>Primarily uses free ScraperAPI tier</div>
                  <div>Occasional AI fallbacks</div>
                </div>
              </div>
              
              <div style={{
                padding: '1rem',
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.sm,
                backgroundColor: theme.colors.background
              }}>
                <h5 style={{ margin: '0 0 0.5rem 0', color: theme.colors.brand.primary }}>
                  Heavy Usage (500+ scrapes/month)
                </h5>
                <div style={{ fontSize: '0.875rem', color: theme.colors.text.secondary }}>
                  <div>Recommended monthly budget: $20-50</div>
                  <div>May exceed ScraperAPI free tier</div>
                  <div>Regular AI fallback usage</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default QuotaManager;