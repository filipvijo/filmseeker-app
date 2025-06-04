import React from 'react';
import './SectionTitle.css';

/**
 * SectionTitle component for consistent section headings across the app
 * 
 * @param {Object} props - Component props
 * @param {string} props.children - The title text
 * @param {string} [props.className] - Additional CSS classes
 * @param {string} [props.color] - Color variant ('primary', 'secondary', or 'white')
 * @param {string} [props.size] - Size variant ('small', 'medium', or 'large')
 * @param {string} [props.align] - Text alignment ('left', 'center', or 'right')
 * @returns {JSX.Element} - Rendered component
 */
const SectionTitle = ({ 
  children, 
  className = '', 
  color = 'white', 
  size = 'medium',
  align = 'center'
}) => {
  const colorClass = `section-title--${color}`;
  const sizeClass = `section-title--${size}`;
  const alignClass = `section-title--${align}`;
  
  return (
    <h2 className={`section-title ${colorClass} ${sizeClass} ${alignClass} ${className}`}>
      {children}
    </h2>
  );
};

export default SectionTitle;
