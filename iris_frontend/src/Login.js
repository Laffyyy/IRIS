import React, { useState, useRef, useEffect } from "react";
import "./Login.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
// Login.js or EmailContext.js
import { createContext, useContext } from "react";

export const EmailContext = createContext();
export const useEmail = () => useContext(EmailContext);

const ForgotPasswordModal = ({ onClose, onSubmit }) => {
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSending(true);

    try {
      await onSubmit(email); // wait for OTP sending process
      navigate("/otp", { state: { email } }); // navigate with email state
    } catch (error) {
      console.error("Error sending OTP:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Reset Your Password</h3>
        <p className="modal-text">
          Please enter your registered email to receive an OTP code.
        </p>
        <form onSubmit={handleSubmit} className="modal-form">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="modal-buttons">
            <button type="button" onClick={onClose} disabled={isSending}>
              Cancel
            </button>
            <button type="submit" disabled={isSending}>
              {isSending ? "Sending..." : "Send OTP"}
            </button>
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
  const [showModal, setShowModal] = useState(false);
  const employeeIdRef = useRef(null);
  const navigate = useNavigate();
  const [otp, setOtp] = useState('');
const [userId, setUserId] = useState('');
const [passwords, setPasswords] = useState({
  newPassword: '',
  confirmPassword: ''
});

  const carouselImages = [
    '/assets/stephen1.jpg',
    '/assets/stephen2.jpg',
    '/assets/stephen3.jpg',
  ];

  useEffect(() => {
    if (employeeIdRef.current) {
      employeeIdRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
 
    // Prepare the payload
    const payload = {
      userId : employeeId,
      password: password,
      otp: "",
    };
    console.log('Payload:', payload);
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
        alert('Request successful!');
        console.log('Response:', data);
        localStorage.setItem('userId', employeeId);
        localStorage.setItem('password', password);
        navigate('/otp'); 
      } else {
        alert(`Error: ${data.message}`);
        console.error('Error:', data);
      }
    } catch (error) {
      console.error('Error during API call:', error);
      alert('An error occurred while sending the request.');
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
    const filteredValue = value.replace(/[^0-9]/g, '');
    const truncatedValue = filteredValue.slice(0, 10);
    setEmployeeId(truncatedValue);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === carouselImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);
    return () => clearInterval(interval);
  }, [carouselImages.length]);

  return (
    <div className="iris-wrapper">
      <div className="iris-login-box">
        {/* Left Panel */}
        <div className="iris-left">
          <img src="assets/logo.png" alt="IRIS Logo" className="iris-logo" />
          <h2 className="iris-title">IRIS</h2>
          <p className="iris-subtitle">
            Incentive Reporting & Insight Solution
          </p>

          <form className="iris-form" onSubmit={handleSubmit}>
            <div className="iris-input-wrapper">
              <label htmlFor="employee-id" className="iris-label">Employee ID</label>
              <span className="iris-icon">
                <img src="assets/user-icon.png" alt="User Icon" />
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
                <img src="/assets/lock-icon.png" alt="Lock Icon" />
              </span>
              <div className="input-wrapper" style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
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
                  {showPassword ? (
                    <FaEyeSlash size={14} />
                  ) : (
                    <FaEye size={14} />
                  )}
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
              className="carousel-slide"
              style={{
                backgroundImage: `url(${carouselImages[currentImageIndex]})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />
            <div className="carousel-indicators">
              {carouselImages.map((_, index) => (
                <span
                  key={index}
                  className={`indicator ${index === currentImageIndex ? 'active' : ''}`}
                  onClick={() => setCurrentImageIndex(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <ForgotPasswordModal
          onClose={() => setShowModal(false)}
          onSubmit={(email) => {
            setShowModal(false);
            console.log('Sending OTP to:', email);
            alert(`OTP sent to ${email}`);
          }}
        />
      )}
    </div>
  );
};

export default Login;
