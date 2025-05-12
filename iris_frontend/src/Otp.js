import React, { useRef, useState, useEffect } from 'react';
import './Otp.css';

const Otp = ({ onBack, onChangePassword }) => {
  const inputsRef = useRef([]);
  const [expireTime, setExpireTime] = useState(180); // 3 minutes
  const [resendTime, setResendTime] = useState(90);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(''); // Store userId from local storage or props

  useEffect(() => {
    // Retrieve userId from localStorage (assuming it was saved during login)
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

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

  const handleResendCode = async () => {
    if (!canResend) return;
    
    try {
      setLoading(true);
      // API call to resend OTP
      const response = await fetch('http://localhost:3000/api/otp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to resend OTP');
      }

      setResendTime(90);
      setExpireTime(180);
      setCanResend(false);
      setError('');
    } catch (err) {
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Add visual feedback during loading
      const loadingIndicator = document.getElementById('loading-indicator');
      if (loadingIndicator) loadingIndicator.style.display = 'block';
      
      // Use Promise.race to set a timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out')), 5000));
      
      const fetchPromise = fetch(`http://localhost:3000/api/login/checkStatus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId })
      });
      
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (!response.ok) {
        throw new Error('Login failed');
      }
      
      const data = await response.json();
      
      // Check if user is first-time user
      if (data.status === 'FIRST-TIME') {
        onChangePassword();
      } else {
        alert("Logged in successfully! (Dashboard would open here)");
      }
    } catch (err) {
      console.error('Error during login:', err);
      setError(`Login failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e, index) => {
    let value = e.target.value.toUpperCase();
    value = value.replace(/[^A-Z0-9]/g, '');

    if (value.length > 1) return;

    e.target.value = value;

    if (value && index < 5) {
      inputsRef.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !e.target.value && index > 0) {
      inputsRef.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    const pastedData = e.clipboardData.getData('Text').toUpperCase();
    const filtered = pastedData.replace(/[^A-Z0-9]/g, '').slice(0, 6);

    if (filtered.length === 6) {
      filtered.split('').forEach((char, i) => {
        inputsRef.current[i].value = char;
      });
      inputsRef.current[5].focus();
    }

    e.preventDefault();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="otp-container">
      <div className="otp-card">
        <img
          src="/assets/logo.png"
          alt="IRIS Logo"
          className="otp-logo"
          style={{ userSelect: 'none', pointerEvents: 'none' }}
          draggable={false}
        />
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
              inputMode="numeric"
              onChange={(e) => handleInputChange(e, i)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              ref={(el) => (inputsRef.current[i] = el)}
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
          <button className="otp-submit" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Processing...' : 'Login'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Otp;
