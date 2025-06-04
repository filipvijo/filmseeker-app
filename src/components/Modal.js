import React, { useEffect, useRef } from 'react';
import './Modal.css';

/**
 * Modal component for consistent modal styling
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Modal content
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to close the modal
 * @param {string} [props.className] - Additional CSS classes
 * @param {string} [props.size] - Modal size ('small', 'medium', 'large', 'full')
 * @param {string} [props.variant] - Modal variant ('primary', 'secondary', 'dark')
 * @param {boolean} [props.closeOnOutsideClick] - Whether to close on outside click
 * @param {boolean} [props.showCloseButton] - Whether to show the close button
 * @returns {JSX.Element|null} - Rendered component or null if closed
 */
const Modal = ({ 
  children, 
  isOpen, 
  onClose, 
  className = '', 
  size = 'medium',
  variant = 'primary',
  closeOnOutsideClick = true,
  showCloseButton = true
}) => {
  const modalRef = useRef(null);
  
  const sizeClass = `modal--${size}`;
  const variantClass = `modal--${variant}`;
  
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto'; // Restore scrolling when modal is closed
    };
  }, [isOpen, onClose]);
  
  const handleOutsideClick = (e) => {
    if (closeOnOutsideClick && modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay" onClick={handleOutsideClick}>
      <div 
        ref={modalRef}
        className={`modal ${sizeClass} ${variantClass} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {showCloseButton && (
          <button 
            className="modal-close-button" 
            onClick={onClose}
            aria-label="Close modal"
          >
            &times;
          </button>
        )}
        <div className="modal-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
