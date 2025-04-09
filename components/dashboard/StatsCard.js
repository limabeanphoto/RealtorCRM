import theme from '../../styles/theme';
import Link from 'next/link';
import Button from '../common/Button';
import { FaUsers, FaPhone, FaChartLine, FaTasks } from 'react-icons/fa';

export default function StatsCard({ title, value, iconType, color, link, linkText }) {
  const cardColor = color || theme.colors.brand.primary;
  
  const getIcon = () => {
    switch(iconType) {
      case 'contacts':
        return <FaUsers size={32} />;
      case 'calls':
        return <FaPhone size={32} />;
      case 'conversion':
        return <FaChartLine size={32} />;
      case 'tasks':
        return <FaTasks size={32} />;
      default:
        return null;
    }
  };
  
  return (
    <div style={{
      flex: '1',
      minWidth: '200px',
      backgroundColor: 'white',
      borderRadius: theme.borderRadius.md,
      boxShadow: theme.shadows.sm,
      overflow: 'hidden',
      borderTop: `4px solid ${cardColor}`,
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{ padding: '1.5rem', textAlign: 'center', flex: 1 }}>
        <div style={{ 
          fontSize: '2rem', 
          marginBottom: '0.5rem',
          color: cardColor
        }}>
          {getIcon()}
        </div>
        <h3 style={{ 
          margin: '0', 
          color: cardColor,
          fontSize: '1.1rem',
        }}>
          {title}
        </h3>
        <p style={{ 
          fontSize: '2rem', 
          fontWeight: 'bold', 
          margin: '0.5rem 0', 
          color: cardColor 
        }}>
          {value}
        </p>
      </div>
      
      {link && (
        <div style={{ 
          padding: '1rem',
          borderTop: '1px solid #f0f0f0',
          backgroundColor: '#fafafa',
          textAlign: 'center',
        }}>
          <Link href={link}>
            <Button 
              variant="ghost" 
              style={{ color: cardColor }}
            >
              {linkText || 'View All'}
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}