import React, { useState, useEffect } from 'react';
import './UpdatePassword.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';

const UpdatePassword = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const navigate = useNavigate();
  const location = useLocation();

  // Use values passed from previous page or fallback to localStorage
  const selectedQuestion = location.state?.selectedQuestion || localStorage.getItem('iris_selected_question') || '';
  const answer = location.state?.answer || localStorage.getItem('iris_answer_field') || '';
  const email = location.state?.email || localStorage.getItem('iris_email') || '';

  // Save to localStorage when component mounts
  useEffect(() => {
    localStorage.setItem('iris_selected_question', selectedQuestion);
    localStorage.setItem('iris_answer_field', answer);
    localStorage.setItem('iris_email', email);

    // Cleanup function to remove localStorage items when component unmounts
    return () => {
      localStorage.removeItem('iris_selected_question');
      localStorage.removeItem('iris_answer_field');
      localStorage.removeItem('iris_email');
    };
  }, [selectedQuestion, answer, email]);

  const handlePasswordChange = (e, field) => {
    const value = e.target.value;
    const filteredValue = value.replace(/[^a-zA-Z0-9\-._!@]/g, '');
    const truncatedValue = filteredValue.slice(0, 30);
    setPasswords(prev => ({
      ...prev,
      [field]: truncatedValue
    }));
  };

  const handleCancel = () => {
    // Save current state before navigating back
    localStorage.setItem('iris_selected_question', selectedQuestion);
    localStorage.setItem('iris_answer_field', answer);
    localStorage.setItem('iris_email', email);

    navigate('/security-questions', {
      state: {
        email,
        answer,
        selectedQuestion,
        isVerified: true // Add this flag to indicate coming from update password flow
      }
    });
  };

  const handleSaveChanges = (e) => {
    e.preventDefault();
    
    // Password validation
    if (passwords.newPassword !== passwords.confirmPassword) {
      alert("Passwords don't match");
      return;
    }

    if (passwords.newPassword.length < 8) {
      alert("Password must be at least 8 characters long");
      return;
    }

    // Submit the new password to your backend
    fetch("http://localhost:3000/update-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        newPassword: passwords.newPassword,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          alert("Password updated successfully");
          // Clear localStorage on successful password update
          localStorage.removeItem('iris_selected_question');
          localStorage.removeItem('iris_answer_field');
          localStorage.removeItem('iris_email');
          navigate("/");
        } else {
          alert("Failed to update password: " + (data.message || "Unknown error"));
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("Failed to update password");
      });
  };

  return (
    <div className="update-password-container">
      <h2>Update Password</h2>
      <p className="subtitle">Enter a new password for your account</p>

      <form className="form-grid" onSubmit={handleSaveChanges}>
        <div className="form-section">
          <h3>Password Information</h3>

          <div className="password-group">
            <label htmlFor="new-password">New Password</label>
            <div className="input-wrapper">
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter new password"
                value={passwords.newPassword}
                onChange={(e) => handlePasswordChange(e, 'newPassword')}
                minLength={8}
                required
              />
              <button
                type="button"
                className="eye-icon-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
              </button>
            </div>
          </div>

          <div className="password-group">
            <label htmlFor="confirm-password">Confirm New Password</label>
            <div className="input-wrapper">
              <input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm new password"
                value={passwords.confirmPassword}
                onChange={(e) => handlePasswordChange(e, 'confirmPassword')}
                minLength={8}
                required
              />
              <button
                type="button"
                className="eye-icon-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
              </button>
            </div>
          </div>
        </div>

        <div className="form-buttons">
          <button type="button" className="cancel-btn" onClick={handleCancel}>Cancel</button>
          <button type="submit" className="save-btn">Save Changes</button>
        </div>
      </form>
    </div>
  );
};

export default UpdatePassword;