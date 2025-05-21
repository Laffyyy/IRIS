import React, { useState, useEffect } from 'react';
import './ChangePassword.css';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const ChangePassword = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const [passwordWarning, setPasswordWarning] = useState('');
  const [securityQuestionsList, setSecurityQuestionsList] = useState({
    set1: [],
    set2: [],
    set3: []
  });

  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const [securityQuestions, setSecurityQuestions] = useState({
    questionId1: '',
    questionId2: '',
    questionId3: ''
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
    
    // Fetch security questions from the backend
    fetchSecurityQuestions();
  }, []);

  const fetchSecurityQuestions = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/changepass/securityquestions');
      if (response.ok) {
        const data = await response.json();
        const allQuestions = data.questions || [];
        
        if (allQuestions.length >= 9) {
          // Shuffle the questions randomly
          const shuffledQuestions = [...allQuestions].sort(() => Math.random() - 0.5);
          
          // Create 3 separate arrays for each dropdown (3 questions each)
          const questionSet1 = shuffledQuestions.slice(0, 3);
          const questionSet2 = shuffledQuestions.slice(3, 6);
          const questionSet3 = shuffledQuestions.slice(6, 9);
          
          // Store the separated question sets for each dropdown
          setSecurityQuestionsList({
            set1: questionSet1,
            set2: questionSet2,
            set3: questionSet3
          });
        } else {
          console.error('Not enough security questions found in the database');
        }
      } else {
        console.error('Failed to fetch security questions');
      }
    } catch (error) {
      console.error('Error fetching security questions:', error);
    }
  };

  const handleAnswerChange = (e, field) => {
    const value = e.target.value;
    const filteredValue = value.replace(/[^a-zA-Z ]/g, '');
    const truncatedValue = filteredValue.slice(0, 30);
    setAnswers(prev => ({
      ...prev,
      [field]: truncatedValue
    }));
  };

  const handleQuestionChange = (e, field) => {
    const questionId = e.target.value;
    
    // Prevent duplicate question selection
    const currentSelections = Object.values(securityQuestions);
    if (questionId && currentSelections.includes(questionId) && securityQuestions[field] !== questionId) {
      alert("You've already selected this question. Please choose a different one.");
      return;
    }
    
    setSecurityQuestions(prev => ({
      ...prev,
      [field]: questionId
    }));
  };

  const handlePasswordChange = (e, field) => {
    const value = e.target.value;
    const filteredValue = value.replace(/[^a-zA-Z0-9!@#$%^&*()_\-+=<>?{}[\]~.,:;'"|\\]/g, '');
    const truncatedValue = filteredValue.slice(0, 30);

    if (field === 'newPassword') {
      const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,20}$/;
      if (truncatedValue.length >= 20 && !strongPasswordRegex.test(truncatedValue)) {
        alert('Password must include uppercase, lowercase, number, and special character.');
      }
    }

    setPasswords(prev => ({
      ...prev,
      [field]: truncatedValue,
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
  
      // Validate all security questions are answered
      if (!answers.answer1 || !answers.answer2 || !answers.answer3) {
        throw new Error('All security questions must be answered');
      }
  
      // Check if questions are selected
      if (!securityQuestions.questionId1 || !securityQuestions.questionId2 || !securityQuestions.questionId3) {
        throw new Error('Please select all security questions');
      }
  
      const response = await fetch('http://localhost:3000/api/changepass/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: 'firstLogin',
          userId: userId,
          newPassword: passwords.newPassword,
          securityQuestions: {
            questionId1: securityQuestions.questionId1,
            questionId2: securityQuestions.questionId2,
            questionId3: securityQuestions.questionId3,
            answer1: answers.answer1,
            answer2: answers.answer2,
            answer3: answers.answer3
          }
        }),
      });
  
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Failed to update password');
        alert(data.error || 'Failed to update password');
        return;
      }
  
      setSuccess(true);
      setSuccessMessage('Password changed successfully! Redirecting to Dashboard...');
      setShowSuccessToast(true);
      setTimeout(() => {
        setShowSuccessToast(false);
        navigate('../dashboard');
      }, 2000);
    } catch (err) {
      alert(err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('password');
    navigate('/');
  };

  return (
    <div className="change-password-container">
      <h2>Change Password</h2>
      <p className="subtitle">Update your password and set new security questions</p>

      <div className="form-wrapper">
        <form className="form-grid">
          {/* Password Info */}
          <div className="form-section password-section">
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
          <div className="form-section questions-section">
            <h3>Security Questions</h3>

            {/* Question 1 */}
            <div className="security-question-group">
              <label htmlFor="security-question-1">Security Question 1</label>
              <select 
                id="security-question-1" 
                value={securityQuestions.questionId1}
                onChange={(e) => handleQuestionChange(e, 'questionId1')}
              >
                <option value="">Select a question</option>
                {securityQuestionsList.set1 && securityQuestionsList.set1.map(question => (
                  <option 
                    key={question.dSecurityQuestion_ID} 
                    value={question.dSecurityQuestion_ID}
                  >
                    {question.dSecurityQuestion}
                  </option>
                ))}
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
              <select 
                id="security-question-2"
                value={securityQuestions.questionId2}
                onChange={(e) => handleQuestionChange(e, 'questionId2')}
              >
                <option value="">Select a question</option>
                {securityQuestionsList.set2 && securityQuestionsList.set2.map(question => (
                  <option 
                    key={question.dSecurityQuestion_ID} 
                    value={question.dSecurityQuestion_ID}
                  >
                    {question.dSecurityQuestion}
                  </option>
                ))}
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
              <select 
                id="security-question-3"
                value={securityQuestions.questionId3}
                onChange={(e) => handleQuestionChange(e, 'questionId3')}
              >
                <option value="">Select a question</option>
                {securityQuestionsList.set3 && securityQuestionsList.set3.map(question => (
                  <option 
                    key={question.dSecurityQuestion_ID} 
                    value={question.dSecurityQuestion_ID}
                  >
                    {question.dSecurityQuestion}
                  </option>
                ))}
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

        <div className="form-actions-row">
          <button type="button" className="cancel-btn" onClick={handleCancel}>Cancel</button>
          <button type="submit" className="save-btn" onClick={handleSubmit}>Save Changes</button>
        </div>
      </div>

      {/* Success Toast Notification */}
      {showSuccessToast && (
        <div className="success-toast">
          <div className="toast-content">
            <span className="toast-icon">✓</span>
            {successMessage}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChangePassword;