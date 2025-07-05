// Call Status System Example Component
// Demonstrates how to use the new call status management components

import React, { useState } from 'react';
import {
  StatusDropdown,
  QuickActionButton,
  QuickActionGroup,
  CallActionGroup,
  ContactActionGroup,
  FollowUpActionGroup,
  CallStatusIndicator,
  CallStatusBadge,
  CallStatusDot,
  CallStatusPill,
  CallStatusMinimal,
  LiveCallStatusIndicator,
  EnhancedPostCallModal,
  getCallStatusOptions,
  getContactStatusOptions
} from '../callStatus';
import Button from '../common/Button';
import theme from '../../styles/theme';

const CallStatusExample = () => {
  const [currentCallStatus, setCurrentCallStatus] = useState('Completed');
  const [currentContactStatus, setCurrentContactStatus] = useState('Open');
  const [showModal, setShowModal] = useState(false);

  // Sample data
  const sampleContactData = {
    id: 'contact-123',
    name: 'John Doe',
    phone: '+1234567890',
    email: 'john@example.com',
    company: 'Example Corp',
    status: currentContactStatus,
    notes: 'Interested in downtown properties'
  };

  const sampleCallData = {
    id: 'call-456',
    duration: 5.5,
    outcome: currentCallStatus,
    date: new Date(),
    notes: 'Discussed property requirements'
  };

  const handleStatusChange = async (newStatus, oldStatus) => {
    console.log('Status changed from', oldStatus, 'to', newStatus);
    setCurrentCallStatus(newStatus);
  };

  const handleContactStatusChange = async (newStatus, oldStatus) => {
    console.log('Contact status changed from', oldStatus, 'to', newStatus);
    setCurrentContactStatus(newStatus);
  };

  const handleQuickAction = async (actionId, data) => {
    console.log('Quick action executed:', actionId, data);
    alert(`Executed action: ${actionId}`);
  };

  const callStatusOptions = getCallStatusOptions();
  const contactStatusOptions = getContactStatusOptions();

  return (
    <div style={{
      padding: '2rem',
      maxWidth: '1200px',
      margin: '0 auto',
      fontFamily: theme.typography.fontFamily.primary
    }}>
      <h1 style={{
        color: theme.colors.primary[600],
        marginBottom: '2rem'
      }}>
        Call Status Management System Demo
      </h1>

      {/* Status Indicators Section */}
      <section style={{
        marginBottom: '3rem',
        padding: '1.5rem',
        backgroundColor: theme.colors.neutral[50],
        borderRadius: theme.borderRadius.lg,
        border: `1px solid ${theme.colors.neutral[200]}`
      }}>
        <h2 style={{
          color: theme.colors.neutral[700],
          marginBottom: '1.5rem'
        }}>
          Status Indicators
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div>
            <h3 style={{ fontSize: theme.typography.fontSize.sm, marginBottom: '0.5rem' }}>Badge Style</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <CallStatusBadge status="Connected" size="small" />
              <CallStatusBadge status="No Answer" size="medium" />
              <CallStatusBadge status="Deal Closed" size="large" />
            </div>
          </div>
          
          <div>
            <h3 style={{ fontSize: theme.typography.fontSize.sm, marginBottom: '0.5rem' }}>Dot Style</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CallStatusDot status="Connected" size="small" />
                <span>Connected</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CallStatusDot status="No Answer" size="medium" />
                <span>No Answer</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CallStatusDot status="Deal Closed" size="large" />
                <span>Deal Closed</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 style={{ fontSize: theme.typography.fontSize.sm, marginBottom: '0.5rem' }}>Pill Style</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <CallStatusPill status="Connected" />
              <CallStatusPill status="Follow Up" />
              <CallStatusPill status="Not Interested" />
            </div>
          </div>
          
          <div>
            <h3 style={{ fontSize: theme.typography.fontSize.sm, marginBottom: '0.5rem' }}>Minimal Style</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <CallStatusMinimal status="Connected" />
              <CallStatusMinimal status="SMS Sent" />
              <CallStatusMinimal status="Brief Contact" />
            </div>
          </div>
        </div>

        <div>
          <h3 style={{ fontSize: theme.typography.fontSize.sm, marginBottom: '0.5rem' }}>Live Status with Pulse</h3>
          <LiveCallStatusIndicator 
            status="Connected" 
            isActive={true}
            variant="badge"
          />
        </div>
      </section>

      {/* Status Dropdowns Section */}
      <section style={{
        marginBottom: '3rem',
        padding: '1.5rem',
        backgroundColor: theme.colors.neutral[50],
        borderRadius: theme.borderRadius.lg,
        border: `1px solid ${theme.colors.neutral[200]}`
      }}>
        <h2 style={{
          color: theme.colors.neutral[700],
          marginBottom: '1.5rem'
        }}>
          Interactive Status Dropdowns
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem'
        }}>
          <div>
            <h3 style={{ fontSize: theme.typography.fontSize.sm, marginBottom: '1rem' }}>Call Status</h3>
            <StatusDropdown
              currentStatus={currentCallStatus}
              options={callStatusOptions}
              onStatusChange={handleStatusChange}
              callData={sampleCallData}
              contactData={sampleContactData}
              variant="dropdown"
              size="medium"
              showDescription={true}
            />
            <p style={{
              fontSize: theme.typography.fontSize.xs,
              color: theme.colors.neutral[600],
              marginTop: '0.5rem'
            }}>
              Current status: {currentCallStatus}
            </p>
          </div>
          
          <div>
            <h3 style={{ fontSize: theme.typography.fontSize.sm, marginBottom: '1rem' }}>Contact Status</h3>
            <StatusDropdown
              currentStatus={currentContactStatus}
              options={contactStatusOptions}
              onStatusChange={handleContactStatusChange}
              contactData={sampleContactData}
              variant="dropdown"
              size="medium"
              showDescription={true}
            />
            <p style={{
              fontSize: theme.typography.fontSize.xs,
              color: theme.colors.neutral[600],
              marginTop: '0.5rem'
            }}>
              Current status: {currentContactStatus}
            </p>
          </div>
        </div>
      </section>

      {/* Quick Actions Section */}
      <section style={{
        marginBottom: '3rem',
        padding: '1.5rem',
        backgroundColor: theme.colors.neutral[50],
        borderRadius: theme.borderRadius.lg,
        border: `1px solid ${theme.colors.neutral[200]}`
      }}>
        <h2 style={{
          color: theme.colors.neutral[700],
          marginBottom: '1.5rem'
        }}>
          Quick Action Components
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '2rem'
        }}>
          <div>
            <h3 style={{ fontSize: theme.typography.fontSize.sm, marginBottom: '1rem' }}>Individual Quick Action Buttons</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <QuickActionButton
                actionId="call_back"
                onClick={handleQuickAction}
                contactData={sampleContactData}
                variant="solid"
                size="medium"
              />
              <QuickActionButton
                actionId="send_sms"
                onClick={handleQuickAction}
                contactData={sampleContactData}
                variant="outline"
                size="medium"
              />
              <QuickActionButton
                actionId="create_task"
                onClick={handleQuickAction}
                contactData={sampleContactData}
                callData={sampleCallData}
                variant="ghost"
                size="medium"
              />
              <QuickActionButton
                actionId="edit_call"
                onClick={handleQuickAction}
                callData={sampleCallData}
                variant="subtle"
                size="medium"
              />
            </div>
          </div>
          
          <div>
            <h3 style={{ fontSize: theme.typography.fontSize.sm, marginBottom: '1rem' }}>Predefined Action Groups</h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ fontSize: theme.typography.fontSize.xs, marginBottom: '0.5rem' }}>Call Actions</h4>
              <CallActionGroup
                contactData={sampleContactData}
                callData={sampleCallData}
                onActionClick={handleQuickAction}
                size="small"
                variant="outline"
              />
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ fontSize: theme.typography.fontSize.xs, marginBottom: '0.5rem' }}>Contact Actions</h4>
              <ContactActionGroup
                contactData={sampleContactData}
                onActionClick={handleQuickAction}
                size="small"
                variant="subtle"
              />
            </div>
            
            <div>
              <h4 style={{ fontSize: theme.typography.fontSize.xs, marginBottom: '0.5rem' }}>Follow-up Actions</h4>
              <FollowUpActionGroup
                contactData={sampleContactData}
                callData={sampleCallData}
                onActionClick={handleQuickAction}
                size="small"
                variant="ghost"
              />
            </div>
          </div>
          
          <div>
            <h3 style={{ fontSize: theme.typography.fontSize.sm, marginBottom: '1rem' }}>Custom Action Group</h3>
            <QuickActionGroup
              actions={['call_back', 'create_task', 'add_note']}
              contactData={sampleContactData}
              callData={sampleCallData}
              onActionClick={handleQuickAction}
              size="medium"
              variant="outline"
              orientation="horizontal"
            />
          </div>
        </div>
      </section>

      {/* Enhanced Modal Section */}
      <section style={{
        marginBottom: '3rem',
        padding: '1.5rem',
        backgroundColor: theme.colors.neutral[50],
        borderRadius: theme.borderRadius.lg,
        border: `1px solid ${theme.colors.neutral[200]}`
      }}>
        <h2 style={{
          color: theme.colors.neutral[700],
          marginBottom: '1.5rem'
        }}>
          Enhanced Post-Call Modal
        </h2>
        
        <Button
          variant="primary"
          onClick={() => setShowModal(true)}
        >
          Open Enhanced Post-Call Modal
        </Button>
        
        <p style={{
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.neutral[600],
          marginTop: '1rem'
        }}>
          This modal integrates all the call status components with automated business logic,
          status change actions, and enhanced user experience.
        </p>
      </section>

      {/* Enhanced Post-Call Modal */}
      <EnhancedPostCallModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        callData={sampleCallData}
        contactData={sampleContactData}
        onSave={(data) => {
          console.log('Modal saved with data:', data);
          setShowModal(false);
        }}
      />

      {/* Usage Instructions */}
      <section style={{
        padding: '1.5rem',
        backgroundColor: theme.colors.info[50],
        borderRadius: theme.borderRadius.lg,
        border: `1px solid ${theme.colors.info[200]}`
      }}>
        <h2 style={{
          color: theme.colors.info[700],
          marginBottom: '1rem'
        }}>
          Usage Instructions
        </h2>
        
        <div style={{
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.info[600],
          lineHeight: theme.typography.lineHeight.relaxed
        }}>
          <h3>Import Components:</h3>
          <pre style={{
            backgroundColor: theme.colors.neutral[100],
            padding: '1rem',
            borderRadius: theme.borderRadius.sm,
            fontSize: theme.typography.fontSize.xs,
            overflow: 'auto'
          }}>
{`import {
  StatusDropdown,
  QuickActionGroup,
  CallStatusIndicator,
  EnhancedPostCallModal
} from '../components/callStatus';`}
          </pre>
          
          <h3>Key Features:</h3>
          <ul>
            <li>Standardized status definitions with colors and icons</li>
            <li>Automated business logic for status changes</li>
            <li>Consistent styling across all components</li>
            <li>Built-in error handling and user feedback</li>
            <li>Customizable appearance and behavior</li>
            <li>Integration with existing CRM workflows</li>
          </ul>
        </div>
      </section>
    </div>
  );
};

export default CallStatusExample;