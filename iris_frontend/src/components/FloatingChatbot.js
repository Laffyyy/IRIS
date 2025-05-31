import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './FloatingChatbot.css';
import MiniChatbot from './MiniChatbot';
import airaLogo from '../assets/aira-logo.png';

const FloatingChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isChatHistoryPage = location.pathname === '/chat-history';

  useEffect(() => {
    // Close the mini chat when navigating to chat history
    if (isChatHistoryPage) {
      setIsOpen(false);
    }
  }, [isChatHistoryPage]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleViewHistory = () => {
    navigate('/chat-history');
  };

  // Don't render anything if we're on the chat history page
  if (isChatHistoryPage) {
    return null;
  }

  return (
    <div className="floating-chatbot-container">
      <button className="floating-chat-button" onClick={toggleChat}>
        <img src={airaLogo} alt="Aira" className="chat-icon" />
      </button>
      {isOpen && (
        <MiniChatbot 
          onViewHistory={handleViewHistory}
        />
      )}
    </div>
  );
};

export default FloatingChatbot; 