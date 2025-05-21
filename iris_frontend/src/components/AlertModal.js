import React from 'react';
import './AlertModal.css';

const AlertModal = ({ isOpen, message, onClose, type = 'info' }) => {
  if (!isOpen) return null;

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
    <div className="alert-modal-overlay">
      <div className={`alert-modal ${type}`}>
        <div className="alert-modal-icon">{getIcon()}</div>
        <div className="alert-modal-content">
          <p>{message}</p>
        </div>
        <button className="alert-modal-button" onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  );
};

export default AlertModal; 