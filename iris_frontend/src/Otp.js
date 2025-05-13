import React, { useRef, useState, useEffect } from 'react';
import './Otp.css';

const Otp = ({ onBack, onChangePassword }) => {
  const inputsRef = useRef([]);
  const [expireTime, setExpireTime] = useState(180); // 3 minutes
  const [resendTime, setResendTime] = useState(90);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');

  //local storage
  const storedUserId = localStorage.getItem('userId');
  const storedPassword = localStorage.getItem('password');
  


  

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
      
      const response = await fetch(`http://localhost:3000/api/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: storedUserId, 
          password: storedPassword,
          otp: otp
        })
      });
      
      const data = await response.json();
      console.log('Server response:', data);
      
      // Check the response message content even if status is 200 OK
      if (data.data?.message?.includes('OTP sent')) {
        setError('Your OTP was not verified. A new OTP has been sent to your email.');
        setExpireTime(180); // Reset the timer
        setResendTime(90);  // Reset resend timer
        alert("A new OTP has been sent to your email.");
        // Optionally reset OTP fields
        setOtp('');
        return;
      }
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Login failed');
      }
      
      // Successful OTP verification
      if (data.user?.status === "FIRST-TIME") {
        onChangePassword();
      } else {
        // Store the authentication token
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        alert("Logged in successfully! (Dashboard would open here)");
      }
    } catch (err) {
      console.error('Error during login:', err);
      setError(err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
      const loadingIndicator = document.getElementById('loading-indicator');
      if (loadingIndicator) loadingIndicator.style.display = 'none';
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
    setOtp(
      inputsRef.current.map((input) => input.value).join('')
    );
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
    setOtp(filtered);
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
