import React, { useState } from 'react';
import './UpdatePassword.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const UpdatePassword = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const navigate = useNavigate();

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
    navigate('/security-questions'); // Redirect to SecurityQuestions page
  };

  const handleSaveChanges = (e) => {
    e.preventDefault();
    // Add your save changes logic here (e.g., API call to save password)
    navigate('/security-questions'); // After saving, navigate back to SecurityQuestions
  };

  return (
    <div className="update-password-container">
      <h2>Update Password</h2>
      <p className="subtitle">Enter a new password for your account</p>

      <form className="form-grid" onSubmit={handleSaveChanges}>
        {/* Password Info */}
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
      </form>

      <div className="form-buttons">
        <button type="button" className="cancel-btn" onClick={handleCancel}>Cancel</button>
        <button type="submit" className="save-btn">Save Changes</button>
      </div>
    </div>
  );
};

export default UpdatePassword;
