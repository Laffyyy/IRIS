import React, { useState, useRef, useEffect } from 'react';
import './Login.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import ModalWarning from './components/ModalWarning';
import ModalPasswordExpired from './components/ModalPasswordExpired';
import AlertModal from './components/AlertModal';
import axios from 'axios';

const ForgotPasswordModal = ({ onClose, onSubmit }) => {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();
  const [alertModal, setAlertModal] = useState({ isOpen: false, message: '', type: 'info' });

  const handleEmailChange = (e) => {
    const value = e.target.value;
    // Allow alphanumeric characters and specific symbols: -._!@
    const filteredValue = value.replace(/[^a-zA-Z0-9\-._!@]/g, '');
    // Limit to 30 characters
    const truncatedValue = filteredValue.slice(0, 30);
    setEmail(truncatedValue);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:3000/api/fp/send-otp', { email });
      localStorage.setItem('userEmail', email); // Store email in localStorage
      setAlertModal({
        isOpen: true,
        message: res.data.message || 'OTP sent successfully',
        type: 'success',
        onClose: () => {
          onClose(); // Close the modal
          navigate('/otp', { state: { userEmail: email } }); // Pass email via state
        }
      });
    } catch (err) {
      setAlertModal({
        isOpen: true,
        message: err.response?.data?.message || 'Failed to send OTP. Please try again.',
        type: 'error'
      });
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Reset Your Password</h3>
        <p className="modal-text">Please enter your registered email to receive an OTP code.</p>
        <form onSubmit={handleSubmit} className="modal-form">
          <input
            type="text"
            placeholder="Enter your email"
            value={email}
            onChange={handleEmailChange}
            required
            maxLength={30}
            pattern="[a-zA-Z0-9\-._!@]+"
            title="Email can contain letters, numbers, and -._!@ symbols"
          />
          <div className="modal-buttons">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit">Send OTP</button>
          </div>
        </form>
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

const Login = ({ onContinue, onForgotPassword }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [nextImageIndex, setNextImageIndex] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [alertModal, setAlertModal] = useState({ isOpen: false, message: '', type: 'info' });
  const [isTransitioning, setIsTransitioning] = useState(false); // Add this line
  const employeeIdRef = useRef(null);
  const navigate = useNavigate();
  // Add new state for the password expiration modals
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [otp, setOtp] = useState('');
  const [userId, setUserId] = useState('');
  const [passwords, setPasswords] = useState({
  newPassword: '',
  confirmPassword: ''
});

  const carouselImages = [
    '/assets/loginimage1.jpg',
    '/assets/loginimage2.jpg',
    '/assets/loginimage3.jpg',
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

    if (!employeeId || !password) {
      setAlertModal({
        isOpen: true,
        message: 'Please enter both username and password.',
        type: 'warning'
      });
      return;
    }

    try {
      // First check user status and verify credentials in one call
      const verifyResponse = await fetch('http://localhost:3000/api/changepass/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          userID: employeeId, 
          password: password 
        })
      });

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok) {
        // Authentication failed
        setAlertModal({
          isOpen: true,
          message: verifyData.message || 'Invalid username or password.',
          type: 'error'
        });
        return;
      }

      // Authentication succeeded, now check status
      if (verifyData.status === 'FIRST-TIME') {
        // Store the credentials in localStorage for the change password page
        localStorage.setItem('userId', employeeId);
        localStorage.setItem('password', password);
        localStorage.setItem('isFirstTimeLogin', 'true');
        
        // Generate OTP for first-time login user before redirecting
        try {
          const otpResponse = await fetch('http://localhost:3000/api/otp/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId: employeeId })
          });
          
          if (!otpResponse.ok) {
            throw new Error('Failed to generate OTP');
          }
          
          // Now we can redirect to OTP page since an OTP has been sent
          navigate('/otp');
        } catch (otpError) {
          console.error('Error generating OTP:', otpError);
          setAlertModal({
            isOpen: true,
            message: 'Failed to send verification code. Please try again.',
            type: 'error'
          });
        }
        return;
      }

      // If we reach here, it's a normal login process
      const payload = {
        userID: employeeId,
        password: password
      };

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
        // Remove AlertModal for userId login, just navigate directly to OTP page
        navigate('/otp', { state: { userId: employeeId } });

        // Check for soon-to-expire password
        try {
          const expirationCheck = await fetch('http://localhost:3000/api/password-expiration/manage', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
              operation: 'check',
              userId: employeeId 
            })
          });
          
          if (expirationCheck.ok) {
            const expirationData = await expirationCheck.json();
            
            // Store expiration date for modals if available
            if (expirationData.expirationDate) {
              localStorage.setItem('expirationDate', expirationData.expirationDate);
            }
            
            // First check if password is already expired
            if (expirationData.isExpired) {
              // Password is already expired - show expired modal
              localStorage.setItem('isPasswordExpired', 'true');
              setShowExpiredModal(true);
              return; // Wait for user's action on the expired modal
            } 
            // Then check if password will expire soon (within 10 days)
            else if (expirationData.minutesLeft !== undefined && expirationData.minutesLeft <= 14400) {
              // Calculate days remaining
              setDaysRemaining(Math.ceil(expirationData.minutesLeft / (24 * 60)));
              
              // Show warning modal
              setShowWarningModal(true);
              return; // Wait for user to acknowledge the warning
            } 
            else {
              // Password is not expired and not close to expiring - continue normal login flow
              navigate('/otp');
            }
            if (expirationData.minutesLeft !== undefined && expirationData.minutesLeft <= 14400) {
              // Password will expire soon (10 days or less) - show warning
              
              // Calculate days remaining
              setDaysRemaining(Math.ceil(expirationData.minutesLeft / (24 * 60)));
              
              // Store expiration date for the modal
              if (expirationData.expirationDate) {
                localStorage.setItem('expirationDate', expirationData.expirationDate);
              }
              
              // Show the warning modal
              setShowWarningModal(true);
              return; // Wait for user to acknowledge the warning
            } else {
              // Password is fine, continue to OTP page
              navigate('/otp');
            }
          } else {
            // If the check fails, continue to OTP anyway
            navigate('/otp');
          }
        } catch (expError) {
          // If there's an error, continue to OTP
          navigate('/otp');
        }
      } else {
        // Handle other login response errors as before
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

  // Handler for the expired password modal
// Replace your handleChangePassword function with this:

const handleChangePassword = async () => {
  try {
    // Check if employeeId is available
    if (!employeeId) {
      console.error('Employee ID is missing');
      setAlertModal({
        isOpen: true,
        message: 'User ID is missing. Please try logging in again.',
        type: 'error'
      });
      return;
    }
    
    // First generate an OTP for verification
    const otpResponse = await fetch('http://localhost:3000/api/otp/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        userId: employeeId
      })
    });

    if (!otpResponse.ok) {
      const errorData = await otpResponse.json();
      throw new Error(errorData.message || 'Failed to send verification code');
    }
    
    // Set flags in localStorage for the OTP page
    localStorage.setItem('isPasswordExpired', 'true');
    localStorage.setItem('userId', employeeId);
    localStorage.setItem('password', password); // Also store password for OTP verification
    
    // Close the expired password modal 
    setShowExpiredModal(false);
    
    // Create a custom navigation function
    const navigateToOtpPage = () => {
      navigate('/otp');
    };
    
    // Show the success message with the navigation function attached
    setAlertModal({
      isOpen: true,
      message: 'Verification code sent to your email',
      type: 'success',
      onClose: navigateToOtpPage // Attach custom close handler
    });
    
  } catch (error) {
    console.error('Error sending OTP:', error);
    setAlertModal({
      isOpen: true,
      message: `Failed to send verification code: ${error.message}`,
      type: 'error'
    });
  }
};


  // Handler for the warning modal
  const handleCloseWarning = () => {
    setShowWarningModal(false);
    navigate('/otp'); // Continue the login flow after the warning is acknowledged
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    const filteredValue = value.replace(/[^a-zA-Z0-9\-._!@]/g, '');
    const truncatedValue = filteredValue.slice(0, 20);
    setPassword(truncatedValue);
  };

  const handleEmployeeIdChange = (e) => {
    const value = e.target.value;
    const filteredValue = value.replace(/[^0-9]/g, '');
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

      {/* Password Expiration Modals */}
      <ModalPasswordExpired 
        open={showExpiredModal} 
        onClose={() => setShowExpiredModal(false)}
        onChangePassword={handleChangePassword}
        expirationDate={localStorage.getItem('expirationDate')}
      />

        <ModalWarning
          open={showWarningModal}
          onClose={handleCloseWarning}
          daysRemaining={daysRemaining}
          expirationDate={localStorage.getItem('expirationDate')}
        />

<AlertModal
  isOpen={alertModal.isOpen}
  message={alertModal.message}
  type={alertModal.type}
  onClose={() => {
    // Check if we have a custom onClose handler
    if (alertModal.onClose) {
      alertModal.onClose();
    } else {
      // Check if we need to navigate after closing using the flag method
      const shouldNavigate = localStorage.getItem('navigateToOtp') === 'true';
      
      // If navigation flag is set, navigate and clear the flag
      if (shouldNavigate) {
        localStorage.removeItem('navigateToOtp');
        navigate('/otp');
      }
    }
    
    // Close the modal
    setAlertModal({ ...alertModal, isOpen: false });
  }}
/>
    </div>
  );
};

export default Login;
