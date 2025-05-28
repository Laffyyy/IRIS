import React, { useState } from 'react';
import './Chatbot.css';
import logo from '../assets/aira-logo.png';

const Chatbot = ({ onClose, onMinimize }) => {
  const [message, setMessage] = useState('');
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingTitle, setEditingTitle] = useState(null);
  const [userRole] = useState('HR POC'); // This should come from your auth system
  const [messages, setMessages] = useState([]);
  const [chatHistory, setChatHistory] = useState([
    {
      id: 1,
      title: "Monthly Report Analysis",
      timestamp: "2024-03-20 14:30",
      preview: "Can you analyze the monthly sales report...",
      messages: []
    },
    {
      id: 2,
      title: "Client Data Processing",
      timestamp: "2024-03-19 10:15",
      preview: "Help me process the client data for...",
      messages: []
    },
    {
      id: 3,
      title: "KPI Metrics Review",
      timestamp: "2024-03-18 16:45",
      preview: "What are the current KPI metrics...",
      messages: []
    }
  ]);

  // Role-specific quick replies
  const quickReplies = {
    'HR POC': [
      "What are the most common Disciplinary Actions?",
      "Show attrition rate trend",
      "List employees with infractions"
    ],
    'Admin': [
      "Show recent user activities",
      "List uploaded files",
      "Display audit logs"
    ],
    'Reports POC': [
      "Show KPI trends",
      "Generate performance report",
      "List underperforming KPIs"
    ],
    'C&B': [
      "Show incentive eligibility",
      "Display C&B logs",
      "Compare LOB performance"
    ]
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
    }
  };

  const handleNewChat = () => {
    if (message.trim()) {
      setShowSavePrompt(true);
    } else {
      setMessages([]);
      setMessage('');
    }
  };

  const handleSaveChat = (save) => {
    if (save) {
      const newChat = {
        id: Date.now(),
        title: message.split(' ').slice(0, 3).join(' '), // First 3 words as title
        timestamp: new Date().toLocaleString(),
        preview: message,
        messages: [...messages]
      };
      setChatHistory([newChat, ...chatHistory]);
    }
    setShowSavePrompt(false);
    setMessages([]);
    setMessage('');
  };

  const handleDeleteChat = (chatId) => {
    setChatHistory(chatHistory.filter(chat => chat.id !== chatId));
  };

  const handleRenameChat = (chatId, newTitle) => {
    setChatHistory(chatHistory.map(chat => 
      chat.id === chatId ? { ...chat, title: newTitle } : chat
    ));
    setEditingTitle(null);
  };

  const handleCopyMessage = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handleEditMessage = (messageId, newText) => {
    setMessages(messages.map(msg => 
      msg.id === messageId ? { ...msg, text: newText } : msg
    ));
    setEditingMessageId(null);
  };

  return (
    <div className="chatbot-chat-container">
      <div className="chatbot-chat-header">
        <div className="header-content">
          <img src={logo} alt="Aira Logo" className="logo" />
          <h1>IRIS AI Assistant</h1>
        </div>
        <div className="header-actions">
          <button className="new-chat-button" onClick={handleNewChat}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New Chat
          </button>
          <button className="minimize-button" onClick={onMinimize}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button className="close-button" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="chatbot-chat-main">
        <div className="chatbot-chat-history">
          <div className="history-header">
            <h2>Chat History</h2>
          </div>
          <div className="history-list">
            {chatHistory.length > 0 ? (
              chatHistory.map((chat) => (
                <div key={chat.id} className="history-item">
                  <div className="history-item-header">
                    {editingTitle === chat.id ? (
                      <input
                        type="text"
                        value={chat.title}
                        onChange={(e) => handleRenameChat(chat.id, e.target.value)}
                        onBlur={() => setEditingTitle(null)}
                        autoFocus
                      />
                    ) : (
                      <h3 onClick={() => setEditingTitle(chat.id)}>{chat.title}</h3>
                    )}
                    <div className="history-actions">
                      <span className="timestamp">{chat.timestamp}</span>
                      <button 
                        className="delete-button"
                        onClick={() => handleDeleteChat(chat.id)}
                        aria-label="Delete chat"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="preview">{chat.preview}</p>
                </div>
              ))
            ) : (
              <p className="no-history">No chat history available.</p>
            )}
          </div>
        </div>

        <div className="chatbot-chat-interface">
          <div className="chatbot-chat-messages">
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
                    {editingMessageId === msg.id ? (
                      <input
                        type="text"
                        value={msg.text}
                        onChange={(e) => handleEditMessage(msg.id, e.target.value)}
                        onBlur={() => setEditingMessageId(null)}
                        autoFocus
                      />
                    ) : (
                      <>
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
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M8 5H6C4.89543 5 4 5.89543 4 7V19C4 20.1046 4.89543 21 6 21H16C17.1046 21 18 20.1046 18 19V17M8 5C8 6.10457 8.89543 7 10 7H12C13.1046 7 14 6.10457 14 5M8 5C8 3.89543 8.89543 3 10 3H12C13.1046 3 14 3.89543 14 5M14 5H16C17.1046 5 18 5.89543 18 7V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                          {msg.isUser && (
                            <button
                              onClick={() => setEditingMessageId(msg.id)}
                              className="action-button"
                              aria-label="Edit message"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="message-input-container">
            <form onSubmit={handleSendMessage}>
              <button type="button" className="attach-button" aria-label="Attach file">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21.44 11.05L12.25 20.24C11.1242 21.3658 9.59723 21.9983 8.005 21.9983C6.41277 21.9983 4.88584 21.3658 3.76 20.24C2.63416 19.1142 2.00166 17.5872 2.00166 15.995C2.00166 14.4028 2.63416 12.8758 3.76 11.75L12.33 3.18C13.0787 2.43128 14.0718 2.00244 15.1 2.00244C16.1282 2.00244 17.1213 2.43128 17.87 3.18C18.6187 3.92872 19.0476 4.92183 19.0476 5.95C19.0476 6.97817 18.6187 7.97128 17.87 8.72L9.41 17.18C9.03472 17.5553 8.52573 17.7636 7.995 17.7636C7.46427 17.7636 6.95528 17.5553 6.58 17.18C6.20472 16.8047 5.99636 16.2957 5.99636 15.765C5.99636 15.2343 6.20472 14.7253 6.58 14.35L15.07 5.86" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </form>
          </div>
        </div>
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

export default Chatbot; 