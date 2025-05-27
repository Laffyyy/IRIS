import React, { useState, useEffect } from 'react';
import './ChangePassword.css';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { jwtDecode } from 'jwt-decode';
import AlertModal from './components/AlertModal';

const ChangePassword = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const [passwordWarning, setPasswordWarning] = useState('');
  const [formSubmitAttempted, setFormSubmitAttempted] = useState(false);
  const [alertModal, setAlertModal] = useState({ isOpen: false, message: '', type: 'info', onClose: null });
  const [securityQuestionsList, setSecurityQuestionsList] = useState({
    set1: [],
    set2: [],
    set3: []
  });

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
    // Allow alphanumeric plus dash, dot, underscore, exclamation point, and @ symbol
    const filteredValue = value.replace(/[^a-zA-Z0-9_\-.!@]/g, '');
    const truncatedValue = filteredValue.slice(0, 20);
  
    if (field === 'newPassword') {
      // Check password complexity requirements
      const hasUpperCase = /[A-Z]/.test(value);
      const hasLowerCase = /[a-z]/.test(value);
      const hasNumber = /[0-9]/.test(value);
      const hasSpecial = /[_\-.!@]/.test(value);
      const hasMinLength = value.length >= 15;
      const hasMaxLength = value.length <= 20;
      
      if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecial || !hasMinLength || !hasMaxLength) {
        let warning = 'Password must:';
        if (!hasMinLength) warning += '\n- Be at least 12 characters long';
        if (!hasMaxLength) warning += '\n- Be no more than 20 characters long';
        if (!hasUpperCase) warning += '\n- Include at least one uppercase letter';
        if (!hasLowerCase) warning += '\n- Include at least one lowercase letter';  
        if (!hasNumber) warning += '\n- Include at least one number';
        if (!hasSpecial) warning += '\n- Include at least one special character (`-` , `.` ,  `_` ,  `!` ,  `@`)';
        
        setPasswordWarning(warning);
      } else {
        setPasswordWarning('');
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
    setFormSubmitAttempted(true); // Mark form as submitted attempt

    if (!isFormValid()) {
      return; // Stop execution if the form isn't valid
    }

    setLoading(true);
    
    try {
      // Validate each field
      if (!passwords.newPassword || !passwords.confirmPassword || 
        !securityQuestions.questionId1 || !securityQuestions.questionId2 || !securityQuestions.questionId3 ||
        !answers.answer1 || !answers.answer2 || !answers.answer3) {
        return;
      }
  
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
  
      // First request - update password and security questions
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
        throw new Error(data.error || 'Failed to update password');
      }
  
      // Extract token from response
      const token = data.data?.token;
      
      if (token) {
        localStorage.setItem('token', token);
        
        // Decode token to get user roles
        const decoded = jwtDecode(token);
        const roles = decoded.roles 
          ? Array.isArray(decoded.roles) ? decoded.roles : [decoded.roles]
          : decoded.role
            ? [decoded.role]
            : [];
        
        // Redirect based on role after short delay
        setAlertModal({
          isOpen: true,
          message: 'First-Time Login Completed. Press Ok to Continue',
          type: 'success',
          onClose: () => {
            // Role-based redirection happens when user clicks OK
            if (roles.includes('admin')) {
              navigate('../admin/dashboard');
            } else if (roles.includes('HR')) {
              navigate('../hr');
            } else if (roles.includes('REPORTS')) {
              navigate('../reports');
            } else if (roles.includes('CNB')) {
              navigate('../compensation');
            } else {
              navigate('../dashboard'); // Default fallback
            }
          }
        });
      } else {
        throw new Error('No token received after authentication');
      }
    } catch (err) {
      if (err.message.includes('same as any of your last 3 passwords') || 
        err.message.includes('cannot be the same as any of your last')) {
      setAlertModal({
        isOpen: true,
        message: "New Password can't be the same as old password.",
        type: 'error'
      });
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    // Check password requirements
    const password = passwords.newPassword;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const hasMinLength = password.length >= 15;
    const hasMaxLength = password.length <= 20;
    const passwordsMatch = password === passwords.confirmPassword;
    
    // Check if all security questions are selected
    const allQuestionsSelected = 
      securityQuestions.questionId1 && 
      securityQuestions.questionId2 && 
      securityQuestions.questionId3;
      
    // Check if all security answers are provided
    const allAnswersProvided = 
      answers.answer1 && 
      answers.answer2 && 
      answers.answer3;
    
    // Only enable the button if all conditions are met
    return hasUpperCase && hasLowerCase && hasNumber && hasSpecial && 
           hasMinLength && hasMaxLength && passwordsMatch && allQuestionsSelected && 
           allAnswersProvided;
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
              {/* Password requirements list - added below input */}
                {(passwords.newPassword.length < 15 || 
                passwords.newPassword.length > 20 ||
                !/[A-Z]/.test(passwords.newPassword) || 
                !/[a-z]/.test(passwords.newPassword) || 
                !/[0-9]/.test(passwords.newPassword) || 
                !/[^A-Za-z0-9]/.test(passwords.newPassword)) && (
                <div className="password-requirements">
                  <small>Password must:</small>
                  <ul>
                    {passwords.newPassword.length < 15 && (
                      <li className="requirement-item">Be at least 15 characters long</li>
                    )}
                    {passwords.newPassword.length > 20 && (
                      <li className="requirement-item">Be no more than 20 characters long</li>
                    )}
                    {!/[A-Z]/.test(passwords.newPassword) && (
                      <li className="requirement-item">Include at least one uppercase letter</li>
                    )}
                    {!/[a-z]/.test(passwords.newPassword) && (
                      <li className="requirement-item">Include at least one lowercase letter</li>
                    )}
                    {!/[0-9]/.test(passwords.newPassword) && (
                      <li className="requirement-item">Include at least one number</li>
                    )}
                    {!/[_\-.!@]/.test(passwords.newPassword) && (
                      <li className="requirement-item">Include at least one special character (- . _ ! @)</li>
                    )}
                  </ul>
                </div>
              )}
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
                {/* Show password match error on form submit with various conditions */}
                {formSubmitAttempted && (
                  <>
                    {!passwords.confirmPassword && (
                      <div className="password-mismatch">
                        Confirm Password field cannot be empty
                      </div>
                    )}
                    {passwords.confirmPassword && passwords.newPassword !== passwords.confirmPassword && (
                      <div className="password-mismatch">
                        Password does not match with New Password
                      </div>
                    )}
                  </>
                )}
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
              {formSubmitAttempted && (
                <>
                  {!securityQuestions.questionId1 && !answers.answer1 && (
                    <div className="password-mismatch">Security Question and Answer cannot be empty</div>
                  )}
                  {!securityQuestions.questionId1 && answers.answer1 && (
                    <div className="password-mismatch">Security Question cannot be empty</div>
                  )}
                  {securityQuestions.questionId1 && !answers.answer1 && (
                    <div className="password-mismatch">Answer cannot be empty</div>
                  )}
                </>
              )}
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
              {formSubmitAttempted && (
                  <>
                    {!securityQuestions.questionId2 && !answers.answer2 && (
                      <div className="password-mismatch">Security Question and Answer cannot be empty</div>
                    )}
                    {!securityQuestions.questionId2 && answers.answer2 && (
                      <div className="password-mismatch">Security Question cannot be empty</div>
                    )}
                    {securityQuestions.questionId2 && !answers.answer2 && (
                      <div className="password-mismatch">Answer cannot be empty</div>
                    )}
                  </>
                )}
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
              {formSubmitAttempted && (
                  <>
                    {!securityQuestions.questionId3 && !answers.answer3 && (
                      <div className="password-mismatch">Security Question and Answer cannot be empty</div>
                    )}
                    {!securityQuestions.questionId3 && answers.answer3 && (
                      <div className="password-mismatch">Security Question cannot be empty</div>
                    )}
                    {securityQuestions.questionId3 && !answers.answer3 && (
                      <div className="password-mismatch">Answer cannot be empty</div>
                    )}
                  </>
                )}
            </div>
          </div>
        </form>

        <div className="form-actions-row">
          <button type="button" className="cancel-btn" onClick={handleCancel}>Cancel</button>
          <button type="submit" className="save-btn" onClick={handleSubmit}>Save Changes</button>
        </div>
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

export default ChangePassword;