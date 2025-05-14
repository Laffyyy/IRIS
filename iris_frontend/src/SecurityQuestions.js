import React, { useState } from 'react';
import './SecurityQuestions.css';

const SecurityQuestions = () => {
  const [answer, setAnswer] = useState('');

  const handleAnswerChange = (e) => {
    const value = e.target.value;
    const filteredValue = value.replace(/[^a-zA-Z]/g, '');
    const truncatedValue = filteredValue.slice(0, 30);
    setAnswer(truncatedValue);
  };

  return (
    <div className="security-questions-container">
      <h2>Set Security Question</h2>
      <p className="subtitle">Answer the security question to enhance your account security</p>

      <form className="form-grid">
        <div className="form-section">
          <h3>Security Question</h3>

          {/* Question 1 */}
          <div className="security-question-group">
            <label htmlFor="security-question">Security Question</label>
            <select id="security-question">
              <option>Select a question</option>
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
            />
          </div>
        </div>
      </form>

      <div className="form-buttons">
        <button type="button" className="cancel-btn">Cancel</button>
        <button type="submit" className="save-btn">Save Changes</button>
      </div>
    </div>
  );
};

export default SecurityQuestions;
