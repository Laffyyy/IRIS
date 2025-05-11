import React, { useState } from 'react';
import './Login.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const Login = ({ onContinue, onForgotPassword }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onContinue();
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    const filteredValue = value.replace(/[^a-zA-Z-._!@]/g, ''); // Only letters and periods
    const truncatedValue = filteredValue.slice(0, 20);      // Max 30 chars
    setPassword(truncatedValue);
  };

  const handleEmployeeIdChange = (e) => {
    const value = e.target.value;
    const filteredValue = value.replace(/[^0-9]/g, '');
    const truncatedValue = filteredValue.slice(0, 10);        // Max 10 chars
    setEmployeeId(truncatedValue);
  };

  return (
    <div className="iris-wrapper">
      <div className="iris-login-box">
        {/* Left Panel */}
        <div className="iris-left">
          <img src="assets/logo.png" alt="IRIS Logo" className="iris-logo" />
          <h2 className="iris-title">IRIS</h2>
          <p className="iris-subtitle">Incentive Reporting & Insight Solution</p>

          <form className="iris-form" onSubmit={handleSubmit}>
            <div className="iris-input-wrapper">
              <label htmlFor="employee-id" className="iris-label">Employee ID</label>
              <span className="iris-icon">
                <img src="assets/user-icon.png" alt="User Icon" />
              </span>
              <input 
                id="employee-id" 
                type="text" 
                value={employeeId}
                onChange={handleEmployeeIdChange}
                required 
              />
            </div>

            <div className="iris-input-wrapper">
              <label htmlFor="password" className="iris-label">Password</label>
              <span className="iris-icon">
                <img src="assets/lock-icon.png" alt="Lock Icon" />
              </span>
              <div className="input-wrapper">
                <input 
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  required 
                />
                <button
                  type="button"
                  className="eye-icon-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                </button>
              </div>
            </div>

            <a href="#" className="iris-forgot" onClick={(e) => {
              e.preventDefault();
              onForgotPassword();
            }}>Forgot Password?</a>

            <button type="submit" className="iris-button">Continue</button>
          </form>
        </div>

        {/* Right Panel */}
        <div
          className="iris-right"
          style={{ backgroundImage: `url("/assets/right-login-bg.png")`, backgroundSize: 'cover' }}
        >
          <div className="iris-right-content">
            <h2>Welcome in to IRIS</h2>
            <p>Empowering organizations to recognize and reward excellence through data-driven performance management.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
