import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import AppManagement from './pages/admin/AppManagement';
import ClientManagement from './pages/admin/ClientManagement';
import './App.css';
import { useState } from 'react';
import Login from './Login';
import Otp from './Otp';
import ChangePassword from './ChangePassword';

function App() {
  const [currentView, setCurrentView] = useState('login');

  const renderView = () => {
    switch (currentView) {
      case 'login':
        return <Login 
          onContinue={() => setCurrentView('otp')} 
          onForgotPassword={() => setCurrentView('changePassword')} 
        />;
      case 'otp':
        return <Otp onBack={() => setCurrentView('login')} />;
      case 'changePassword':
        return <ChangePassword onCancel={() => setCurrentView('login')} />;
      default:
        return <Login 
          onContinue={() => setCurrentView('otp')} 
          onForgotPassword={() => setCurrentView('changePassword')} 
        />;
    }
  };

  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/apps" element={<AppManagement />} />
            <Route path="/admin/clients" element={<ClientManagement />} />
            <Route path="/hr" element={<div>HR Page</div>} />
            <Route path="/reports" element={<div>Reports Page</div>} />
            <Route path="/compensation" element={<div>C&B Page</div>} />
            <Route path="/faqs" element={<div>FAQs Page</div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;