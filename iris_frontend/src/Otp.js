// Otp.js
import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // Import useLocation
import './Otp.css';
import { jwtDecode } from 'jwt-decode';

const Otp = ({ onBack, onComplete }) => {
  const location = useLocation(); // Initialize useLocation
  const navigate = useNavigate(); // Initialize useNavigate
  const email = location.state?.email || ""; // Get email from previous step
  const inputsRef = useRef([]);
  const [expireTime, setExpireTime] = useState(180); // 3 minutes
  const [resendTime, setResendTime] = useState(90);
  const [canResend, setCanResend] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [otpValues, setOtpValues] = useState(Array(6).fill(""));
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

  useEffect(() => {
    const allFilled = otpValues.every((value) => value !== "");
    setIsComplete(allFilled);

    if (allFilled) {
      document.getElementById("otp-submit-button").focus();
    }
  }, [otpValues]);

  const handleResendCode = async () => {
    if (!canResend) return;
    
    try {
      setLoading(true);
      // API call to resend OTP
      const response = await fetch('http://localhost:3000/api/otp/generate', {
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
      setOtpValues(Array(6).fill(''));
      inputsRef.current.forEach(input => {
        if (input) input.value = '';
      });
      inputsRef.current[0]?.focus();
      setError('');
    } catch (err) {
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e, index) => {
    let value = e.target.value.toUpperCase();
    value = value.replace(/[^A-Z0-9]/g, '');

    if (value.length > 1) return;

    e.target.value = value;
    const newOtpValues = [...otpValues];
    newOtpValues[index] = value;
    setOtpValues(newOtpValues);

    if (value && index < 5) {
      inputsRef.current[index + 1].focus();
      setIsComplete(true);
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !e.target.value && index > 0) {
      const newOtpValues = [...otpValues];
      newOtpValues[index] = '';
      setOtpValues(newOtpValues);
      inputsRef.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    const pastedData = e.clipboardData.getData("Text").toUpperCase();
    const filtered = pastedData.replace(/[^A-Z0-9]/g, "").slice(0, 6);

    if (filtered.length === 6) {
      const newOtpValues = Array(6).fill('');
      filtered.split('').forEach((char, i) => {
        inputsRef.current[i].value = char;
        newOtpValues[i] = char;
        setIsComplete(true);
      });
      setOtpValues(newOtpValues);
      inputsRef.current[5].focus();
    }
    e.preventDefault();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleOtpSuccess = () => {
    // After successful OTP verification
    navigate("/security-questions", { state: { email } });
  };

  const onotphandleSubmit = () => {
    if (isComplete) {
      // Trigger onComplete callback if provided
      if (onComplete) {
        onComplete();
      }
      // Navigate to the Security Questions page
      handleOtpSuccess();
    }
  };

  const handleSubmit = async () => {
    const otp = otpValues.join(''); // Combine OTP values into a single string

    // Retrieve userId and password from localStorage
    const userId = localStorage.getItem('userId');
    const password = localStorage.getItem('password');

    if (!userId || !password) {
      alert('User ID or password is missing. Please log in again.');
      return;
    }

    // Prepare the payload
    const payload = {
      userId,
      password,
      otp
    };

    try {
      // Send POST request to the API
      const response = await fetch('http://localhost:3000/api/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        // Handle successful OTP verification
        const userStatus = data.data.user.status;
        localStorage.setItem('token', data.data.token); // Save token to localStorage
        alert(data.data.message);

  // Decode token to get user roles
  const decoded = jwtDecode(data.data.token);
  const roles = decoded.roles
    ? Array.isArray(decoded.roles) ? decoded.roles : [decoded.roles]
    : decoded.role
      ? [decoded.role]
      : [];

  if (userStatus === 'FIRST-TIME') {
    navigate('../change-password');
  } else if (userStatus === 'ACTIVE') {
    alert('Login successful');
    if (roles.includes('admin')) {
      navigate('../dashboard');
    } else if (roles.includes('HR')) {
      navigate('../hr');
    } else if (roles.includes('REPORTS')) {
      navigate('../reports');
    } else if (roles.includes('CNB')) {
      navigate('../cb');
    } else {
      navigate('/'); // fallback
    }
  }
} else {
      // Handle failed OTP verification
      alert(data.data.message || 'Failed to verify OTP. Please try again.');
    }
  } catch (error) {
    console.error('Error during OTP verification:', error);
    alert('An error occurred while verifying the OTP. Please try again.');
  }

  
  

};
 const handleBack = () => {
    // Clear local storage or any other necessary cleanup
    localStorage.removeItem('userId');
    localStorage.removeItem('password');
    navigate('/'); // Redirect to the login page
  };

  return (
    <div className="otp-container">
      <div className="otp-card">
        <img
          src="/assets/logo.png"
          alt="IRIS Logo"
          className="otp-logo"
          draggable={false}
        />
        <h2 className="otp-title">IRIS</h2>
        <p className="otp-subtitle">Incentive Reporting & Insight Solution</p>

        <div className="otp-alert">
          A one-time passcode has been sent to your registered email.
        </div>

        <label className="otp-label">Enter OTP</label>
        <div className="otp-input-group" onPaste={handlePaste}>
          {Array(6)
            .fill("")
            .map((_, i) => (
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
              ? `Code will expire in ${formatTime(expireTime)}`
              : 'The code has expired'}
          </p>
          <button
            className="resend-otp"
            onClick={handleResendCode}
            disabled={!canResend}
          >
            {canResend ? "Resend Code" : `Resend in ${formatTime(resendTime)}`}
          </button>
        </div>

        <div className="otp-button-group">
          <button className="otp-back" onClick={onBack || (() => navigate(-1))}>
            Back
          </button>
          <button
            id="otp-submit-button"
            className={`otp-submit ${isComplete ? "otp-submit-enabled" : ""}`}
            onClick={onotphandleSubmit}
            disabled={!isComplete}
            type="button"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default Otp;
