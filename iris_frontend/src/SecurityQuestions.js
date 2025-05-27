import React, { useState, useEffect, useRef } from 'react';
import './SecurityQuestions.css';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import AlertModal from './components/AlertModal';

const MAX_ATTEMPTS = 3;

const SecurityQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [alertModal, setAlertModal] = useState({ isOpen: false, message: '', type: 'info' });
  const navigate = useNavigate();
  const location = useLocation();
  const answerInputRef = useRef(null);

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
        
        if (response.data.skipSecurityQuestions) {
          // If no security questions, redirect to OTP verification
          setAlertModal({
            isOpen: true,
            message: response.data.message,
            type: 'info',
            onClose: () => navigate('/', { state: { userEmail } })
          });
          return;
        }

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
        setAlertModal({
          isOpen: true,
          message: 'Failed to load security questions',
          type: 'error',
          onClose: () => navigate('/')
        });
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
      setAlertModal({
        isOpen: true,
        message: 'Please select a question and provide an answer',
        type: 'error'
      });
      return;
    }

    if (attempts >= MAX_ATTEMPTS) {
      setAlertModal({
        isOpen: true,
        message: 'Too many failed attempts. You have been logged out.',
        type: 'error',
        onClose: () => navigate('/')
      });
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
        setAlertModal({
          isOpen: true,
          message: 'Answer verified successfully!',
          type: 'success',
          onClose: () => navigate('/update-password', { state: { userEmail } })
        });
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setAnswer(''); // Clear the answer field
        setAlertModal({
          isOpen: true,
          message: `Incorrect Answer. ${MAX_ATTEMPTS - newAttempts} attempt(s) left.`,
          type: 'error',
          onClose: () => {
            // Focus the answer input after modal closes
            if (answerInputRef.current) {
              answerInputRef.current.focus();
            }
          }
        });
        
        if (newAttempts >= MAX_ATTEMPTS) {
          setAlertModal({
            isOpen: true,
            message: 'Too many failed attempts. You have been logged out.',
            type: 'error',
            onClose: () => navigate('/')
          });
        }
      }
    } catch (error) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setAnswer(''); // Clear the answer field
      
      let errorMessage = 'An error occurred while verifying your answer.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setAlertModal({
        isOpen: true,
        message: `${errorMessage} ${MAX_ATTEMPTS - newAttempts} attempt(s) left.`,
        type: 'error',
        onClose: () => {
          // Focus the answer input after modal closes
          if (answerInputRef.current) {
            answerInputRef.current.focus();
          }
        }
      });
      
      if (newAttempts >= MAX_ATTEMPTS) {
        setAlertModal({
          isOpen: true,
          message: 'Too many failed attempts. You have been logged out.',
          type: 'error',
          onClose: () => navigate('/')
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="security-questions-container">
      <h2>Security Question Verification</h2>
      <p className="subtitle">Answer your security question to proceed</p>
      <form className="security-questions-form" onSubmit={handleSaveChanges}>
        <div className="question-section">
          <label htmlFor="security-question" className="question-label">Security Question</label>
          <label htmlFor="answer" className="answer-label">Your Question</label>
          <input
            id="security-question"
            type="text"
            value={questions.length > 0 ? questions[0].question : 'No question available'}
            disabled
            className="static-question-input"
            style={{ marginBottom: '1rem' }}
          />
          <label htmlFor="answer" className="answer-label">Your answer</label>
          <input
            id="answer"
            type="text"
            placeholder="Your answer"
            value={answer}
            onChange={handleAnswerChange}
            maxLength={30}
            required
            disabled={isLoading}
            className="answer-input"
            ref={answerInputRef}
          />
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

export default SecurityQuestions;