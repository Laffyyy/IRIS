import React, { useState } from 'react';
import './SecurityQuestions.css';
import { useNavigate } from 'react-router-dom';

const SecurityQuestions = () => {
  const [answer, setAnswer] = useState('');
  const navigate = useNavigate();

  const handleAnswerChange = (e) => {
    const value = e.target.value;
    const filteredValue = value.replace(/[^a-zA-Z]/g, '');
    const truncatedValue = filteredValue.slice(0, 30);
    setAnswer(truncatedValue);
  };

  const handleCancel = () => {
    navigate('/'); // 👈 This now navigates to the Login page
  };

  const handleSaveChanges = (e) => {
    e.preventDefault();
    navigate('/update-password'); // 👈 This already correctly goes to UpdatePassword
  };

  return (
    <div className="security-questions-container">
      <h2>Set Security Question</h2>
      <p className="subtitle">Answer the security question to enhance your account security</p>

      <form className="form-grid" onSubmit={handleSaveChanges}>
        <div className="form-section">
          <h3>Security Question</h3>

          <div className="security-question-group">
            <label htmlFor="security-question">Security Question</label>
            <select id="security-question" required>
              <option value="">Select a question</option>
              <option>What is your mother's maiden name?</option>
              <option>What was the name of your first pet?</option>
              <option>What was the name of your elementary school?</option>
            </select>
            <input
              type="text"
              placeholder="Your answer"
              value={answer}
              onChange={handleAnswerChange}
              maxLength={30}
              required
            />
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

export default SecurityQuestions;
