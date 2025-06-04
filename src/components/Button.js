import React from 'react';
import './Button.css';

/**
 * Button component for consistent button styling across the app
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Button content
 * @param {string} [props.className] - Additional CSS classes
 * @param {string} [props.variant] - Button variant ('primary', 'secondary', 'outline', 'text')
 * @param {string} [props.size] - Button size ('small', 'medium', 'large')
 * @param {string} [props.type] - Button type attribute
 * @param {boolean} [props.disabled] - Whether the button is disabled
 * @param {boolean} [props.fullWidth] - Whether the button should take full width
 * @param {Function} [props.onClick] - Click handler
 * @param {string} [props.ariaLabel] - Aria label for accessibility
 * @returns {JSX.Element} - Rendered component
 */
const Button = ({ 
  children, 
  className = '', 
  variant = 'primary',
  size = 'medium',
  type = 'button',
  disabled = false,
  fullWidth = false,
  onClick,
  ariaLabel,
  ...rest
}) => {
  const variantClass = `btn--${variant}`;
  const sizeClass = `btn--${size}`;
  const widthClass = fullWidth ? 'btn--full-width' : '';
  
  return (
    <button 
      className={`btn ${variantClass} ${sizeClass} ${widthClass} ${className}`}
      type={type}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      {...rest}
    >
      {children}
    </button>
  );
};

export default Button;
