import React, { useState, useEffect } from 'react';
import './MiniChatbot.css';
import airaLogo from '../assets/aira-logo.png';

const MiniChatbot = ({ onViewHistory }) => {
  const [message, setMessage] = useState('');
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [userRole] = useState('HR POC'); // This should come from your auth system
  const [messages, setMessages] = useState([]);
  const [currentTitle, setCurrentTitle] = useState('');

  // Role-specific quick replies
  const quickReplies = {
    'HR POC': [
      "What are the most common Disciplinary Actions?",
      "Show attrition rate trend",
      "List employees with infractions",
      "How many employees went on LOA in March?",
      "Generate a summary of disciplinary actions by department"
    ],
    'Admin': [
      "Show recent user activities",
      "List uploaded files",
      "Display audit logs",
      "Which employees were added last month?",
      "Show audit logs for modifications"
    ],
    'Reports POC': [
      "Show KPI trends",
      "Generate performance report",
      "List underperforming KPIs",
      "Which departments consistently meet targets?",
      "Who are the top 5 performers?"
    ],
    'C&B': [
      "Show incentive eligibility",
      "Display C&B logs",
      "Compare LOB performance",
      "Which employees were eligible for incentives?",
      "Compare Client's LOB performance"
    ]
  };

  // Auto-generate title from first message
  useEffect(() => {
    if (messages.length === 1 && messages[0].isUser) {
      const words = messages[0].text.split(' ');
      const title = words.slice(0, 3).join(' ');
      setCurrentTitle(title);
    }
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      const newMessage = {
        id: Date.now(),
        text: message,
        timestamp: new Date().toLocaleTimeString(),
        isUser: true
      };
      setMessages([...messages, newMessage]);
      setMessage('');
    }
  };

  const handleNewChat = () => {
    if (messages.length > 0) {
      setShowSavePrompt(true);
    } else {
      setMessages([]);
      setMessage('');
      setCurrentTitle('');
    }
  };

  const handleSaveChat = (save) => {
    if (save) {
      // TODO: Implement save chat functionality
      // This should save to your backend with the currentTitle
    }
    setShowSavePrompt(false);
    setMessages([]);
    setMessage('');
    setCurrentTitle('');
  };

  const handleCopyMessage = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handleEditMessage = (messageId, newText) => {
    setMessages(messages.map(msg => 
      msg.id === messageId ? { ...msg, text: newText } : msg
    ));
  };

  return (
    <div className="mini-chatbot-container">
      <div className="mini-chatbot-header">
        <div className="header-content">
          <img src={airaLogo} alt="Aira Logo" className="logo" />
          <h1>AIRA</h1>
        </div>
        <div className="header-actions">
          <button className="mini-new-chat-button" onClick={handleNewChat}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New Chat
          </button>
          <button className="view-history-button" onClick={onViewHistory}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            History
          </button>
        </div>
      </div>

      <div className="mini-chatbot-messages">
        {messages.length === 0 ? (
          <div className="welcome-message">
            <h2>Welcome to IRIS AI Assistant</h2>
            <p>How can I help you today?</p>
            <div className="quick-replies">
              {quickReplies[userRole]?.map((reply, index) => (
                <button
                  key={index}
                  className="quick-reply-button"
                  onClick={() => setMessage(reply)}
                >
                  {reply}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="message-list">
            {messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.isUser ? 'user-message' : 'ai-message'}`}>
                <div className="message-content">
                  <p>{msg.text}</p>
                  <span className="message-timestamp">{msg.timestamp}</span>
                </div>
                <div className="message-actions">
                  <button
                    onClick={() => handleCopyMessage(msg.text)}
                    className="action-button"
                    aria-label="Copy message"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M8 5H6C4.89543 5 4 5.89543 4 7V19C4 20.1046 4.89543 21 6 21H16C17.1046 21 18 20.1046 18 19V17M8 5C8 6.10457 8.89543 7 10 7H12C13.1046 7 14 6.10457 14 5M8 5C8 3.89543 8.89543 3 10 3H12C13.1046 3 14 3.89543 14 5M14 5H16C17.1046 5 18 5.89543 18 7V9" />
                    </svg>
                  </button>
                  {msg.isUser && (
                    <button
                      onClick={() => handleEditMessage(msg.id, msg.text)}
                      className="action-button"
                      aria-label="Edit message"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" />
                        <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="message-input-container">
        <form onSubmit={handleSendMessage}>
          <button type="button" className="attach-button" aria-label="Attach file">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.44 11.05L12.25 20.24C11.1242 21.3658 9.59723 21.9983 8.005 21.9983C6.41277 21.9983 4.88584 21.3658 3.76 20.24C2.63416 19.1142 2.00166 17.5872 2.00166 15.995C2.00166 14.4028 2.63416 12.8758 3.76 11.75L12.33 3.18C13.0787 2.43128 14.0718 2.00244 15.1 2.00244C16.1282 2.00244 17.1213 2.43128 17.87 3.18C18.6187 3.92872 19.0476 4.92183 19.0476 5.95C19.0476 6.97817 18.6187 7.97128 17.87 8.72L9.41 17.18C9.03472 17.5553 8.52573 17.7636 7.995 17.7636C7.46427 17.7636 6.95528 17.5553 6.58 17.18C6.20472 16.8047 5.99636 16.2957 5.99636 15.765C5.99636 15.2343 6.20472 14.7253 6.58 14.35L15.07 5.86" />
            </svg>
          </button>
          <input
            type="text"
            className="message-input"
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button type="submit" className="send-button" aria-label="Send message">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
          </button>
        </form>
      </div>

      {showSavePrompt && (
        <div className="save-prompt-modal">
          <div className="modal-content">
            <h3>Save Current Chat?</h3>
            <p>Would you like to save this conversation before starting a new chat?</p>
            <div className="modal-buttons">
              <button onClick={() => handleSaveChat(true)}>Save</button>
              <button onClick={() => handleSaveChat(false)}>Don't Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MiniChatbot; 