import { useState } from 'react';
import { FaAngleDown, FaAngleUp } from 'react-icons/fa';
import theme from '../../styles/theme';

export default function BaseCard({ 
  title,
  subtitle,
  headerContent,
  expandedContent,
  actions,
  badges,
  isInitiallyExpanded = false,
  onToggleExpand,
  style = {},
  titleStyle = {},
  headerStyle = {},
  expandedContentStyle = {},
}) {
  const [isExpanded, setIsExpanded] = useState(isInitiallyExpanded);
  
  const toggleExpand = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    if (onToggleExpand) onToggleExpand(newExpandedState);
  };

  return (
    <div style={{ 
      border: '1px solid #e2e8f0', 
      borderRadius: theme.borderRadius.md,
      margin: '0 0 1rem 0',
      backgroundColor: 'white',
      boxShadow: theme.shadows.sm,
      overflow: 'hidden',
      transition: 'box-shadow 0.2s ease',
      ...style
    }}>
      {/* Card Header */}
      <div 
        style={{ 
          padding: '1rem', 
          borderBottom: isExpanded ? '1px solid #ddd' : 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          cursor: 'pointer',
          ...headerStyle
        }} 
        onClick={toggleExpand}
      >
        <div style={{ flex: 1, marginRight: '0.5rem' }}>
          {title && (
            <h3 style={{ 
              margin: 0, 
              color: theme.colors.brand.primary,
              ...titleStyle 
            }}>
              {title}
            </h3>
          )}
          {subtitle && <div>{subtitle}</div>}
          {headerContent}
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {actions}
          {badges}
          
          {/* Expand/Collapse Icon */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            color: theme.colors.brand.text,
            marginLeft: '0.5rem'
          }}>
            {isExpanded ? <FaAngleUp /> : <FaAngleDown />}
          </div>
        </div>
      </div>
      
      {/* Expanded Content */}
      {isExpanded && (
        <div style={{ 
          padding: '1rem', 
          backgroundColor: '#f9f9fa',
          ...expandedContentStyle
        }}>
          {expandedContent}
        </div>
      )}
    </div>
  );
}