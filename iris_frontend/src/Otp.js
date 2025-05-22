// Otp.js
import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import './Otp.css';
import AlertModal from './components/AlertModal';
import { jwtDecode } from 'jwt-decode';

const Otp = ({ onBack, onComplete }) => {
  const navigate = useNavigate(); // Initialize useNavigate
  const inputsRef = useRef([]);
  const [expireTime, setExpireTime] = useState(() => {
    const savedExpireTime = localStorage.getItem('expireTime');
    const savedExpireTimestamp = localStorage.getItem('expireTimestamp');
    if (savedExpireTime && savedExpireTimestamp) {
      const timePassed = Math.floor((Date.now() - parseInt(savedExpireTimestamp)) / 1000);
      const remainingTime = Math.max(0, parseInt(savedExpireTime) - timePassed);
      return remainingTime;
    }
    return 180; // 3 minutes
  });
  const [resendTime, setResendTime] = useState(() => {
    const savedResendTime = localStorage.getItem('resendTime');
    const savedResendTimestamp = localStorage.getItem('resendTimestamp');
    if (savedResendTime && savedResendTimestamp) {
      const timePassed = Math.floor((Date.now() - parseInt(savedResendTimestamp)) / 1000);
      const remainingTime = Math.max(0, parseInt(savedResendTime) - timePassed);
      return remainingTime;
    }
    return 90;
  });
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

  // Add new useEffect for focusing first input
  useEffect(() => {
    // Focus on the first input when component mounts
    if (inputsRef.current[0]) {
      inputsRef.current[0].focus();
    }
  }, []); // Empty dependency array means this runs once on mount

  const [isComplete, setIsComplete] = useState(false);
  const [otpValues, setOtpValues] = useState(Array(6).fill(''));

  useEffect(() => {
    if (expireTime > 0) {
      const timer = setTimeout(() => {
        const newExpireTime = expireTime - 1;
        setExpireTime(newExpireTime);
        localStorage.setItem('expireTime', newExpireTime.toString());
        localStorage.setItem('expireTimestamp', Date.now().toString());
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [expireTime]);

  useEffect(() => {
    if (resendTime > 0 && !canResend) {
      const timer = setTimeout(() => {
        const newResendTime = resendTime - 1;
        setResendTime(newResendTime);
        localStorage.setItem('resendTime', newResendTime.toString());
        localStorage.setItem('resendTimestamp', Date.now().toString());
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTime, canResend]);

  useEffect(() => {
    localStorage.setItem('otpExpireTime', expireTime.toString());
    localStorage.setItem('otpExpireTimestamp', Date.now().toString());
  }, [expireTime]);

  useEffect(() => {
    localStorage.setItem('otpResendTime', resendTime.toString());
    localStorage.setItem('otpResendTimestamp', Date.now().toString());
  }, [resendTime]);

  useEffect(() => {
    localStorage.setItem('otpCanResend', canResend.toString());
  }, [canResend]);

  useEffect(() => {
    localStorage.setItem('otpValues', JSON.stringify(otpValues));
  }, [otpValues]);

  const handleResendCode = async () => {
    if (!canResend) return;
    
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/otp/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userID: userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to resend OTP');
      }

      setResendTime(90);
      setExpireTime(180);
      localStorage.setItem('resendTime', '90');
      localStorage.setItem('expireTime', '180');
      localStorage.setItem('resendTimestamp', Date.now().toString());
      localStorage.setItem('expireTimestamp', Date.now().toString());
      setCanResend(false);
      setOtpValues(Array(6).fill(''));
      inputsRef.current.forEach(input => {
        if (input) input.value = '';
      });
      inputsRef.current[0]?.focus();
      setError('');
      setAlertModal({
        isOpen: true,
        message: 'A new OTP has been sent to your email.',
        type: 'success'
      });
    } catch (err) {
      setAlertModal({
        isOpen: true,
        message: 'Failed to resend OTP. Please try again.',
        type: 'error'
      });
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

    // Check if all OTP values are filled
    const allFilled = newOtpValues.every(val => val !== '');
    setIsComplete(allFilled);

    if (value && index < 5) {
      inputsRef.current[index + 1].focus();
      setIsComplete(true);
    } else if (value && index === 5) {
      // When the last input is filled, focus on the Continue button
      setIsComplete(true);
      document.getElementById('otp-submit-button').focus();
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
    const pastedData = e.clipboardData.getData('Text').toUpperCase();
    const filtered = pastedData.replace(/[^A-Z0-9]/g, '').slice(0, 6);

    if (filtered.length === 6) {
      const newOtpValues = Array(6).fill('');
      filtered.split('').forEach((char, i) => {
        inputsRef.current[i].value = char;
        newOtpValues[i] = char;
      });
      setOtpValues(newOtpValues);
      setIsComplete(true);
      inputsRef.current[5].focus();
    }
    e.preventDefault();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    const otp = otpValues.join('');
    const userId = localStorage.getItem('userId');
    const password = localStorage.getItem('password');

    if (!userId || !password) {
      setAlertModal({
        isOpen: true,
        message: 'User ID or password is missing. Please log in again.',
        type: 'error'
      });
      return;
    }

    const payload = {
      userID: userId,
      password: password,
      otp: otp
    };

    try {
      const response = await fetch('http://localhost:3000/api/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        const userStatus = data.data.user?.status;
        const token = data.data.token;
        
        if (token) {
          localStorage.setItem('token', token);
        }

        setAlertModal({
          isOpen: true,
          message: data.message || 'Login successful',
          type: 'success',
          onClose: () => {
            // Decode token to get user roles
            const decoded = jwtDecode(token);
            const roles = decoded.roles
              ? Array.isArray(decoded.roles) ? decoded.roles : [decoded.roles]
              : decoded.role
                ? [decoded.role]
                : [];

      if (userStatus === 'FIRST-TIME') {
        navigate('../change-password'); // Redirect to change password page
      } else if (userStatus === 'ACTIVE') {
        alert('Login successful');
        navigate('../dashboard'); // Redirect to dashboard or home page
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
    // Clear all timer-related data from localStorage
    localStorage.removeItem('expireTime');
    localStorage.removeItem('expireTimestamp');
    localStorage.removeItem('resendTime');
    localStorage.removeItem('resendTimestamp');
    // Clear other login data
    localStorage.removeItem('userId');
    localStorage.removeItem('password');
    navigate('/'); // Redirect to the login page
  }

  // Add cleanup effect for component unmount
  useEffect(() => {
    return () => {
      // Only clear timer data if we're not refreshing
      if (!window.performance.navigation.type === 1) {
        localStorage.removeItem('expireTime');
        localStorage.removeItem('expireTimestamp');
        localStorage.removeItem('resendTime');
        localStorage.removeItem('resendTimestamp');
      }
    };
  }, []);

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
              ? `Code will expire in ${formatTime(expireTime)}`
              : 'The code has expired'}
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
          <button 
          className="otp-back" 
          onClick={handleBack}
          >Back</button>
          <button
            id="otp-submit-button"
            className={`otp-submit ${isComplete ? 'otp-submit-enabled' : ''}`}
            onClick={handleSubmit}
            disabled={!isComplete}
            type="button"
          >
            Continue
          </button>
        </div>
      </div>

      <AlertModal
        isOpen={alertModal.isOpen}
        message={alertModal.message}
        type={alertModal.type}
        onClose={() => {
          if (alertModal.onClose) {
            alertModal.onClose();
          }
          setAlertModal({ ...alertModal, isOpen: false });
        }}
      />
    </div>
  );
};

export default Otp;
