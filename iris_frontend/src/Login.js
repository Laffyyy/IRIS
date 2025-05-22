import React, { useState, useRef, useEffect } from 'react';
import './Login.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import AlertModal from './components/AlertModal';

const ForgotPasswordModal = ({ onClose, onSubmit }) => {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const handleEmailChange = (e) => {
    const value = e.target.value;
    // Allow alphanumeric characters and specific symbols: -._!@
    const filteredValue = value.replace(/[^a-zA-Z0-9\-._!@]/g, '');
    setEmail(filteredValue);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(email);
    navigate('/otp');
  };

  return (
    <div className="Login-modal-overlay">
      <div className="Login-modal-content">
        <h3>Reset Your Password</h3>
        <p className="Login-modal-text">Please enter your registered email to receive an OTP code.</p>
        <form onSubmit={handleSubmit} className="Login-modal-form">
          <input
            type="text"
            placeholder="Enter your email"
            value={email}
            onChange={handleEmailChange}
            required
            pattern="[a-zA-Z0-9\-._!@]+"
            title="Email can contain letters, numbers, and -._!@ symbols"
          />
          <div className="Login-modal-buttons">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit">Send OTP</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Login = ({ onContinue, onForgotPassword }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [nextImageIndex, setNextImageIndex] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [alertModal, setAlertModal] = useState({ isOpen: false, message: '', type: 'info' });
  const employeeIdRef = useRef(null);
  const navigate = useNavigate();
  const [otp, setOtp] = useState('');
  const [userId, setUserId] = useState('');
  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [isTransitioning, setIsTransitioning] = useState(false);

  const carouselImages = [
    '/assets/loginimage1.jpg',
    '/assets/loginimage2.jpg',
    '/assets/loginimage3.jpg',
  ];

  useEffect(() => {
    if (employeeIdRef.current) {
      employeeIdRef.current.focus();
    }
  }, []);

  useEffect(() => {
    localStorage.clear();
    sessionStorage.clear();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent form submission if alert modal is open
    if (alertModal.isOpen) {
      return;
    }
 
    const payload = {
      userID: employeeId,
      password: password
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
        localStorage.setItem('userId', employeeId);
        localStorage.setItem('password', password);
        navigate('/otp'); 
      } else {
        if (data.message.includes('User not found')) {
          setAlertModal({
            isOpen: true,
            message: 'Invalid username or password.',
            type: 'error'
          });
        } else if (data.message.includes('Invalid password')) {
          setAlertModal({
            isOpen: true,
            message: data.message,
            type: 'error'
          });
        } else if (data.message.includes('Account is locked')) {
          setAlertModal({
            isOpen: true,
            message: 'Your account is locked due to too many failed attempts. Please contact support.',
            type: 'error'
          });
        } else if (data.message.includes('Account is deactivated')) {
          setAlertModal({
            isOpen: true,
            message: 'Your account is deactivated. Please contact support.',
            type: 'error'
          });
        } else if (data.message.includes('Account has expired')) {
          setAlertModal({
            isOpen: true,
            message: 'Your account has expired. Please contact support.',
            type: 'error'
          });
        } else {
          setAlertModal({
            isOpen: true,
            message: data.message || 'Login failed. Please try again.',
            type: 'error'
          });
        }
      }
    } catch (error) {
      console.error('Error during API call:', error);
      setAlertModal({
        isOpen: true,
        message: 'An error occurred while sending the request. Please try again later.',
        type: 'error'
      });
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    const filteredValue = value.replace(/[^a-zA-Z0-9\-._!@]/g, '');
    const truncatedValue = filteredValue.slice(0, 20);
    setPassword(truncatedValue);
  };

  const handleEmployeeIdChange = (e) => {
    const value = e.target.value;
    const filteredValue = value.replace(/[^a-zA-Z0-9]/g, '');
    const truncatedValue = filteredValue.slice(0, 10);
    setEmployeeId(truncatedValue);
  };

  onContinue = (e) => {
    navigate('/otp');
  }
  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentImageIndex((prevIndex) => {
          const next = prevIndex === carouselImages.length - 1 ? 0 : prevIndex + 1;
          setNextImageIndex(next === carouselImages.length - 1 ? 0 : next + 1);
          return next;
        });
        setIsTransitioning(false);
      }, 100);
    }, 5000);
    return () => clearInterval(interval);
  }, [carouselImages.length]);

  return (
    <div className="iris-wrapper">
      <div className="iris-login-box">
        <div className="iris-left">
          <img src={`${process.env.PUBLIC_URL}/assets/logo.png`} alt="IRIS Logo" className="iris-logo" />
          <h2 className="iris-title">IRIS</h2>
          <p className="iris-subtitle">Incentive Reporting & Insight Solution</p>

          <form className="iris-form" onSubmit={handleSubmit}>
            <div className="iris-input-wrapper">
              <label className="iris-label">Username</label>
              <span className="iris-icon">
                <img src={`${process.env.PUBLIC_URL}/assets/user-icon.png`} alt="User Icon" />
              </span>
              <input
                id="employee-id"
                type="text"
                value={employeeId}
                onChange={handleEmployeeIdChange}
                required
                ref={employeeIdRef}
              />
            </div>

            <div className="iris-input-wrapper">
              <label className="iris-label">Password</label>
              <span className="iris-icon password-icon">
                <img src={`${process.env.PUBLIC_URL}/assets/lock-icon.png`} alt="Lock Icon" />
              </span>
              <div className="input-wrapper" style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  required
                  pattern="[a-zA-Z0-9\-._!@]+"
                  title="Password can contain letters, numbers, and -._!@"
                />
                <button
                  type="button"
                  className="eye-icon-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                </button>
              </div>
            </div>

            <div className="iris-forgot-wrapper">
              <a
                href="#"
                className="iris-forgot"
                onClick={(e) => {
                  e.preventDefault();
                  setShowModal(true);
                }}
              >
                Forgot Password?
              </a>
            </div>

            <div className="iris-button-wrapper">
              <button type="submit" className="iris-button">Continue</button>
            </div>
          </form>
        </div>

        <div className="iris-right">
          <div className="carousel-container">
            <div
              className="carousel-slide current"
              style={{
                backgroundImage: `url(${carouselImages[currentImageIndex]})`,
                opacity: isTransitioning ? 0 : 1,
              }}
            />
            <div
              className="carousel-slide next"
              style={{
                backgroundImage: `url(${carouselImages[nextImageIndex]})`,
                opacity: isTransitioning ? 1 : 0,
              }}
            />
          </div>
        </div>
      </div>

      {showModal && (
        <ForgotPasswordModal
          onClose={() => setShowModal(false)}
          onSubmit={(email) => {
            setShowModal(false);
            setAlertModal({
              isOpen: true,
              message: `OTP sent to ${email}`,
              type: 'success'
            });
          }}
        />
      )}

      <AlertModal
        isOpen={alertModal.isOpen}
        message={alertModal.message}
        type={alertModal.type}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
      />
    </div>
  );
};

export default Login;
