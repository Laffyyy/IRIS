import React from "react";
import "./ModalWarning.css";

export default function ModalWarning({ open, onClose, expirationDate, daysRemaining = 7 }) {
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
    
    console.log('Parsing expiration date:', expirationDate);
    console.log('Parsed date object:', expDate);
    
    // Format the date as Month Day, Year, HH:MM (e.g., May 12, 2025, 3:30 PM)
    if (isNaN(expDate.getTime())) {
      console.warn('Invalid date format, using fallback');
      const fallbackDate = new Date();
      fallbackDate.setDate(fallbackDate.getDate() + daysRemaining);
      formattedDate = fallbackDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      console.warn('Using fallback date:', formattedDate);
    } else {
      formattedDate = expDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      console.log('Formatted date:', formattedDate);
    }
  } catch (error) {
    console.error('Error parsing expiration date:', error);
    // Fallback to calculating date from daysRemaining
    const fallbackDate = new Date();
    fallbackDate.setDate(fallbackDate.getDate() + daysRemaining);
    formattedDate = fallbackDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  return (
    <div className="modal-overlay">
      <div className="modal-warning">
        <button className="close-btn" onClick={onClose} aria-label="Close">
          &times;
        </button>
        <div className="modal-title">
          <span className="icon">&#9888;</span>
          Password Expiration Notice
        </div>
        <div className="modal-subtitle">
        </div>
        <div className="notice-box">
          <div>
            <div className="notice-content">Action Required</div>
            <div className="notice-message">
              The current password will expire on {formattedDate}. To maintain uninterrupted access and avoid being signed out of all devices, please update the password within the next {daysRemaining} days.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}