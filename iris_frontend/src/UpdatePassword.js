import React, { useState } from 'react';
import './UpdatePassword.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import AlertModal from './components/AlertModal';

const UpdatePassword = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [alertModal, setAlertModal] = useState({ isOpen: false, message: '', type: 'info' });

  const navigate = useNavigate();
  const location = useLocation();

  const selectedQuestion = location.state?.selectedQuestion || '';
  const answer = location.state?.answer || '';
  const userEmail = location.state?.userEmail || '';

  const validatePassword = (password) => {
    // Check length (15-20 characters)
    if (password.length < 15 || password.length > 20) {
      return 'Password must be between 15 and 20 characters';
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }

    // Check for at least one number
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }

    // Check for allowed special characters
    const allowedSpecialChars = /^[a-zA-Z0-9!\/[_\-.!@,]+$/;
    if (!allowedSpecialChars.test(password)) {
      return 'Password can only contain letters, numbers, and these special characters: !/[_\-.!@,';
    }

    return null;
  };

  const handlePasswordChange = (e, field) => {
    const value = e.target.value;
    // Allow letters (a-z, A-Z), numbers (0-9), and specific special characters !/[_-.!@,
    const sanitizedValue = value.replace(/[^a-zA-Z0-9!\/[_\-.@,]/g, '');
    setPasswords(prev => ({
      ...prev,
      [field]: sanitizedValue
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

    if (!userEmail) {
      setAlertModal({
        isOpen: true,
        message: 'No email found. Please go through the verification process again.',
        type: 'error'
      });
      return;
    }

    if (!passwords.newPassword || !passwords.confirmPassword) {
      setAlertModal({
        isOpen: true,
        message: 'Both password fields are required.',
        type: 'error'
      });
      return;
    }

    // Validate password
    const passwordError = validatePassword(passwords.newPassword);
    if (passwordError) {
      setAlertModal({
        isOpen: true,
        message: passwordError,
        type: 'error'
      });
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setAlertModal({
        isOpen: true,
        message: 'Passwords do not match.',
        type: 'error'
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.post('http://localhost:3000/api/update-password/forgot', {
        email: userEmail,
        newPassword: passwords.newPassword,
      });

      if (response.data.success) {
        setAlertModal({
          isOpen: true,
          message: 'Password updated successfully.',
          type: 'success',
          onClose: () => {
            // Clear any stored data
            localStorage.removeItem('userEmail');
            navigate('/');
          }
        });
      } else {
        setAlertModal({
          isOpen: true,
          message: response.data.message || 'Failed to update password.',
          type: 'error'
        });
      }
    } catch (err) {
      console.error('Update error:', err);
      let errorMessage = 'New password cannot be the same as any of your last 3 passwords.';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      setAlertModal({
        isOpen: true,
        message: errorMessage,
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="update-password-container">
      <h2>Update Password</h2>
      <p className="subtitle">Set your new password</p>

      <form className="update-password-form" onSubmit={handleSaveChanges}>
        <div className="password-section">
          <label htmlFor="new-password" className="password-label">New Password</label>
          <div className="input-wrapper">
            <input
              id="new-password"
              type={showPassword ? 'text' : 'password'}
              value={passwords.newPassword}
              onChange={(e) => handlePasswordChange(e, 'newPassword')}
              required
              maxLength={20}
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

          <label htmlFor="confirm-password" className="password-label">Confirm Password</label>
          <div className="input-wrapper">
            <input
              id="confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={passwords.confirmPassword}
              onChange={(e) => handlePasswordChange(e, 'confirmPassword')}
              required
              maxLength={20}
            />
            <button
              type="button"
              className="eye-icon-btn"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showConfirmPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
            </button>
          </div>
        </div>

        <div className="form-buttons">
          <button
            type="button"
            className="cancel-btn"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="save-btn"
            disabled={isLoading || !passwords.newPassword || !passwords.confirmPassword}
          >
            {isLoading ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </form>

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

export default UpdatePassword;
