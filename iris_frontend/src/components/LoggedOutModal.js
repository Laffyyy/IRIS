// components/LoggedOutModal.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LoggedOutModal.css'; // Optional styling

const LoggedOutModal = () => {
  const navigate = useNavigate();

  const handleLoginAgain = () => {
    localStorage.clear(); // optional: clear user session
    navigate('/');
  };

  return (
    <div className="LoggedOutModal-modal-overlay">
      <div className="LoggedOutModal-modal-content">
        <h2>You have been logged out</h2>
        <p>Due to inactivity, your session has expired.</p>
        <button onClick={handleLoginAgain}>Login Again</button>
      </div>
    </div>
  );
};

export default LoggedOutModal;
