// components/contacts/ScrapeContactModal.js
import { useState, useEffect, useRef } from 'react';
import BaseModal from '../common/BaseModal';
import Button from '../common/Button';
import theme from '../../styles/theme';
import { 
  FaExternalLinkAlt, 
  FaExclamationTriangle, 
  FaCheck, 
  FaSpinner,
  FaRobot,
  FaGlobe,
  FaEye,
  FaDollarSign,
  FaClock,
  FaChartBar,
  FaLightbulb,
  FaShieldAlt,
  FaLayerGroup,
  FaArrowRight,
  FaCheckCircle,
  FaTimesCircle,
  FaInfoCircle,
  FaQuestionCircle,
  FaSync,
  FaStopwatch,
  FaWifi,
  FaSignal,
  FaDatabase,
  FaCloud,
  FaMicrochip,
  FaSearch
} from 'react-icons/fa';

const ScrapeContactModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  onViewExistingContact
}) => {
  // Basic state
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [contactData, setContactData] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  
  // Enhanced state for new features
  const [scrapingStage, setScrapingStage] = useState('idle'); // idle, fetching, extracting, analyzing, complete
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [progressDetails, setProgressDetails] = useState({});
  const [confidence, setConfidence] = useState(null);
  const [provider, setProvider] = useState('');
  const [metadata, setMetadata] = useState({});
  const [usageMetrics, setUsageMetrics] = useState({});
  const [costInfo, setCostInfo] = useState({});
  const [performanceMetrics, setPerformanceMetrics] = useState({});
  const [extractionQuality, setExtractionQuality] = useState({});
  const [useRealtimeUpdates, setUseRealtimeUpdates] = useState(true);
  const [startTime, setStartTime] = useState(null);
  const [streamConnected, setStreamConnected] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [maxRetries] = useState(3);
  
  // SSE connection ref
  const eventSourceRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup any ongoing operations
      setLoading(false);
      setStreamConnected(false);
    };
  }, []);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen]);

  // Reset all state to initial values
  const resetState = () => {
    setUrl('');
    setLoading(false);
    setError('');
    setSuccess('');
    setContactData(null);
    setValidationErrors([]);
    setDuplicates([]);
    setShowDuplicateWarning(false);
    setScrapingStage('idle');
    setProgress(0);
    setProgressMessage('');
    setProgressDetails({});
    setConfidence(null);
    setProvider('');
    setMetadata({});
    setUsageMetrics({});
    setCostInfo({});
    setPerformanceMetrics({});
    setExtractionQuality({});
    setStartTime(null);
    setStreamConnected(false);
    setRetryCount(0);
    
    // Reset any ongoing stream connections
    setStreamConnected(false);
  };

  // Handle URL change
  const handleUrlChange = (e) => {
    setUrl(e.target.value);
    // Clear any previous errors/success when user starts typing
    setError('');
    setSuccess('');
    setValidationErrors([]);
    setScrapingStage('idle');
    setProgress(0);
    setProgressMessage('');
  };

  // Validate the URL
  const validateUrl = (url) => {
    if (!url || url.trim() === '') {
      setError('Please enter a URL');
      return false;
    }

    try {
      const parsedUrl = new URL(url);
      if (!parsedUrl.hostname.includes('realtor.com')) {
        setError('Only Realtor.com profile URLs are currently supported');
        return false;
      }

      if (!parsedUrl.pathname.includes('/realestateagents/')) {
        setError('URL must be a Realtor.com agent profile');
        return false;
      }

      return true;
    } catch (e) {
      setError('Please enter a valid URL');
      return false;
    }
  };

  // Handle form submission with enhanced SSE support
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous state
    setError('');
    setSuccess('');
    setValidationErrors([]);
    setContactData(null);
    setDuplicates([]);
    setShowDuplicateWarning(false);
    setScrapingStage('idle');
    setProgress(0);
    setProgressMessage('');
    setConfidence(null);
    setProvider('');
    setMetadata({});
    setUsageMetrics({});
    setCostInfo({});
    setPerformanceMetrics({});
    setExtractionQuality({});
    
    // Validate URL
    if (!validateUrl(url)) {
      return;
    }
    
    setLoading(true);
    setStartTime(Date.now());
    setScrapingStage('initializing');
    setProgress(5);
    setProgressMessage('Initializing scraper...');
    
    try {
      if (useRealtimeUpdates) {
        await handleRealtimeScraping();
      } else {
        await handleStandardScraping();
      }
    } catch (error) {
      console.error('Error in scraping process:', error);
      setError('An error occurred while scraping the contact information');
      setScrapingStage('error');
      setLoading(false);
    }
  };

  // Handle real-time scraping with SSE
  const handleRealtimeScraping = () => {
    return new Promise((resolve, reject) => {
      // Create a fetch request first to initiate SSE stream
      const token = localStorage.getItem('token');
      
      fetch('/api/contacts/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ url })
      }).then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        const readStream = () => {
          reader.read().then(({ done, value }) => {
            if (done) {
              resolve();
              return;
            }
            
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  handleSSEMessage(data);
                  
                  if (data.type === 'complete') {
                    resolve(data);
                    return;
                  } else if (data.type === 'error') {
                    reject(new Error(data.message || 'Scraping failed'));
                    return;
                  }
                } catch (error) {
                  console.error('Error parsing SSE message:', error);
                }
              }
            }
            
            readStream();
          }).catch(reject);
        };
        
        readStream();
      }).catch(error => {
        console.error('SSE stream error:', error);
        setStreamConnected(false);
        
        // Fallback to standard scraping
        setProgressMessage('Stream connection failed, falling back to standard mode...');
        handleStandardScraping().then(resolve).catch(reject);
      });
      
      // Set connected status
      setStreamConnected(true);
      setScrapingStage('connecting');
      setProgress(10);
      setProgressMessage('Connected to scraping service');
      
      // Timeout after 60 seconds
      setTimeout(() => {
        reject(new Error('Scraping timeout'));
      }, 60000);
    });
  };

  // Handle standard scraping (fallback)
  const handleStandardScraping = async () => {
    setScrapingStage('fetching');
    setProgress(20);
    setProgressMessage('Fetching page content...');
    
    const scrapeResponse = await fetch('/api/contacts/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ url })
    });
    
    const scrapeData = await scrapeResponse.json();
    
    if (!scrapeData.success) {
      throw new Error(scrapeData.message || 'Failed to scrape contact information');
    }
    
    // Process the result
    processScrapingResult(scrapeData);
  };

  // Handle SSE messages
  const handleSSEMessage = (data) => {
    switch (data.type) {
      case 'connected':
        setStreamConnected(true);
        setProgress(15);
        setProgressMessage('Connected to scraping stream');
        break;
        
      case 'progress':
        setScrapingStage(data.stage || 'processing');
        setProgress(data.progress || 0);
        setProgressMessage(data.message || '');
        setProgressDetails(data.details || {});
        
        if (data.provider) {
          setProvider(data.provider);
        }
        break;
        
      case 'complete':
        processScrapingResult(data);
        break;
        
      case 'error':
        setError(data.message || 'Scraping failed');
        setScrapingStage('error');
        setLoading(false);
        break;
        
      case 'end':
        setStreamConnected(false);
        break;
    }
  };

  // Process the final scraping result
  const processScrapingResult = async (result) => {
    setScrapingStage('validating');
    setProgress(90);
    setProgressMessage('Validating extracted data...');
    
    // Store result metadata
    setConfidence(result.confidence);
    setProvider(result.provider);
    setMetadata(result.metadata || {});
    setUsageMetrics(result.metadata?.usageTracking || {});
    setCostInfo(result.metadata?.costInfo || {});
    setPerformanceMetrics(result.metadata?.performance || {});
    setExtractionQuality(result.metadata?.extractionQuality || {});
    
    if (!result.success) {
      setError(result.message || result.error?.message || 'Failed to scrape contact information');
      setScrapingStage('error');
      setLoading(false);
      return;
    }
    
    // Validate the scraped data
    const errors = validateContactData(result.data);
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      setScrapingStage('validation_failed');
      setLoading(false);
      return;
    }
    
    // Set the contact data
    setContactData(result.data);
    setScrapingStage('complete');
    setProgress(100);
    setProgressMessage('Contact information successfully extracted!');
    setSuccess('Successfully scraped contact information!');
    
    // Try to create the contact
    try {
      const formData = {
        name: result.data.name,
        email: result.data.email || '',
        phone: result.data.phone,
        company: result.data.company || '',
        profileLink: result.data.profileLink || url
      };
      
      if (onSubmit) {
        const submitResult = await onSubmit(formData);
        
        // Check if duplicates were found
        if (submitResult && !submitResult.success && submitResult.duplicates) {
          setDuplicates(submitResult.duplicates);
          setShowDuplicateWarning(true);
        } else if (submitResult && submitResult.success) {
          // Close the modal on success
          setTimeout(() => onClose(), 1500);
        }
      }
    } catch (error) {
      console.error('Error creating contact:', error);
      setError('Contact extracted successfully but failed to save');
    } finally {
      setLoading(false);
    }
  };
  
  // Validate the scraped contact data
  const validateContactData = (data) => {
    const errors = [];
    
    if (!data.name || data.name.trim() === '') {
      errors.push('Name is missing');
    }
    
    if (!data.phone || data.phone.trim() === '') {
      errors.push('Phone number is missing');
    } else {
      // Simple phone validation
      const phoneRegex = /^\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})$/;
      if (!phoneRegex.test(data.phone)) {
        errors.push('Phone number format is invalid');
      }
    }
    
    // Email validation if email is present
    if (data.email && data.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        errors.push('Email format is invalid');
      }
    }
    
    return errors;
  };
  
  // Handle viewing an existing contact
  const handleViewExistingContact = (contact) => {
    setShowDuplicateWarning(false);
    if (onViewExistingContact) {
      onViewExistingContact(contact);
    }
    onClose();
  };
  
  // Handle creating a contact anyway (despite duplicates)
  const handleCreateAnyway = async () => {
    setShowDuplicateWarning(false);
    
    if (contactData && onSubmit) {
      const formData = {
        name: contactData.name,
        email: contactData.email || '',
        phone: contactData.phone,
        company: contactData.company || '',
        profileLink: contactData.profileLink || url,
        forceCreate: true // Add flag to force creation
      };
      
      const result = await onSubmit(formData);
      
      if (result && result.success) {
        // Close the modal on success
        setTimeout(() => onClose(), 1000);
      }
    }
  };

  // Handle retry with intelligent suggestions
  const handleRetry = () => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      setError('');
      setScrapingStage('idle');
      setProgress(0);
      setProgressMessage('');
      
      // Retry with different settings based on failure type
      if (error.includes('timeout')) {
        setUseRealtimeUpdates(false); // Use standard mode for timeout issues
      }
      
      handleSubmit({ preventDefault: () => {} });
    }
  };

  // Get confidence color based on score
  const getConfidenceColor = (score) => {
    if (score >= 90) return theme.colors.success[500];
    if (score >= 75) return theme.colors.success[400];
    if (score >= 60) return theme.colors.warning[500];
    if (score >= 40) return theme.colors.warning[600];
    return theme.colors.error[500];
  };

  // Get confidence label based on score
  const getConfidenceLabel = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Fair';
    if (score >= 40) return 'Poor';
    return 'Very Poor';
  };

  // Get stage icon
  const getStageIcon = (stage) => {
    switch (stage) {
      case 'initializing':
      case 'connecting':
        return <FaWifi />;
      case 'fetching':
        return <FaGlobe />;
      case 'extracting':
        return <FaSearch />;
      case 'analyzing':
        return <FaRobot />;
      case 'validating':
        return <FaShieldAlt />;
      case 'complete':
        return <FaCheckCircle />;
      case 'error':
        return <FaTimesCircle />;
      default:
        return <FaSpinner className="spinner" />;
    }
  };

  // Get provider icon
  const getProviderIcon = (providerName) => {
    if (providerName?.toLowerCase().includes('scraper')) return <FaGlobe />;
    if (providerName?.toLowerCase().includes('ai')) return <FaRobot />;
    if (providerName?.toLowerCase().includes('gemini')) return <FaMicrochip />;
    if (providerName?.toLowerCase().includes('openai')) return <FaCloud />;
    return <FaDatabase />;
  };

  // Format duration
  const formatDuration = (startTime) => {
    if (!startTime) return '0s';
    const duration = Date.now() - startTime;
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(1)}s`;
  };

  // Format cost
  const formatCost = (cost) => {
    if (typeof cost !== 'number') return 'N/A';
    return `$${cost.toFixed(4)}`;
  };

  return (
    <>
      <BaseModal 
        isOpen={isOpen} 
        onClose={onClose} 
        title="Intelligent Contact Scraper"
        maxWidth="800px"
      >
        <div style={{ position: 'relative' }}>
          {/* Connection Status Indicator */}
          {loading && useRealtimeUpdates && (
            <div style={{
              position: 'absolute',
              top: '-10px',
              right: '0px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.75rem',
              color: streamConnected ? theme.colors.success[600] : theme.colors.neutral[500],
            }}>
              <FaSignal style={{ 
                opacity: streamConnected ? 1 : 0.5,
                animation: streamConnected ? 'none' : 'pulse 2s infinite'
              }} />
              {streamConnected ? 'Live Updates' : 'Connecting...'}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            {/* Enhanced Error Display */}
            {error && (
              <div style={{ 
                backgroundColor: theme.colors.error[50], 
                color: theme.colors.error[800], 
                padding: '1rem', 
                borderRadius: theme.borderRadius.lg,
                marginBottom: '1rem',
                border: `1px solid ${theme.colors.error[200]}`
              }}>
                <div style={{ 
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  marginBottom: '0.5rem'
                }}>
                  <FaExclamationTriangle style={{ 
                    marginTop: '0.25rem',
                    color: theme.colors.error[500]
                  }} />
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                      Scraping Failed
                    </div>
                    <div>{error}</div>
                  </div>
                </div>
                
                {/* Retry option */}
                {retryCount < maxRetries && (
                  <div style={{ 
                    marginTop: '0.75rem',
                    paddingTop: '0.75rem',
                    borderTop: `1px solid ${theme.colors.error[200]}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ fontSize: '0.875rem', color: theme.colors.error[600] }}>
                      Attempt {retryCount + 1} of {maxRetries + 1}
                    </div>
                    <Button
                      type="button"
                      onClick={handleRetry}
                      size="small"
                      variant="outline"
                      style={{
                        borderColor: theme.colors.error[300],
                        color: theme.colors.error[600]
                      }}
                    >
                      <FaSync style={{ marginRight: '0.25rem' }} />
                      Retry
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Progress Display */}
            {loading && (
              <div style={{ 
                backgroundColor: theme.colors.primary[50], 
                padding: '1rem', 
                borderRadius: theme.borderRadius.lg,
                marginBottom: '1rem',
                border: `1px solid ${theme.colors.primary[200]}`
              }}>
                {/* Progress Header */}
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.75rem'
                }}>
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontWeight: 'bold',
                    color: theme.colors.primary[800]
                  }}>
                    <div style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      {getStageIcon(scrapingStage)}
                      <span style={{ textTransform: 'capitalize' }}>
                        {scrapingStage.replace('_', ' ')}
                      </span>
                    </div>
                    {provider && (
                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.75rem',
                        color: theme.colors.primary[600],
                        backgroundColor: theme.colors.primary[100],
                        padding: '0.25rem 0.5rem',
                        borderRadius: theme.borderRadius.sm
                      }}>
                        {getProviderIcon(provider)}
                        {provider}
                      </div>
                    )}
                  </div>
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.875rem',
                    color: theme.colors.primary[600]
                  }}>
                    <FaStopwatch />
                    {formatDuration(startTime)}
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div style={{ 
                  width: '100%',
                  height: '8px',
                  backgroundColor: theme.colors.primary[200],
                  borderRadius: theme.borderRadius.full,
                  overflow: 'hidden',
                  marginBottom: '0.5rem'
                }}>
                  <div style={{ 
                    width: `${progress}%`,
                    height: '100%',
                    backgroundColor: theme.colors.primary[500],
                    borderRadius: theme.borderRadius.full,
                    transition: 'width 0.3s ease-in-out'
                  }} />
                </div>
                
                {/* Progress Message */}
                <div style={{ 
                  fontSize: '0.875rem',
                  color: theme.colors.primary[700],
                  marginBottom: '0.5rem'
                }}>
                  {progressMessage}
                </div>
                
                {/* Progress Details */}
                {Object.keys(progressDetails).length > 0 && (
                  <div style={{ 
                    fontSize: '0.75rem',
                    color: theme.colors.primary[600],
                    backgroundColor: theme.colors.primary[100],
                    padding: '0.5rem',
                    borderRadius: theme.borderRadius.sm,
                    marginTop: '0.5rem'
                  }}>
                    {Object.entries(progressDetails).map(([key, value]) => (
                      <div key={key} style={{ 
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '0.25rem'
                      }}>
                        <span style={{ textTransform: 'capitalize' }}>{key}:</span>
                        <span>{value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          
            {/* Enhanced Success Display */}
            {success && !error && (
              <div style={{ 
                backgroundColor: theme.colors.success[50], 
                color: theme.colors.success[800], 
                padding: '1rem', 
                borderRadius: theme.borderRadius.lg,
                marginBottom: '1rem',
                border: `1px solid ${theme.colors.success[200]}`
              }}>
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '0.5rem'
                }}>
                  <FaCheckCircle style={{ 
                    color: theme.colors.success[500],
                    fontSize: '1.25rem'
                  }} />
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                      Extraction Successful!
                    </div>
                    <div>{success}</div>
                  </div>
                </div>
                
                {/* Quality Metrics */}
                {(confidence !== null || provider) && (
                  <div style={{ 
                    display: 'flex',
                    gap: '1rem',
                    marginTop: '0.75rem',
                    paddingTop: '0.75rem',
                    borderTop: `1px solid ${theme.colors.success[200]}`,
                    fontSize: '0.875rem'
                  }}>
                    {confidence !== null && (
                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        <FaShieldAlt style={{ color: getConfidenceColor(confidence) }} />
                        <span style={{ color: theme.colors.success[700] }}>
                          Confidence: {confidence}% ({getConfidenceLabel(confidence)})
                        </span>
                      </div>
                    )}
                    {provider && (
                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        {getProviderIcon(provider)}
                        <span style={{ color: theme.colors.success[700] }}>
                          Method: {provider}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Usage and Performance Metrics */}
            {(Object.keys(usageMetrics).length > 0 || Object.keys(performanceMetrics).length > 0) && (
              <div style={{ 
                backgroundColor: theme.colors.info[50], 
                padding: '1rem', 
                borderRadius: theme.borderRadius.lg,
                marginBottom: '1rem',
                border: `1px solid ${theme.colors.info[200]}`
              }}>
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.75rem',
                  fontWeight: 'bold',
                  color: theme.colors.info[800]
                }}>
                  <FaChartBar />
                  Usage & Performance
                </div>
                
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem'
                }}>
                  {/* Usage Metrics */}
                  {Object.keys(usageMetrics).length > 0 && (
                    <div>
                      <div style={{ 
                        fontSize: '0.875rem',
                        fontWeight: 'bold',
                        marginBottom: '0.5rem',
                        color: theme.colors.info[700]
                      }}>
                        Usage Tracking
                      </div>
                      {Object.entries(usageMetrics).map(([key, value]) => (
                        <div key={key} style={{ 
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.75rem',
                          color: theme.colors.info[600],
                          marginBottom: '0.25rem'
                        }}>
                          <span>{key.replace(/([A-Z])/g, ' $1').toLowerCase()}:</span>
                          <span>{typeof value === 'number' ? value.toFixed(2) : value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Performance Metrics */}
                  {Object.keys(performanceMetrics).length > 0 && (
                    <div>
                      <div style={{ 
                        fontSize: '0.875rem',
                        fontWeight: 'bold',
                        marginBottom: '0.5rem',
                        color: theme.colors.info[700]
                      }}>
                        Performance
                      </div>
                      {Object.entries(performanceMetrics).map(([key, value]) => (
                        <div key={key} style={{ 
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.75rem',
                          color: theme.colors.info[600],
                          marginBottom: '0.25rem'
                        }}>
                          <span>{key.replace(/([A-Z])/g, ' $1').toLowerCase()}:</span>
                          <span>{typeof value === 'number' ? `${value}ms` : value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Cost Information */}
                {Object.keys(costInfo).length > 0 && (
                  <div style={{ 
                    marginTop: '0.75rem',
                    paddingTop: '0.75rem',
                    borderTop: `1px solid ${theme.colors.info[200]}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.875rem',
                    color: theme.colors.info[700]
                  }}>
                    <FaDollarSign />
                    Cost: {formatCost(costInfo.totalCost)} 
                    {costInfo.breakdown && ` (${Object.entries(costInfo.breakdown).map(([k, v]) => `${k}: ${formatCost(v)}`).join(', ')})`}
                  </div>
                )}
              </div>
            )}
          
            {/* Enhanced Validation Errors */}
            {validationErrors.length > 0 && (
              <div style={{ 
                backgroundColor: theme.colors.warning[50], 
                color: theme.colors.warning[800], 
                padding: '1rem', 
                borderRadius: theme.borderRadius.lg,
                marginBottom: '1rem',
                border: `1px solid ${theme.colors.warning[200]}`
              }}>
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.75rem'
                }}>
                  <FaExclamationTriangle style={{ color: theme.colors.warning[500] }} />
                  <div style={{ fontWeight: 'bold' }}>
                    Data Quality Issues Detected
                  </div>
                </div>
                <ul style={{ margin: '0', paddingLeft: '1.5rem' }}>
                  {validationErrors.map((error, index) => (
                    <li key={index} style={{ 
                      marginBottom: '0.5rem',
                      color: theme.colors.warning[700]
                    }}>
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          
            {/* Enhanced URL Input */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.5rem'
              }}>
                <label style={{ fontWeight: '500', color: theme.colors.neutral[700] }}>
                  Realtor.com Profile URL
                </label>
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.75rem'
                }}>
                  <input
                    type="checkbox"
                    checked={useRealtimeUpdates}
                    onChange={(e) => setUseRealtimeUpdates(e.target.checked)}
                    disabled={loading}
                    style={{ margin: 0 }}
                  />
                  <span style={{ 
                    color: theme.colors.neutral[600],
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <FaWifi /> Live Updates
                  </span>
                </div>
              </div>
              <input
                type="url"
                value={url}
                onChange={handleUrlChange}
                placeholder="https://www.realtor.com/realestateagents/..."
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  borderRadius: theme.borderRadius.lg, 
                  border: `1px solid ${theme.colors.neutral[300]}`,
                  fontSize: '0.875rem',
                  transition: 'border-color 0.2s ease-in-out',
                  outline: 'none'
                }}
                disabled={loading}
                required
                onFocus={(e) => e.target.style.borderColor = theme.colors.primary[400]}
                onBlur={(e) => e.target.style.borderColor = theme.colors.neutral[300]}
              />
              <div style={{ 
                fontSize: '0.75rem', 
                color: theme.colors.neutral[500], 
                marginTop: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <FaLightbulb />
                Example: https://www.realtor.com/realestateagents/5fabcced9829b90011681b8e
              </div>
            </div>
          
            {/* Enhanced Contact Preview */}
            {contactData && (
              <div style={{ 
                backgroundColor: theme.colors.accent[50], 
                padding: '1.5rem', 
                borderRadius: theme.borderRadius.lg,
                marginBottom: '1.5rem',
                border: `1px solid ${theme.colors.accent[200]}`
              }}>
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1rem'
                }}>
                  <h3 style={{ 
                    margin: '0', 
                    color: theme.colors.accent[800],
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <FaEye />
                    Extracted Contact Details
                  </h3>
                  {confidence !== null && (
                    <div style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.875rem',
                      color: getConfidenceColor(confidence),
                      backgroundColor: `${getConfidenceColor(confidence)}20`,
                      padding: '0.25rem 0.5rem',
                      borderRadius: theme.borderRadius.sm,
                      fontWeight: 'bold'
                    }}>
                      <FaShieldAlt />
                      {confidence}% {getConfidenceLabel(confidence)}
                    </div>
                  )}
                </div>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  {/* Name Field */}
                  <div style={{ 
                    backgroundColor: 'white',
                    padding: '0.75rem',
                    borderRadius: theme.borderRadius.md,
                    border: `1px solid ${theme.colors.accent[200]}`
                  }}>
                    <div style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '0.5rem'
                    }}>
                      <div style={{ fontWeight: 'bold', fontSize: '0.875rem', color: theme.colors.accent[700] }}>
                        Name
                      </div>
                      {contactData.confidence?.name && (
                        <div style={{ 
                          fontSize: '0.75rem',
                          color: getConfidenceColor(contactData.confidence.name),
                          fontWeight: 'bold'
                        }}>
                          {contactData.confidence.name}%
                        </div>
                      )}
                    </div>
                    <div style={{ color: theme.colors.neutral[800] }}>{contactData.name}</div>
                  </div>

                  {/* Phone Field */}
                  <div style={{ 
                    backgroundColor: 'white',
                    padding: '0.75rem',
                    borderRadius: theme.borderRadius.md,
                    border: `1px solid ${theme.colors.accent[200]}`
                  }}>
                    <div style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '0.5rem'
                    }}>
                      <div style={{ fontWeight: 'bold', fontSize: '0.875rem', color: theme.colors.accent[700] }}>
                        Phone
                      </div>
                      {contactData.confidence?.phone && (
                        <div style={{ 
                          fontSize: '0.75rem',
                          color: getConfidenceColor(contactData.confidence.phone),
                          fontWeight: 'bold'
                        }}>
                          {contactData.confidence.phone}%
                        </div>
                      )}
                    </div>
                    <div style={{ color: theme.colors.neutral[800] }}>{contactData.phone}</div>
                  </div>

                  {/* Company Field */}
                  {contactData.company && (
                    <div style={{ 
                      backgroundColor: 'white',
                      padding: '0.75rem',
                      borderRadius: theme.borderRadius.md,
                      border: `1px solid ${theme.colors.accent[200]}`
                    }}>
                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.5rem'
                      }}>
                        <div style={{ fontWeight: 'bold', fontSize: '0.875rem', color: theme.colors.accent[700] }}>
                          Company
                        </div>
                        {contactData.confidence?.company && (
                          <div style={{ 
                            fontSize: '0.75rem',
                            color: getConfidenceColor(contactData.confidence.company),
                            fontWeight: 'bold'
                          }}>
                            {contactData.confidence.company}%
                          </div>
                        )}
                      </div>
                      <div style={{ color: theme.colors.neutral[800] }}>{contactData.company}</div>
                    </div>
                  )}

                  {/* Email Field */}
                  {contactData.email && (
                    <div style={{ 
                      backgroundColor: 'white',
                      padding: '0.75rem',
                      borderRadius: theme.borderRadius.md,
                      border: `1px solid ${theme.colors.accent[200]}`
                    }}>
                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.5rem'
                      }}>
                        <div style={{ fontWeight: 'bold', fontSize: '0.875rem', color: theme.colors.accent[700] }}>
                          Email
                        </div>
                        {contactData.confidence?.email && (
                          <div style={{ 
                            fontSize: '0.75rem',
                            color: getConfidenceColor(contactData.confidence.email),
                            fontWeight: 'bold'
                          }}>
                            {contactData.confidence.email}%
                          </div>
                        )}
                      </div>
                      <div style={{ color: theme.colors.neutral[800] }}>{contactData.email}</div>
                    </div>
                  )}

                  {/* Description Field */}
                  {contactData.description && (
                    <div style={{ 
                      backgroundColor: 'white',
                      padding: '0.75rem',
                      borderRadius: theme.borderRadius.md,
                      border: `1px solid ${theme.colors.accent[200]}`,
                      gridColumn: '1 / -1'
                    }}>
                      <div style={{ 
                        fontWeight: 'bold', 
                        fontSize: '0.875rem', 
                        color: theme.colors.accent[700],
                        marginBottom: '0.5rem'
                      }}>
                        Description
                      </div>
                      <div style={{ 
                        color: theme.colors.neutral[800],
                        fontSize: '0.875rem',
                        lineHeight: '1.4'
                      }}>
                        {contactData.description.length > 200 
                          ? `${contactData.description.substring(0, 200)}...` 
                          : contactData.description}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Link */}
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '1rem',
                  borderTop: `1px solid ${theme.colors.accent[200]}`
                }}>
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <a 
                      href={contactData.profileLink || url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        color: theme.colors.accent[600],
                        gap: '0.25rem',
                        fontSize: '0.875rem',
                        textDecoration: 'none'
                      }}
                    >
                      <FaExternalLinkAlt size={12} />
                      View Original Profile
                    </a>
                  </div>
                  
                  {/* Extraction Summary */}
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    fontSize: '0.75rem',
                    color: theme.colors.accent[600]
                  }}>
                    {provider && (
                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        {getProviderIcon(provider)}
                        {provider}
                      </div>
                    )}
                    {startTime && (
                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        <FaClock />
                        {formatDuration(startTime)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          
            {/* Enhanced Action Buttons */}
            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginTop: '2rem',
              paddingTop: '1rem',
              borderTop: `1px solid ${theme.colors.neutral[200]}`
            }}>
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.75rem',
                color: theme.colors.neutral[500]
              }}>
                {retryCount > 0 && (
                  <>
                    <FaInfoCircle />
                    Attempt {retryCount + 1} of {maxRetries + 1}
                  </>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <Button
                  type="button"
                  onClick={onClose}
                  variant="outline"
                  disabled={loading}
                  style={{
                    borderColor: theme.colors.neutral[300],
                    color: theme.colors.neutral[600]
                  }}
                >
                  {loading ? 'Close' : 'Cancel'}
                </Button>
                
                {/* Show stop button during scraping */}
                {loading && (
                  <Button
                    type="button"
                    onClick={() => {
                      // Cancel any ongoing operations
                      setLoading(false);
                      setScrapingStage('idle');
                      setProgress(0);
                      setProgressMessage('');
                      setStreamConnected(false);
                    }}
                    variant="outline"
                    style={{
                      borderColor: theme.colors.error[300],
                      color: theme.colors.error[600]
                    }}
                  >
                    <FaTimesCircle style={{ marginRight: '0.25rem' }} />
                    Stop
                  </Button>
                )}
                
                <Button
                  type="submit"
                  disabled={loading || !url.trim()}
                  style={{
                    backgroundColor: loading 
                      ? theme.colors.primary[300] 
                      : theme.colors.primary[500],
                    borderColor: loading 
                      ? theme.colors.primary[300] 
                      : theme.colors.primary[500],
                  }}
                >
                  {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {getStageIcon(scrapingStage)}
                      {scrapingStage === 'complete' ? 'Finalizing...' : 
                       scrapingStage === 'error' ? 'Failed' :
                       scrapingStage === 'validating' ? 'Validating...' :
                       scrapingStage === 'analyzing' ? 'AI Analysis...' :
                       scrapingStage === 'extracting' ? 'Extracting...' :
                       scrapingStage === 'fetching' ? 'Fetching...' :
                       scrapingStage === 'connecting' ? 'Connecting...' :
                       'Processing...'}
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FaRobot />
                      {contactData ? 'Scrape Again' : 'Start Intelligent Scrape'}
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </BaseModal>
      
      {/* Enhanced Duplicate Warning Modal */}
      {showDuplicateWarning && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: theme.zIndex.modal + 100,
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: theme.borderRadius.xl,
              padding: '2rem',
              maxWidth: '700px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: theme.shadows['2xl'],
              animation: 'slideIn 0.3s ease-out'
            }}
          >
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                padding: '0.75rem',
                borderRadius: theme.borderRadius.full,
                backgroundColor: theme.colors.warning[100],
                color: theme.colors.warning[600]
              }}>
                <FaExclamationTriangle size={24} />
              </div>
              <div>
                <h3 style={{ 
                  margin: '0',
                  color: theme.colors.neutral[800],
                  fontSize: '1.25rem',
                  fontWeight: 'bold'
                }}>
                  Potential Duplicate Contacts Found
                </h3>
                <p style={{ 
                  margin: '0.25rem 0 0 0',
                  color: theme.colors.neutral[600],
                  fontSize: '0.875rem'
                }}>
                  We found {duplicates.length} existing contact{duplicates.length > 1 ? 's' : ''} that might match this profile
                </p>
              </div>
            </div>
            
            {/* Enhanced duplicate contacts list */}
            <div style={{ 
              backgroundColor: theme.colors.neutral[50],
              padding: '1rem',
              borderRadius: theme.borderRadius.lg,
              marginBottom: '1.5rem',
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              {duplicates.map((contact, index) => (
                <div
                  key={contact.id}
                  style={{
                    backgroundColor: 'white',
                    padding: '1.25rem',
                    borderRadius: theme.borderRadius.lg,
                    marginBottom: index < duplicates.length - 1 ? '1rem' : '0',
                    border: `1px solid ${theme.colors.neutral[200]}`,
                    boxShadow: theme.shadows.sm,
                  }}
                >
                  <div style={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '0.75rem'
                  }}>
                    <div>
                      <div style={{ 
                        fontWeight: 'bold', 
                        fontSize: '1rem',
                        color: theme.colors.neutral[800],
                        marginBottom: '0.25rem'
                      }}>
                        {contact.name}
                      </div>
                      <div style={{ 
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: '0.5rem',
                        fontSize: '0.875rem',
                        color: theme.colors.neutral[600]
                      }}>
                        <div><strong>Phone:</strong> {contact.phone}</div>
                        {contact.email && <div><strong>Email:</strong> {contact.email}</div>}
                        {contact.company && <div><strong>Company:</strong> {contact.company}</div>}
                      </div>
                    </div>
                    <Button
                      onClick={() => handleViewExistingContact(contact)}
                      variant="outline"
                      size="small"
                      style={{
                        borderColor: theme.colors.primary[300],
                        color: theme.colors.primary[600],
                        fontSize: '0.75rem'
                      }}
                    >
                      <FaEye style={{ marginRight: '0.25rem' }} />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              gap: '1rem',
              paddingTop: '1rem',
              borderTop: `1px solid ${theme.colors.neutral[200]}`
            }}>
              <Button
                onClick={() => setShowDuplicateWarning(false)}
                variant="outline"
                style={{
                  borderColor: theme.colors.neutral[300],
                  color: theme.colors.neutral[600]
                }}
              >
                <FaTimesCircle style={{ marginRight: '0.25rem' }} />
                Cancel
              </Button>
              <Button
                onClick={handleCreateAnyway}
                style={{
                  backgroundColor: theme.colors.primary[500],
                  borderColor: theme.colors.primary[500]
                }}
              >
                <FaCheckCircle style={{ marginRight: '0.25rem' }} />
                Create Contact Anyway
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced CSS Animations */}
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @keyframes slideIn {
          0% {
            transform: translateY(-20px) scale(0.95);
            opacity: 0;
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
        
        @keyframes progressPulse {
          0%, 100% { 
            transform: scaleX(1);
            opacity: 0.8;
          }
          50% { 
            transform: scaleX(1.02);
            opacity: 1;
          }
        }
        
        @keyframes fadeInUp {
          0% {
            transform: translateY(10px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .spinner {
          animation: spin 1s linear infinite;
        }
        
        .pulse {
          animation: pulse 2s infinite;
        }
        
        .progress-bar {
          animation: progressPulse 2s ease-in-out infinite;
        }
        
        .fade-in-up {
          animation: fadeInUp 0.3s ease-out;
        }
        
        /* Smooth transitions for all interactive elements */
        input:focus {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        button:active:not(:disabled) {
          transform: translateY(0);
        }
      `}</style>
    </>
  );
};

export default ScrapeContactModal;