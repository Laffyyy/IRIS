import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AppManagement.css';

const AppManagement = () => {
  const [month, setMonth] = useState('April');
  const [year, setYear] = useState('2025');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [understood, setUnderstood] = useState(false);
  const [currentProcessingMonth, setCurrentProcessingMonth] = useState(null);
  const [error, setError] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentDate = new Date();
  const currentMonth = months[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear().toString();

  useEffect(() => {
    fetchCurrentProcessingMonth();
  }, []);

  const fetchCurrentProcessingMonth = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/processing-month');
      const { dMonth, dYear } = response.data;
      setCurrentProcessingMonth({
        month: dMonth, 
        year: dYear.toString()
      });
      setError(null);
    } catch (error) {
      setError('Error fetching current processing month');
      setCurrentProcessingMonth(null);
    }
  };

  const handleSave = () => {
    // Prevent setting the same processing month
    if (
      currentProcessingMonth &&
      currentProcessingMonth.month === month &&
      currentProcessingMonth.year === year
    ) {
      setError('Selected processing month is already the current processing month.');
      setShowErrorModal(true);
      return;
    }
    setShowConfirmation(true);
    setError(null);
  };

  const handleConfirm = async () => {
    if (confirmationText === 'CONFIRM' && understood) {
      try {
        await axios.post('http://localhost:3000/api/processing-month', {
          month,
          year,
          createdBy: localStorage.getItem('userId')
        });
        await fetchCurrentProcessingMonth();
        setShowConfirmation(false);
        setConfirmationText('');
        setUnderstood(false);
        setError(null);
      } catch (error) {
        setError(error.response?.data?.message || 'Error setting processing month');
      }
    }
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setConfirmationText('');
    setUnderstood(false);
  };

  // Format value for month picker
  const monthPickerValue = `${year}-${String(months.indexOf(month) + 1).padStart(2, '0')}`;
  const maxMonthPicker = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

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
            {currentProcessingMonth 
              ? `${currentProcessingMonth.month} ${currentProcessingMonth.year}`
              : 'Not configured'}
          </div>
        </div>

        <div className="configuration-section">
          <h2>Configure Processing Month</h2>
          <div className="form-row">
            <div className="form-group">
              <label>Processing Month</label>
              <input
                type="month"
                value={monthPickerValue}
                max={maxMonthPicker}
                onChange={e => {
                  const [y, m] = e.target.value.split('-');
                  setYear(y);
                  setMonth(months[parseInt(m, 10) - 1]);
                }}
              />
            </div>
          </div>
        </div>

        <div className="save-section">
          <button onClick={handleSave} className="save-btn">
            Save Changes
          </button>
        </div>
      </div>

      {showConfirmation && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-content">
              <h3>Confirmation Required</h3>
              
              <div className="warning">
                <p>Warning: Processing month will be set to <strong>{month} {year}</strong>. It cannot be changed after it has been configured.</p>
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
                  maxLength={7}
                  onChange={(e) => {
                    // Only allow letters, max 7
                    const sanitized = e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 7);
                    setConfirmationText(sanitized);
                  }}
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

      {showErrorModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-content">
              <h3>Error</h3>
              <div className="warning">
                <p>{error}</p>
              </div>
              <div className="modal-buttons">
                <button onClick={() => setShowErrorModal(false)} className="confirm-btn">
                  OK
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