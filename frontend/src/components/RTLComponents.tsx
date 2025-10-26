import React from 'react';
import { useTranslation } from '../i18n/i18nContext';

interface RTLWrapperProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * RTL-aware wrapper component that applies proper RTL styles
 */
export const RTLWrapper: React.FC<RTLWrapperProps> = ({ children, className = '' }) => {
  const { dir } = useTranslation();
  
  return (
    <div className={`${className} ${dir === 'rtl' ? 'rtl' : 'ltr'}`} dir={dir}>
      {children}
    </div>
  );
};

/**
 * RTL-aware flex container that reverses direction for RTL
 */
export const RTLFlex: React.FC<RTLWrapperProps> = ({ children, className = '' }) => {
  const { dir } = useTranslation();
  
  return (
    <div className={`flex ${dir === 'rtl' ? 'flex-row-reverse' : 'flex-row'} ${className}`} dir={dir}>
      {children}
    </div>
  );
};

/**
 * RTL-aware text alignment
 */
export const RTLText: React.FC<RTLWrapperProps & { align?: 'left' | 'right' | 'center' | 'justify' }> = ({ 
  children, 
  className = '', 
  align = 'left' 
}) => {
  const { dir } = useTranslation();
  
  const getAlignment = () => {
    if (align === 'left') return dir === 'rtl' ? 'text-right' : 'text-left';
    if (align === 'right') return dir === 'rtl' ? 'text-left' : 'text-right';
    return `text-${align}`;
  };
  
  return (
    <div className={`${getAlignment()} ${className}`} dir={dir}>
      {children}
    </div>
  );
};

/**
 * RTL-aware margin/padding utilities
 */
export const RTLSpace: React.FC<RTLWrapperProps & { 
  margin?: 'left' | 'right' | 'both';
  padding?: 'left' | 'right' | 'both';
  size?: 'sm' | 'md' | 'lg';
}> = ({ 
  children, 
  className = '', 
  margin, 
  padding, 
  size = 'md' 
}) => {
  const { dir } = useTranslation();
  
  const getSizeClass = (prefix: string) => {
    const sizes = {
      sm: '1',
      md: '2', 
      lg: '4'
    };
    return `${prefix}-${sizes[size]}`;
  };
  
  const getClasses = () => {
    let classes = className;
    
    if (margin) {
      if (margin === 'both') {
        classes += ` mx-${getSizeClass('')}`;
      } else {
        const side = margin === 'left' ? (dir === 'rtl' ? 'r' : 'l') : (dir === 'rtl' ? 'l' : 'r');
        classes += ` m${side}-${getSizeClass('')}`;
      }
    }
    
    if (padding) {
      if (padding === 'both') {
        classes += ` px-${getSizeClass('')}`;
      } else {
        const side = padding === 'left' ? (dir === 'rtl' ? 'r' : 'l') : (dir === 'rtl' ? 'l' : 'r');
        classes += ` p${side}-${getSizeClass('')}`;
      }
    }
    
    return classes;
  };
  
  return (
    <div className={getClasses()} dir={dir}>
      {children}
    </div>
  );
};

/**
 * RTL-aware border utilities
 */
export const RTLBorder: React.FC<RTLWrapperProps & { 
  side?: 'left' | 'right' | 'both';
  color?: string;
}> = ({ 
  children, 
  className = '', 
  side, 
  color = 'gray-200' 
}) => {
  const { dir } = useTranslation();
  
  const getBorderClass = () => {
    if (!side) return '';
    
    if (side === 'both') {
      return `border-x border-${color}`;
    }
    
    const borderSide = side === 'left' ? (dir === 'rtl' ? 'r' : 'l') : (dir === 'rtl' ? 'l' : 'r');
    return `border-${borderSide} border-${color}`;
  };
  
  return (
    <div className={`${getBorderClass()} ${className}`} dir={dir}>
      {children}
    </div>
  );
};
