// Otp.js
import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Otp.css';
import AlertModal from './components/AlertModal';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

const Otp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const inputsRef = useRef([]);
  
  // State initialization with localStorage persistence
  const [expireTime, setExpireTime] = useState(() => {
    const savedExpireTime = localStorage.getItem('otpExpireTime');
    const savedExpireTimestamp = localStorage.getItem('otpExpireTimestamp');
    if (savedExpireTime && savedExpireTimestamp) {
      const timePassed = Math.floor((Date.now() - parseInt(savedExpireTimestamp)) / 1000);
      const remainingTime = Math.max(0, parseInt(savedExpireTime) - timePassed);
      return remainingTime;
    }
    return 180;
  });
  
  const [resendTime, setResendTime] = useState(() => {
    const savedResendTime = localStorage.getItem('otpResendTime');
    const savedResendTimestamp = localStorage.getItem('otpResendTimestamp');
    if (savedResendTime && savedResendTimestamp) {
      const timePassed = Math.floor((Date.now() - parseInt(savedResendTimestamp)) / 1000);
      const remainingTime = Math.max(0, parseInt(savedResendTime) - timePassed);
      return remainingTime;
    }
    return 90;
  });
  
  const [canResend, setCanResend] = useState(() => {
    const savedCanResend = localStorage.getItem('otpCanResend');
    return savedCanResend === 'true';
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [otpValues, setOtpValues] = useState(() => {
    const savedOtpValues = localStorage.getItem('otpValues');
    return savedOtpValues ? JSON.parse(savedOtpValues) : Array(6).fill('');
  });
  const [alertModal, setAlertModal] = useState({ isOpen: false, message: '', type: 'info' });

  // Initialize user data from location state or localStorage
  useEffect(() => {
    if (location.state?.userEmail) {
      setUserEmail(location.state.userEmail);
    } else if (location.state?.userId) {
      setUserId(location.state.userId);
    } else {
      // Check localStorage for user data
      const storedUserId = localStorage.getItem('userId');
      const storedUserEmail = localStorage.getItem('userEmail');
      
      if (storedUserId) setUserId(storedUserId);
      if (storedUserEmail) setUserEmail(storedUserEmail);
    }
  }, [location.state]);

  // Check credentials and redirect if missing
  useEffect(() => {
    // For login flow (userId)
    const storedUserId = localStorage.getItem('userId');
    const storedPassword = localStorage.getItem('password');
    
    // For forgot password flow (email)
    const storedUserEmail = localStorage.getItem('userEmail');
    
    if (!storedUserId && !storedUserEmail) {
      clearOtpData();
      navigate('/');
    }
  }, [navigate]);

  // Focus first input on mount
  useEffect(() => {
    if (inputsRef.current[0]) {
      inputsRef.current[0].focus();
    }
  }, []);

  // Timer effects
  useEffect(() => {
    if (expireTime > 0) {
      const startTime = Date.now();
      const timer = setInterval(() => {
        const currentTime = Date.now();
        const timePassed = Math.floor((currentTime - startTime) / 1000);
        setExpireTime(prev => Math.max(0, prev - timePassed));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [expireTime]);

  useEffect(() => {
    if (resendTime > 0 && !canResend) {
      const startTime = Date.now();
      const timer = setInterval(() => {
        const currentTime = Date.now();
        const timePassed = Math.floor((currentTime - startTime) / 1000);
        setResendTime(prev => {
          const newTime = Math.max(0, prev - timePassed);
          if (newTime === 0) {
            setCanResend(true);
          }
          return newTime;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [resendTime, canResend]);

  // Persist state to localStorage
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

  const clearOtpData = () => {
    localStorage.removeItem('otpExpireTime');
    localStorage.removeItem('otpExpireTimestamp');
    localStorage.removeItem('otpResendTime');
    localStorage.removeItem('otpResendTimestamp');
    localStorage.removeItem('otpCanResend');
    localStorage.removeItem('otpValues');
  };

  const handleResendCode = async () => {
    if (!canResend) return;

    try {
      setLoading(true);
      let response;
      
      if (userEmail) {
        // For email users (forgot password flow)
        response = await axios.post('http://localhost:3000/api/fp/send-otp', { email: userEmail });
      } else if (userId) {
        // For userId users (login flow)
        response = await axios.post('http://localhost:3000/api/otp/generate', { userId });
      } else {
        setAlertModal({
          isOpen: true,
          message: 'No user information found for resending OTP.',
          type: 'error'
        });
        return;
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
      
      setAlertModal({
        isOpen: true,
        message: 'A new OTP has been sent.',
        type: 'success'
      });
    } catch (err) {
      setAlertModal({
        isOpen: true,
        message: err.response?.data?.message || 'Failed to resend OTP. Please try again.',
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

    if (value && index < 5) {
      inputsRef.current[index + 1].focus();
    }
    setIsComplete(newOtpValues.every(val => val));
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
    
    try {
      let response;
      
      if (userEmail) {
        // Forgot password flow
        const payload = { email: userEmail, otp };
        response = await axios.post('http://localhost:3000/api/fp/verify-otp', payload);
        
        if (response.status === 200) {
          setAlertModal({
            isOpen: true,
            message: response.data.message || 'OTP verified!',
            type: 'success',
            onClose: () => {
              localStorage.setItem('userEmail', userEmail);
              navigate('/security-questions', { state: { userEmail } });
            }
          });
        }
      } else if (userId) {
        // Login flow
        const password = localStorage.getItem('password');
        if (!password) {
          setAlertModal({
            isOpen: true,
            message: 'Session expired. Please log in again.',
            type: 'error',
            onClose: () => {
              clearOtpData();
              navigate('/');
            }
          });
          return;
        }
        
        const payload = { userID: userId, password, otp };
        response = await axios.post('http://localhost:3000/api/login/', payload);
        
        if (response.status === 200) {
          const { data } = response;
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
                navigate('../change-password');
              } else if (userStatus === 'ACTIVE') {
                if (roles.includes('admin')) {
                  navigate('../admin/dashboard');
                } else if (roles.includes('HR')) {
                  navigate('../hr');
                } else if (roles.includes('REPORTS')) {
                  navigate('../reports');
                } else if (roles.includes('CNB')) {
                  navigate('../compensation');
                } else {
                  navigate('/');
                }
              }
            }
          });
        }
      } else {
        setAlertModal({
          isOpen: true,
          message: 'User information not found. Please try again.',
          type: 'error'
        });
        return;
      }
    } catch (error) {
      setAlertModal({
        isOpen: true,
        message: error.response?.data?.message || 'An error occurred while verifying the OTP. Please try again.',
        type: 'error'
      });
    }
  };

  const handleBack = () => {
    clearOtpData();
    navigate('/');
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
            disabled={!canResend || loading}
          >
            {loading ? 'Sending...' : 
             canResend ? 'Resend Code' : `Resend in ${formatTime(resendTime)}`}
          </button>
        </div>

        <div className="otp-button-group">
          <button
            className="otp-back"
            onClick={handleBack}
            disabled={loading}
          >
            Back
          </button>
          <button
            id="otp-submit-button"
            className={`otp-submit ${isComplete ? 'otp-submit-enabled' : ''}`}
            onClick={handleSubmit}
            disabled={!isComplete || loading}
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
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