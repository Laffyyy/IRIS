import React, { useState } from 'react';
import './AppManagement.css';

const AppManagement = () => {
  const [date, setDate] = useState(new Date(2025, 4, 1)); // May 2025
  const [minWorkdays, setMinWorkdays] = useState(10); // Default to 10

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() + i).toString());

  const handleMonthChange = (e) => {
    const newDate = new Date(date);
    newDate.setMonth(months.indexOf(e.target.value));
    setDate(newDate);
  };

  const handleYearChange = (e) => {
    const newDate = new Date(date);
    newDate.setFullYear(parseInt(e.target.value));
    setDate(newDate);
  };

  const handleWorkdaysChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    setMinWorkdays(value);
  };

  const handleSave = () => {
    console.log('Configuration saved:', {
      processingDate: date,
      minWorkdays
    });
    alert('Configuration saved successfully!');
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
          <h2>Processing Period</h2>
          
          <div className="form-row">
            <div className="date-selectors">
              <div className="form-group">
                <label>Month</label>
                <select
                  value={months[date.getMonth()]}
                  onChange={handleMonthChange}
                >
                  {months.map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Year</label>
                <select
                  value={date.getFullYear().toString()}
                  onChange={handleYearChange}
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group workdays-input">
              <label>Minimum Workdays for Proration</label>
              <input
                type="number"
                min="1"
                value={minWorkdays}
                onChange={handleWorkdaysChange}
              />
            </div>
          </div>
        </div>

        <div className="save-section">
          <button onClick={handleSave} className="save-btn">
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppManagement;