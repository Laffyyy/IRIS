import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import AppManagement from './pages/admin/AppManagement';
import ClientManagement from './pages/admin/ClientManagement';
import SiteManagement from './pages/admin/SiteManagement';
import KPIManagement from './pages/admin/KPIManagement';
import './App.css';
import Login from './Login';
import Otp from './Otp';
import ChangePassword from './ChangePassword';
import SecurityQuestions from './SecurityQuestions';  // Import SecurityQuestions
import UpdatePassword from './UpdatePassword';  // Import UpdatePassword

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/otp" element={<Otp />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/security-questions" element={<SecurityQuestions />} />
          <Route path="/update-password" element={<UpdatePassword />} />  {/* Add this line for UpdatePassword */}
        </Routes>
      </div>
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