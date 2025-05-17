import React, { useState } from 'react';
import './AppManagement.css';

const AppManagement = () => {
  const [month, setMonth] = useState('April');
  const [year, setYear] = useState('2025');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [understood, setUnderstood] = useState(false);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() + i).toString());

  // Get current real-time month and year
  const currentDate = new Date();
  const currentMonth = months[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear().toString();

  const handleSave = () => {
    setShowConfirmation(true);
  };

  const handleConfirm = () => {
    if (confirmationText === 'CONFIRM' && understood) {
      console.log('Processing month set to:', { month, year });
      alert('Processing month configured successfully!');
      setShowConfirmation(false);
      setConfirmationText('');
      setUnderstood(false);
    }
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setConfirmationText('');
    setUnderstood(false);
  };

  return (
    <div className="app-management-container">
      <div className="white-card">
        <div className="app-management-header">
          <h1>App Management</h1>
          <p className="subtitle">
            Set the current processing month and year for incentive calculations.
          </p>
        </div>

        <div className="configuration-section">
          <div className="active-month-card">
            <div className="active-month-header">
              <h3>Active Month</h3>
            </div>
            <div className="active-month-value">
              {currentMonth} {currentYear}
            </div>
          </div>

          <h2>Current Processing Month</h2>
          <div className="processing-month-value">
            {month} {year}
          </div>
        </div>

        <div className="configuration-section">
          <h2>Configure Processing Month</h2>
          <div className="form-row">
            <div className="form-group">
              <label>Month</label>
              <select value={month} onChange={(e) => setMonth(e.target.value)}>
                {months.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Year</label>
              <select value={year} onChange={(e) => setYear(e.target.value)}>
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="save-section">
          <button onClick={handleSave} className="save-btn">
            Save Changes
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-content">
              <h3>Confirmation Required</h3>
              
              <div className="warning">
                <p>Warning: Processing month will be set to <strong>{month} {year}</strong>. It cannot be change after it has been configured.</p>
              </div>
              
              <div className="confirmation-checkbox">
                <input
                  type="checkbox"
                  id="understand"
                  checked={understood}
                  onChange={(e) => setUnderstood(e.target.checked)}
                />
                <label htmlFor="understand">I understand that this action cannot be undone</label>
              </div>
              
              <div className="confirmation-input">
                <p>Type "CONFIRM" to proceed</p>
                <input
                  type="text"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value.toUpperCase())}
                  placeholder="CONFIRM"
                />
              </div>
              
              <div className="modal-buttons">
                <button onClick={handleCancel} className="cancel-btn">
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="confirm-btn"
                  disabled={confirmationText !== 'CONFIRM' || !understood}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppManagement;