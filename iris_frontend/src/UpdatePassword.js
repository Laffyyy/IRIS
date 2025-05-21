import React, { useState } from 'react';
import './UpdatePassword.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const UpdatePassword = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const selectedQuestion = location.state?.selectedQuestion || '';
  const answer = location.state?.answer || '';
  const userEmail = location.state?.userEmail || '';

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
    navigate('/security-questions', {
      state: {
        userEmail,
        answer,
        selectedQuestion,
        isVerified: true
      }
    });
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    setError('');

    const { newPassword, confirmPassword } = passwords;

    if (!userEmail) {
      setError('No email found. Please go through the verification process again.');
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError('Both password fields are required.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.post('http://localhost:3000/api/update-password/forgot', {
        email: userEmail,
        newPassword: newPassword,
      });

      if (response.data.success) {
        alert('Password updated successfully.');
        navigate('/');
      } else {
        setError(response.data.message || 'Failed to update password.');
      }
    } catch (err) {
      console.error('Update error:', err);
      setError(err.response?.data?.message || 'An error occurred while updating password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="update-password-container">
      <h2>Update Password</h2>
      <p className="subtitle">Enter a new password for your account</p>

      {error && <div className="error-message">{error}</div>}

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
          <button type="submit" className="save-btn" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UpdatePassword;
