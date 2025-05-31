import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ChatHistory.css';
import airaLogo from '../assets/aira-logo.png';
import Sidebar from '../components/Sidebar';

const initialHistory = [
  {
    id: 1,
    title: 'Monthly Report Analy...',
    date: '2024-03-20 14:30',
    preview: 'Can you analyze the monthly sales report...',
    messages: [
      { id: 1, text: 'Can you analyze the monthly sales report for March?', isUser: true, timestamp: '2024-03-20 14:30' },
      { id: 2, text: 'Sure! Here is the analysis for March...', isUser: false, timestamp: '2024-03-20 14:31' }
    ],
    isFavorite: false
  },
  {
    id: 2,
    title: 'Client Data Processing',
    date: '2024-03-19 10:15',
    preview: 'Help me process the client data for...',
    messages: [
      { id: 1, text: 'Help me process the client data for Q1.', isUser: true, timestamp: '2024-03-19 10:15' },
      { id: 2, text: 'Processing client data for Q1...', isUser: false, timestamp: '2024-03-19 10:16' }
    ],
    isFavorite: false
  },
  {
    id: 3,
    title: 'KPI Metrics Review',
    date: '2024-03-18 16:45',
    preview: 'What are the current KPI metrics...',
    messages: [
      { id: 1, text: 'What are the current KPI metrics?', isUser: true, timestamp: '2024-03-18 16:45' },
      { id: 2, text: 'Here are the current KPI metrics...', isUser: false, timestamp: '2024-03-18 16:46' }
    ],
    isFavorite: false
  }
];

const quickRepliesByRole = {
  'HR POC': [
    'What are the most common Disciplinary Actions?',
    'Show attrition rate trend',
    'List employees with infractions',
    'How many employees went on LOA in March?',
    'Generate a summary of disciplinary actions by department'
  ],
  'Admin': [
    'Show recent user activities',
    'List uploaded files',
    'Display audit logs',
    'Which employees were added last month?',
    'Show audit logs for modifications'
  ],
  'Reports POC': [
    'Show KPI trends',
    'Generate performance report',
    'List underperforming KPIs',
    'Which departments consistently meet targets?',
    'Who are the top 5 performers?'
  ],
  'C&B': [
    'Show incentive eligibility',
    'Display C&B logs',
    'Compare LOB performance',
    'Which employees were eligible for incentives?',
    'Compare Client\'s LOB performance'
  ]
};

const ChatHistory = () => {
  const navigate = useNavigate();
  const [userRole] = useState('HR POC'); // This should come from your auth system
  const [history, setHistory] = useState(initialHistory);
  const [selectedId, setSelectedId] = useState(history[0]?.id || null);
  const [message, setMessage] = useState('');
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [showTitlePrompt, setShowTitlePrompt] = useState(false);
  const [editingTitleId, setEditingTitleId] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [pendingAction, setPendingAction] = useState(null); // { type: 'switch'|'new', id: chatId }
  const [activeMenuId, setActiveMenuId] = useState(null);
  const textareaRef = React.useRef(null);

  const selectedChat = history.find(h => h.id === selectedId);
  const messages = selectedChat ? selectedChat.messages : [];

  // Helper: check if current chat has unsaved messages
  const hasUnsaved = messages.length > 0;

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = textarea.scrollHeight;
      textarea.style.height = `${newHeight}px`;
      
      // Adjust container height to match textarea, but not beyond max height
      const container = textarea.closest('.message-input-container');
      if (container) {
        const maxContainerHeight = 200 + 32; // max-height + padding
        const containerHeight = Math.min(newHeight + 32, maxContainerHeight);
        container.style.minHeight = `${containerHeight}px`;

        // Adjust messages container height
        const messagesContainer = document.querySelector('.messages-container');
        if (messagesContainer) {
          const totalHeight = document.querySelector('.chat-messages').offsetHeight;
          const newMessagesHeight = totalHeight - containerHeight;
          messagesContainer.style.height = `${newMessagesHeight}px`;
        }
      }
      
      // Only show scrollbar if content exceeds max height
      if (newHeight > 200) {
        textarea.style.overflowY = 'auto';
      } else {
        textarea.style.overflowY = 'hidden';
      }
    }
  };

  // Handle message change with auto-resize
  const handleMessageChange = (e) => {
    setMessage(e.target.value);
    adjustTextareaHeight();
  };

  // Reset textarea height when message is sent
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && selectedChat) {
      const newMsg = {
        id: Date.now(),
        text: message,
        timestamp: new Date().toLocaleTimeString(),
        isUser: true
      };
      const updatedHistory = history.map(h =>
        h.id === selectedId
          ? {
              ...h,
              messages: [...h.messages, newMsg],
              preview: message,
              date: new Date().toISOString().slice(0, 16).replace('T', ' ')
            }
          : h
      );
      setHistory(updatedHistory);
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = '48px';
        textareaRef.current.style.overflowY = 'hidden';
        const container = textareaRef.current.closest('.message-input-container');
        if (container) {
          container.style.minHeight = '80px';
          // Reset messages container height
          const messagesContainer = document.querySelector('.messages-container');
          if (messagesContainer) {
            const totalHeight = document.querySelector('.chat-messages').offsetHeight;
            messagesContainer.style.height = `${totalHeight - 80}px`;
          }
        }
      }
    }
  };

  // Handle new chat (with save prompt if needed)
  const handleNewChat = () => {
    if (hasUnsaved) {
      setPendingAction({ type: 'new' });
      setShowSavePrompt(true);
    } else {
      createNewChat();
    }
  };

  // Handle switching chats (with save prompt if needed)
  const handleSelectChat = (id) => {
    if (id === selectedId) return;
    if (hasUnsaved) {
      setPendingAction({ type: 'switch', id });
      setShowSavePrompt(true);
    } else {
      setSelectedId(id);
      setMessage('');
    }
  };

  // Create a new chat
  const createNewChat = (title) => {
    const newId = Date.now();
    const newChat = {
      id: newId,
      title: title || 'New Conversation',
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      preview: '',
      messages: [],
      isFavorite: false
    };
    setHistory([newChat, ...history]);
    setSelectedId(newId);
    setMessage('');
  };

  // Save chat prompt logic
  const handleSaveChat = (save) => {
    setShowSavePrompt(false);
    if (!save) {
      // Discard current chat and continue pending action
      if (pendingAction?.type === 'new') {
        createNewChat();
      } else if (pendingAction?.type === 'switch') {
        setSelectedId(pendingAction.id);
        setMessage('');
      }
      setPendingAction(null);
    } else {
      // Save: if no title, prompt for title
      if (!selectedChat.title || selectedChat.title === 'New Conversation') {
        setShowTitlePrompt(true);
      } else {
        finishSave(selectedChat.title);
      }
    }
  };

  // Finish saving chat (with title)
  const finishSave = (title) => {
    setHistory(history.map(h => h.id === selectedId ? { ...h, title } : h));
    setShowTitlePrompt(false);
    if (pendingAction?.type === 'new') {
      createNewChat();
    } else if (pendingAction?.type === 'switch') {
      setSelectedId(pendingAction.id);
      setMessage('');
    }
    setPendingAction(null);
  };

  // Delete chat
  const handleDeleteChat = (id) => {
    const filtered = history.filter(h => h.id !== id);
    setHistory(filtered);
    if (selectedId === id && filtered.length > 0) {
      setSelectedId(filtered[0].id);
    } else if (filtered.length === 0) {
      createNewChat();
    }
  };

  // Edit chat title
  const handleEditTitle = (id, title) => {
    setEditingTitleId(id);
    setNewTitle(title);
  };
  const handleTitleChange = (e) => setNewTitle(e.target.value);
  const handleTitleSave = (id) => {
    setHistory(history.map(h => h.id === id ? { ...h, title: newTitle } : h));
    setEditingTitleId(null);
  };

  // Auto-generate title from first user message
  React.useEffect(() => {
    if (selectedChat && selectedChat.messages.length === 1 && selectedChat.messages[0].isUser) {
      const words = selectedChat.messages[0].text.split(' ');
      const title = words.slice(0, 4).join(' ');
      setHistory(history.map(h => h.id === selectedId ? { ...h, title } : h));
    }
    // eslint-disable-next-line
  }, [selectedChat && selectedChat.messages.length]);

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeMenuId && !event.target.closest('.menu-button') && !event.target.closest('.menu-dropdown')) {
        setActiveMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenuId]);

  // Sort history to show favorites first
  const sortedHistory = [...history].sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return new Date(b.date) - new Date(a.date);
  });

  // Toggle favorite status
  const toggleFavorite = (id) => {
    setHistory(history.map(h =>
      h.id === id ? { ...h, isFavorite: !h.isFavorite } : h
    ));
  };

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <div className="chat-history-white-card" style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
          <div className="chat-history-header">
            <div className="header-content">
              <img src={airaLogo} alt="Aira Logo" className="logo" />
              <h1>AIRA</h1>
            </div>
            <div className="header-actions" style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
              <button className="back-button designed" onClick={() => navigate(-1)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            </div>
          </div>

          <div className="chat-history-content">
            <div className="history-panel">
              <div className="new-chat-container">
                <button className="new-chat-button" onClick={handleNewChat}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  New Chat
                </button>
              </div>
              <div className="history-list">
                {history.length === 0 ? (
                  <div className="no-history">No chat history available</div>
                ) : (
                  sortedHistory.map((item) => (
                    <div
                      key={item.id}
                      className={`history-item${item.id === selectedId ? ' selected' : ''}${item.isFavorite ? ' favorite' : ''}`}
                      onClick={() => handleSelectChat(item.id)}
                    >
                      {editingTitleId === item.id ? (
                        <div className="history-item-title-edit">
                          <input
                            value={newTitle}
                            onChange={handleTitleChange}
                            onBlur={() => handleTitleSave(item.id)}
                            onKeyDown={e => e.key === 'Enter' && handleTitleSave(item.id)}
                            autoFocus
                          />
                        </div>
                      ) : (
                        <div className="history-item-title-row">
                          <div className="history-item-title">
                            {item.isFavorite && (
                              <svg className="favorite-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                            )}
                            {item.title}
                          </div>
                          <div className="history-item-actions">
                            <button 
                              className="menu-button" 
                              onClick={e => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === item.id ? null : item.id);
                              }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="1" />
                                <circle cx="12" cy="5" r="1" />
                                <circle cx="12" cy="19" r="1" />
                              </svg>
                            </button>
                            {activeMenuId === item.id && (
                              <div className="menu-dropdown show">
                                <div 
                                  className="menu-item"
                                  onClick={e => {
                                    e.stopPropagation();
                                    toggleFavorite(item.id);
                                    setActiveMenuId(null);
                                  }}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill={item.isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                  </svg>
                                  {item.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                                </div>
                                <div 
                                  className="menu-item"
                                  onClick={e => {
                                    e.stopPropagation();
                                    handleEditTitle(item.id, item.title);
                                    setActiveMenuId(null);
                                  }}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 20h9" />
                                    <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19.5 3 21l1.5-4L16.5 3.5z" />
                                  </svg>
                                  Rename
                                </div>
                                <div 
                                  className="menu-item delete"
                                  onClick={e => {
                                    e.stopPropagation();
                                    handleDeleteChat(item.id);
                                    setActiveMenuId(null);
                                  }}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                                  </svg>
                                  Delete
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="history-item-meta">{item.date}</div>
                      <div className="history-item-preview">{item.preview}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="chat-messages">
              <div className="messages-container">
                {messages.length === 0 ? (
                  <div className="welcome-message">
                    <h2> Welcome to AIRA</h2>
                    <p>How can I help you today?</p>
                    <div className="quick-replies">
                      {quickRepliesByRole[userRole]?.map((reply, idx) => (
                        <button
                          key={idx}
                          className="quick-reply-button"
                          onClick={() => setMessage(reply)}
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="chat-history-message-list">
                    {messages.map((msg) => (
                      <div key={msg.id} className={`message ${msg.isUser ? 'user-message' : 'ai-message'}`}>
                        <div className="message-content">
                          <p>{msg.text}</p>
                          <span className="message-timestamp">{msg.timestamp}</span>
                        </div>
                        {/* Copy/Edit buttons can be added here if needed */}
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
                  <textarea
                    ref={textareaRef}
                    className="message-input"
                    placeholder="Type your message..."
                    value={message}
                    onChange={handleMessageChange}
                    rows={1}
                  />
                  <button type="submit" className="send-button" aria-label="Send message">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 2L11 13" />
                      <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                    </svg>
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Save prompt modal */}
          {showSavePrompt && (
            <div className="save-prompt-modal">
              <div className="modal-content">
                <h3>Save this conversation?</h3>
                <p>Would you like to save the current conversation before switching or starting a new one?</p>
                <div className="modal-buttons">
                  <button onClick={() => handleSaveChat(true)}>Save</button>
                  <button onClick={() => handleSaveChat(false)}>Discard</button>
                </div>
              </div>
            </div>
          )}
          {/* Title prompt modal */}
          {showTitlePrompt && (
            <div className="save-prompt-modal">
              <div className="modal-content">
                <h3>Name this conversation</h3>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Enter chat title"
                  style={{ width: '100%', padding: '0.5rem', margin: '1rem 0', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                  autoFocus
                />
                <div className="modal-buttons">
                  <button onClick={() => finishSave(newTitle || 'Untitled Chat')}>Save</button>
                  <button onClick={() => setShowTitlePrompt(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ChatHistory; 