import React, { useRef } from 'react';
import './Otp.css';

const Otp = () => {
  const inputsRef = useRef([]);

  const handleInputChange = (e, index) => {
    const value = e.target.value;
    if (value.length === 1 && index < 5) {
      inputsRef.current[index + 1].focus();
    }
  };

  return (
    <div className="otp-container">
      <div className="otp-card">
        <img src="/assets/logo.png" alt="IRIS Logo" className="otp-logo" />
        <h2 className="otp-title">IRIS</h2>
        <p className="otp-subtitle">Incentive Reporting & Insight Solution</p>

        <div className="otp-alert">
          A one-time password has been sent to your registered email.
        </div>

        <label className="otp-label">Enter OTP</label>
        <div className="otp-input-group">
          {Array(6).fill('').map((_, i) => (
            <input
              key={i}
              type="text"
              maxLength="1"
              className="otp-input"
              onChange={(e) => handleInputChange(e, i)}
              ref={(el) => (inputsRef.current[i] = el)}
            />
          ))}
        </div>

        <p className="otp-expiry">OTP will expire in 1 minute.</p>

        <div className="otp-button-group">
          <button className="otp-back">Back</button>
          <button className="otp-submit">Login</button>
        </div>
      </div>
    </div>
  );
};

export default Otp;
