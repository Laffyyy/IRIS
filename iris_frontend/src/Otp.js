import React, { useRef, useState, useEffect } from 'react';
import './Otp.css';

const Otp = ({ onBack }) => {
  const inputsRef = useRef([]);
  const [expireTime, setExpireTime] = useState(60);
  const [resendTime, setResendTime] = useState(90);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (expireTime > 0) {
      const timer = setTimeout(() => setExpireTime(expireTime - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [expireTime]);

  useEffect(() => {
    if (resendTime > 0 && !canResend) {
      const timer = setTimeout(() => setResendTime(resendTime - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTime, canResend]);

  const handleResendCode = () => {
    if (!canResend) return;
    setResendTime(90); // Reset to 90 seconds
    setExpireTime(60); // Also reset the expiration timer
    setCanResend(false);
    // Add your resend OTP logic here
  };

  const handleInputChange = (e, index) => {
    const value = e.target.value;
    if (value.length === 1 && index < 5) {
      inputsRef.current[index + 1].focus();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

        <div className="otp-footer">
          <p className="otp-expiry">
            OTP will expire in {expireTime} seconds
          </p>
          <button
            className="resend-otp"
            onClick={handleResendCode}
            disabled={!canResend}
          >
            {canResend ? 'Resend Code' : `Resend in ${formatTime(resendTime)}`}
          </button>
        </div>

        <div className="otp-button-group">
          <button className="otp-back" onClick={onBack}>Back</button>
          <button className="otp-submit">Login</button>
        </div>
      </div>
    </div>
  );
};

export default Otp;