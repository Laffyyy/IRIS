import React, { useState, useEffect, useRef } from 'react';
import './MiniChatbot.css';
import airaLogo from '../assets/aira-logo.png';

const MiniChatbot = ({ onViewHistory }) => {
  const [message, setMessage] = useState('');
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [userRole] = useState('HR POC');
  const [messages, setMessages] = useState([]);
  const [currentTitle, setCurrentTitle] = useState('');
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputContainerRef = useRef(null);

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

  useEffect(() => {
    if (messages.length === 1 && messages[0].isUser) {
      const words = messages[0].text.split(' ');
      const title = words.slice(0, 3).join(' ');
      setCurrentTitle(title);
    }
  }, [messages]);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const maxHeight = 120;
      const newHeight = Math.min(textarea.scrollHeight, maxHeight);
      textarea.style.height = newHeight + 'px';
      textarea.style.overflowY = newHeight >= maxHeight ? 'auto' : 'hidden';
    }
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (inputContainerRef.current && document.querySelector('.mini-chatbot-messages')) {
      const inputHeight = inputContainerRef.current.offsetHeight;
      document.querySelector('.mini-chatbot-messages').style.paddingBottom = `${inputHeight}px`;
    }
  }, [message]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleMessageChange = (e) => {
    setMessage(e.target.value);
    adjustTextareaHeight();
  };

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
      
      if (textareaRef.current) {
        textareaRef.current.style.height = '44px';
        textareaRef.current.style.overflowY = 'hidden';
        const container = textareaRef.current.closest('.message-input-container');
        if (container) {
          container.style.minHeight = '80px';
        }
      }
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
      // Save functionality would go here
    }
    setShowSavePrompt(false);
    setMessages([]);
    setMessage('');
    setCurrentTitle('');
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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New Chat
          </button>
          <button className="view-history-button" onClick={onViewHistory}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            History
          </button>
        </div>
      </div>

      <div className="mini-chatbot-messages">
        {messages.length === 0 ? (
          <div className="welcome-message">
            <h2>Welcome to AIRA</h2>
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
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="message-input-container" ref={inputContainerRef}>
        <form onSubmit={handleSendMessage}>
          <button type="button" className="attach-button" aria-label="Attach file">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.44 11.05L12.25 20.24C11.1242 21.3658 9.59723 21.9983 8.005 21.9983C6.41277 21.9983 4.88584 21.3658 3.76 20.24C2.63416 19.1142 2.00166 17.5872 2.00166 15.995C2.00166 14.4028 2.63416 12.8758 3.76 11.75L12.33 3.18C13.0787 2.43128 14.0718 2.00244 15.1 2.00244C16.1282 2.00244 17.1213 2.43128 17.87 3.18C18.6187 3.92872 19.0476 4.92183 19.0476 5.95C19.0476 6.97817 18.6187 7.97128 17.87 8.72L9.41 17.18C9.03472 17.5553 8.52573 17.7636 7.995 17.7636C7.46427 17.7636 6.95528 17.5553 6.58 17.18C6.20472 16.8047 5.99636 16.2957 5.99636 15.765C5.99636 15.2343 6.20472 14.7253 6.58 14.35L15.07 5.86" />
            </svg>
          </button>
          <textarea
            ref={textareaRef}
            className="message-input"
            placeholder="Type your message..."
            value={message}
            onChange={handleMessageChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                handleSendMessage(e);
              }
            }}
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