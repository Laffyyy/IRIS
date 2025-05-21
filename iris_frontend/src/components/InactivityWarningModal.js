import React from 'react';
import './InactivityWarningModal.css';

const InactivityWarningModal = () => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>You've been inactive for a while</h2>
        <p>You will be logged out soon unless you become active again.</p>
      </div>
    </div>
  );
};

export default InactivityWarningModal;
