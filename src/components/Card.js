import React from 'react';
import './Card.css';

/**
 * Card component for consistent card styling across the app
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Card content
 * @param {string} [props.className] - Additional CSS classes
 * @param {string} [props.variant] - Card variant ('primary', 'secondary', or 'dark')
 * @param {boolean} [props.hoverable] - Whether the card should have hover effects
 * @param {Function} [props.onClick] - Click handler
 * @returns {JSX.Element} - Rendered component
 */
const Card = ({ 
  children, 
  className = '', 
  variant = 'primary',
  hoverable = false,
  onClick = null
}) => {
  const variantClass = `card--${variant}`;
  const hoverableClass = hoverable ? 'card--hoverable' : '';
  const clickableClass = onClick ? 'card--clickable' : '';
  
  return (
    <div 
      className={`card ${variantClass} ${hoverableClass} ${clickableClass} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;
