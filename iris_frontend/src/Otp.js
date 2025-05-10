import React, { useRef, useState, useEffect } from 'react';
import './Otp.css';

const Otp = ({ onBack }) => {
  const inputsRef = useRef([]);
  const [expireTime, setExpireTime] = useState(180); // 3 minutes
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
    setExpireTime(180); // Reset the expiration time to 3 minutes
    setCanResend(false);
    // Add your resend OTP logic here
  };

  const handleInputChange = (e, index) => {
    const value = e.target.value;

    // Only allow numeric input
    if (!/^\d*$/.test(value)) {
      e.target.value = ''; // Clear if not a number
      return;
    }

    // Handle pasting: if the pasted value has more than 1 character, fill the rest of the inputs
    if (value.length === 1 && index < 5) {
      inputsRef.current[index + 1].focus();
    }

    // Focus on the previous input if backspace is pressed
    if (value === '' && index > 0) {
      inputsRef.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    const pastedData = e.clipboardData.getData('Text');
    if (/^[0-9]{6}$/.test(pastedData)) {
      // Fill all inputs with the pasted code
      pastedData.split('').forEach((char, index) => {
        inputsRef.current[index].value = char;
      });
      // Focus on the last input
      inputsRef.current[5].focus();
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
        <div className="otp-input-group" onPaste={handlePaste}>
          {Array(6).fill('').map((_, i) => (
            <input
              key={i}
              type="text"
              maxLength="1"
              className="otp-input"
              onChange={(e) => handleInputChange(e, i)}
              ref={(el) => (inputsRef.current[i] = el)}
              inputMode="numeric" // Helps mobile devices display the numeric keyboard
            />
          ))}
        </div>

        <div className="otp-footer">
          <p className="otp-expiry">
            {expireTime > 0
              ? `OTP will expire in ${formatTime(expireTime)}`
              : 'OTP has expired'}
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
