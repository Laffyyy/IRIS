import React, { useState } from 'react';
import './ChangePassword.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const ChangePassword = ({ onCancel }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const [answers, setAnswers] = useState({
    answer1: '',
    answer2: '',
    answer3: ''
  });

  const handleAnswerChange = (e, field) => {
    const value = e.target.value;
    const filteredValue = value.replace(/[^a-zA-Z.]/g, '');
    const truncatedValue = filteredValue.slice(0, 30);
    setAnswers(prev => ({
      ...prev,
      [field]: truncatedValue
    }));
  };

  const handlePasswordChange = (e, field) => {
    const value = e.target.value;
    const filteredValue = value.replace(/[^a-zA-Z.]/g, '');
    const truncatedValue = filteredValue.slice(0, 30);
    setPasswords(prev => ({
      ...prev,
      [field]: truncatedValue
    }));
  };

  return (
    <div className="change-password-container">
      <h2>Change Password</h2>
      <p className="subtitle">Update your password and set new security questions</p>

      <form className="form-grid">
        {/* Password Info */}
        <div className="form-section">
          <h3>Password Information</h3>

          <div className="security-question-group">
            <label htmlFor="new-password" className="new-password-label">New Password</label>
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
                tabIndex={-1}
              >
                {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
              </button>
            </div>
          </div>

          <div className="security-question-group">
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
                tabIndex={-1}
              >
                {showConfirmPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
              </button>
            </div>
          </div>
        </div>

        {/* Security Questions */}
        <div className="form-section">
          <h3>Security Questions</h3>

          {/* Question 1 */}
          <div className="security-question-group">
            <label htmlFor="security-question-1">Security Question 1</label>
            <select id="security-question-1">
              <option>Select a question</option>
              <option>What is your mother's maiden name?</option>
              <option>What was the name of your first pet?</option>
              <option>What was the name of your elementary school?</option>
            </select>
            <input 
              type="text" 
              placeholder="Your answer" 
              value={answers.answer1}
              onChange={(e) => handleAnswerChange(e, 'answer1')}
              maxLength={30}
            />
          </div>

          {/* Question 2 */}
          <div className="security-question-group">
            <label htmlFor="security-question-2">Security Question 2</label>
            <select id="security-question-2">
              <option>Select a question</option>
              <option>What is your favorite book?</option>
              <option>What city were you born in?</option>
              <option>What is your favorite food?</option>
            </select>
            <input 
              type="text" 
              placeholder="Your answer" 
              value={answers.answer2}
              onChange={(e) => handleAnswerChange(e, 'answer2')}
              maxLength={30}
            />
          </div>

          {/* Question 3 */}
          <div className="security-question-group">
            <label htmlFor="security-question-3">Security Question 3</label>
            <select id="security-question-3">
              <option>Select a question</option>
              <option>What is your favorite movie?</option>
              <option>What is your dream job?</option>
              <option>Who is your childhood best friend?</option>
            </select>
            <input 
              type="text" 
              placeholder="Your answer" 
              value={answers.answer3}
              onChange={(e) => handleAnswerChange(e, 'answer3')}
              maxLength={30}
            />
          </div>
        </div>
      </form>

      <div className="form-buttons">
        <button type="button" className="cancel-btn" onClick={onCancel}>Cancel</button>
        <button type="submit" className="save-btn">Save Changes</button>
      </div>
    </div>
  );
};

export default ChangePassword;
