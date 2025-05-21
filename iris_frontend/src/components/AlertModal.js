import React, { useEffect, useRef } from 'react';
import './AlertModal.css';

const AlertModal = ({ isOpen, message, onClose, type = 'info' }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleKeyPress = (event) => {
      // Only handle Enter if the modal is actually mounted and visible
      if (event.key === 'Enter' && modalRef.current) {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyPress, true);
    return () => {
      window.removeEventListener('keydown', handleKeyPress, true);
    };
  }, [onClose]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      default:
        return 'ℹ';
    }
  };

  return (
    <div className="alert-modal-overlay" ref={modalRef}>
      <div className={`alert-modal ${type}`}>
        <div className="alert-modal-icon">{getIcon()}</div>
        <div className="alert-modal-content">
          <p>{message}</p>
        </div>
        <button className="alert-modal-button" onClick={handleClose}>
          OK
        </button>
      </div>
    </div>
  );
};

export default AlertModal; 