import React from "react";
import "./ModalPasswordExpired.css"; // Using the correct CSS file

export default function ModalPasswordExpired({ open, onClose, onChangePassword, expirationDate }) {
  if (!open) return null;

  // Parse the expiration date from the database format (could be ISO string or timestamp)
  let formattedDate;
  
  try {
    // Handle various possible date formats
    const expDate = typeof expirationDate === 'string' 
      ? new Date(expirationDate) 
      : (expirationDate instanceof Date 
          ? expirationDate 
          : new Date());
    
    // Format the date as Month Day, Year, HH:MM (e.g., May 12, 2025, 3:30 PM)
    if (isNaN(expDate.getTime())) {
      // Fallback if the date is invalid
      formattedDate = "recently";
      console.warn('Invalid expiration date format, using fallback text');
    } else {
      formattedDate = expDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  } catch (error) {
    console.error('Error parsing expiration date:', error);
    formattedDate = "recently";
  }

  return (
    <div className="modal-overlay">
      <div className="modal-expired"> {/* Changed from modal-warning to modal-expired */}
        <div className="modal-title">
          <span className="icon">&#9888;</span>
          Password Expired
        </div>
        <div className="modal-subtitle">
          Your account requires a password update
        </div>
        <div className="policy-box"> {/* Changed from notice-box to policy-box */}
          <div>
            <div className="policy-title">Password Policy</div> {/* Changed from notice-content to policy-title */}
            <div className="policy-message"> {/* Changed from notice-message to policy-message */}
              Your password expired on {formattedDate}. You must change your password to continue.
            </div>
          </div>
        </div>
        
        {/* Add button container with both buttons */}
        <div className="modal-action-buttons">
          <button 
            onClick={onClose}
            className="cancel-action-btn"
          >
            Cancel
          </button>
          <button 
            onClick={onChangePassword}
            className="change-password-btn"
          >
            Change Password
          </button>
        </div>
      </div>
    </div>
  );
}