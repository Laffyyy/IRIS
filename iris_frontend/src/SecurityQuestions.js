import React, { useState, useEffect } from 'react';
import './SecurityQuestions.css';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const MAX_ATTEMPTS = 3;

const SecurityQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  // Get email from navigation state
  const userEmail = location.state?.userEmail || '';

  useEffect(() => {
    if (!userEmail) return;

    const fetchQuestions = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          'http://localhost:3000/api/security-questions/get-questions',
          { params: { email: userEmail } }
        );
        const fetchedQuestions = response.data.questions || [];
        if (fetchedQuestions.length > 0) {
          // Pick a random question
          const randomIndex = Math.floor(Math.random() * fetchedQuestions.length);
          const randomQuestion = fetchedQuestions[randomIndex];
          setQuestions([randomQuestion]);
          setSelectedQuestion(randomQuestion.id);
        } else {
          setQuestions([]);
          setSelectedQuestion('');
        }
      } catch (err) {
        console.error('Error fetching questions:', err);
        setError('Failed to load security questions');
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, [userEmail]);

  const handleAnswerChange = (e) => {
    const value = e.target.value;
    const filteredValue = value.replace(/[^a-zA-Z0-9\s]/g, '');
    const truncatedValue = filteredValue.slice(0, 30);
    setAnswer(truncatedValue);
    setError('');
  };

  const handleCancel = () => {
    navigate('/');
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedQuestion || !answer) {
      setError('Please select a question and provide an answer');
      return;
    }

    if (attempts >= MAX_ATTEMPTS) {
      setError('Too many failed attempts. You have been logged out.');
      setTimeout(() => {
        navigate('/');
      }, 1500);
      return;
    }

    try {
      setIsLoading(true);
      const answersPayload = {
        [selectedQuestion]: answer
      };

      const response = await axios.post(
        'http://localhost:3000/api/security-questions/verify-answers',
        { email: userEmail, answers: answersPayload }
      );

      if (response.data.success) {
        setAttempts(0); // reset on success
        navigate('/update-password', { state: { userEmail } });
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setError('Incorrect Answer');
        if (newAttempts < MAX_ATTEMPTS) {
          alert(`Incorrect Answer. ${MAX_ATTEMPTS - newAttempts} attempt(s) left.`);
        }
        if (newAttempts >= MAX_ATTEMPTS) {
          setError('Too many failed attempts. You have been logged out.');
          alert('Too many failed attempts. You have been logged out.');
          setTimeout(() => {
            navigate('/');
          }, 1500);
        }
      }
    } catch (err) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setError('Incorrect Answer');
      if (newAttempts < MAX_ATTEMPTS) {
        alert(`Incorrect Answer. ${MAX_ATTEMPTS - newAttempts} attempt(s) left.`);
      }
      if (newAttempts >= MAX_ATTEMPTS) {
        setError('Too many failed attempts. You have been logged out.');
        alert('Too many failed attempts. You have been logged out.');
        setTimeout(() => {
          navigate('/');
        }, 1500);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="security-questions-container">
      <h2>Security Question Verification</h2>
      <p className="subtitle">Answer your security question to proceed</p>
      <form className="form-grid" onSubmit={handleSaveChanges}>
        <div className="form-section">
          <h3>Security Question</h3>

          {isLoading && questions.length === 0 ? (
            <p>Loading questions...</p>
          ) : (
            <div className="question-answer-container">
              <input
                type="text"
                value={questions.length > 0 ? questions[0].question : 'No question available'}
                disabled
                className="static-question-input"
                style={{ marginBottom: '1rem' }}
              />
              <input
                type="text"
                placeholder="Your answer"
                value={answer}
                onChange={handleAnswerChange}
                maxLength={30}
                required
                disabled={isLoading}
              />
            </div>
          )}
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
            disabled={isLoading || !selectedQuestion || !answer}
            
          >
            {isLoading ? 'Verifying...' : 'Verify Answer'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SecurityQuestions;