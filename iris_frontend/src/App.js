import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import SecurityQuestions from './SecurityQuestions';
import UpdatePassword from './UpdatePassword';
import InactivityHandler from './components/InactivityHandler'; 

import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Redirect root URL to admin users */}

          {/*  Add this route for the Login page */}
          <Route path="/" element={<Login />} />
          <Route path="/otp" element={<Otp />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/security-questions" element={<SecurityQuestions />} />
          <Route path="/update-password" element={<UpdatePassword />} />

          <Route
            path="/admin/users"
            element={
              <InactivityHandler>
                <Sidebar />
                <UserManagement />
              </InactivityHandler>
            }
          />
          <Route
            path="/admin/apps"
            element={
              <InactivityHandler>
                <Sidebar />
                <AppManagement />
              </InactivityHandler>
            }
          />
          <Route
            path="/admin/clients"
            element={
              <InactivityHandler>
                <Sidebar />
                <ClientManagement />
              </InactivityHandler>
            }
          />
          <Route
            path="/dashboard"
            element={
              <InactivityHandler>
                <Sidebar />
                <Dashboard />
              </InactivityHandler>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
