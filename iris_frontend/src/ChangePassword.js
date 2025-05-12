import React, { useState, useEffect } from 'react';
import './ChangePassword.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const ChangePassword = ({ onCancel }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const [securityQuestions, setSecurityQuestions] = useState({
    question1: 'What is your mother\'s maiden name?',
    question2: 'What was the name of your first pet?',
    question3: 'What was the name of your elementary school?'
  });

  const [answers, setAnswers] = useState({
    answer1: '',
    answer2: '',
    answer3: ''
  });

  useEffect(() => {
    // Retrieve userId from localStorage (saved during login)
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  const handleAnswerChange = (e, field) => {
    const value = e.target.value;
    const filteredValue = value.replace(/[^a-zA-Z]/g, '');
    const truncatedValue = filteredValue.slice(0, 30);
    setAnswers(prev => ({
      ...prev,
      [field]: truncatedValue
    }));
  };

  const handleQuestionChange = (e, field) => {
    setSecurityQuestions(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handlePasswordChange = (e, field) => {
    const value = e.target.value;
    const filteredValue = value.replace(/[^a-zA-Z-._!@]/g, '');
    const truncatedValue = filteredValue.slice(0, 30);
    setPasswords(prev => ({
      ...prev,
      [field]: truncatedValue
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
  
    try {
      // Validate passwords match
      if (passwords.newPassword !== passwords.confirmPassword) {
        throw new Error('Passwords do not match');
      }
  
      // Validate all security questions are answered and selected
      if (!answers.answer1 || !answers.answer2 || !answers.answer3) {
        throw new Error('All security questions must be answered');
      }
  
      // Check if "Select a question" is selected
      if (securityQuestions.question1 === 'Select a question' || 
          securityQuestions.question2 === 'Select a question' || 
          securityQuestions.question3 === 'Select a question') {
        throw new Error('Please select all security questions');
      }
  
      const response = await fetch('http://localhost:3000/api/changepass/firstlogin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          newPassword: passwords.newPassword,
          securityQuestions: {
            Security_Question: securityQuestions.question1,
            Security_Question2: securityQuestions.question2,
            Security_Question3: securityQuestions.question3,
            Security_Answer: answers.answer1,
            Security_Answer2: answers.answer2,
            Security_Answer3: answers.answer3
          }
        }),
      });
  
      const data = await response.json();
      
      if (!response.ok) {
        // Just set the error message without throwing a new error
        setError(data.error || 'Failed to update password');
        alert(data.error || 'Failed to update password');
        return; // Return early instead of throwing
      }
  
      setSuccess(true);
      setTimeout(() => {
        onCancel(); // Redirect to login after successful password change
      }, 2000);
    } catch (err) {
      // Client-side validation errors only
      alert(err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password-container">
      <h2>Change Password</h2>
      <p className="subtitle">Update your password and set new security questions</p>

      <form id = "changePasswordForm" className="form-grid" onSubmit={handleSubmit}>
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
                required
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
                required
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
            <select id="security-question-1"
              value={securityQuestions.question1}
              onChange={(e) => handleQuestionChange(e, 'question1')}
              required
            >
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
              required
            />
          </div>

          {/* Question 2 */}
          <div className="security-question-group">
            <label htmlFor="security-question-2">Security Question 2</label>
            <select id="security-question-2"
              value={securityQuestions.question2}
              onChange={(e) => handleQuestionChange(e, 'question2')}
              required
             >
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
              required
            />
          </div>

          {/* Question 3 */}
          <div className="security-question-group">
            <label htmlFor="security-question-3">Security Question 3</label>
            <select id="security-question-3"
              value={securityQuestions.question3}
              onChange={(e) => handleQuestionChange(e, 'question3')}
              required
             >
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
              required
            />
          </div>
        </div>
      </form>
      <div className="form-buttons">
            <button type="button" className="cancel-btn" onClick={onCancel}>Cancel</button>
            <button type="submit" className="save-btn" form="changePasswordForm">Save Changes</button>
          </div>
    </div>
  );
};

export default ChangePassword;
