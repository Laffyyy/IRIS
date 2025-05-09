import React, { useState } from 'react';
import Sidebar from './components/Sidebar/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard/Dashboard';
import './App.css';

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return React.createElement(
    'div',
    { className: 'app' },
    React.createElement(Sidebar, { collapsed: sidebarCollapsed }),
    React.createElement(
      'div',
      { className: `main-content ${sidebarCollapsed ? 'collapsed' : ''}` },
      React.createElement(Header, { toggleSidebar: toggleSidebar }),
      React.createElement(Dashboard)
    ),
    React.createElement(
      'button',
      { className: 'toggle-btn', onClick: toggleSidebar },
      React.createElement('i', {
        className: `fas ${sidebarCollapsed ? 'fa-bars' : 'fa-times'}`
      })
    )
  );
}

export default App;