import { useEffect } from 'react';
import Button from './Button';
import theme from '../../styles/theme';

/**
 * BaseModal - A reusable modal component for consistent modal UI across the application
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to call when the modal is closed
 * @param {string} props.title - Modal title
 * @param {React.ReactNode} props.children - Modal content
 * @param {string} props.maxWidth - Maximum width of the modal (default: '600px')
 * @param {number} props.zIndex - z-index for the modal (default: 1000)
 * @param {Object} props.contentStyle - Additional styling for the modal content
 * @param {Object} props.headerStyle - Additional styling for the modal header
 * @param {React.ReactNode} props.headerContent - Additional content for the header
 * @param {React.ReactNode} props.footerContent - Content for modal footer
 * @param {string} props.closeButtonVariant - Variant for close button (default: 'text')
 * @param {Object} props.closeButtonStyle - Additional styling for close button
 * @param {boolean} props.fullHeight - Whether modal should take full viewport height
 * @param {string} props.backdropColor - Background color for modal backdrop (default: 'rgba(0, 0, 0, 0.5)')
 * @returns {React.ReactNode}
 */
export default function BaseModal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = '600px',
  zIndex = 1000,
  contentStyle = {},
  headerStyle = {},
  headerContent,
  footerContent,
  closeButtonVariant = 'text',
  closeButtonStyle = {},
  fullHeight = false,
  backdropColor = 'rgba(0, 0, 0, 0.5)'
}) {
  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  // Don't render anything if modal is closed
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: backdropColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: zIndex,
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: theme.borderRadius.md,
          boxShadow: theme.shadows.lg,
          maxWidth: maxWidth,
          width: '100%',
          maxHeight: fullHeight ? '100vh' : '90vh',
          height: fullHeight ? '100vh' : 'auto',
          overflowY: 'auto',
          animation: 'slideIn 0.3s ease-out',
          ...contentStyle
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '1rem',
          ...headerStyle
        }}>
          <h2 style={{ margin: 0 }}>{title}</h2>
          
          {headerContent}
          
          <Button
            onClick={onClose}
            variant={closeButtonVariant}
            style={{
              fontSize: '1.5rem',
              padding: '0.2rem',
              marginLeft: headerContent ? '0.5rem' : '0',
              ...closeButtonStyle
            }}
            tooltip="Close this window"
          >
            &times;
          </Button>
        </div>
        
        {/* Modal Content */}
        <div>
          {children}
        </div>
        
        {/* Modal Footer (if provided) */}
        {footerContent && (
          <div style={{ 
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid #eee' 
          }}>
            {footerContent}
          </div>
        )}
      </div>
      
      {/* Global styles for modal animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideIn {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}