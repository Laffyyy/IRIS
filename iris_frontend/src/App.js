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
import SecurityQuestions from './SecurityQuestions';
import UpdatePassword from './UpdatePassword';


function App() {
  return (
    <Router>
      <Routes>
        {/* Auth routes - no sidebar */}
        <Route path="/" element={<Login />} />
        <Route path="/otp" element={<Otp />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/security-questions" element={<SecurityQuestions />} />
        <Route path="/update-password" element={<UpdatePassword />} />

        {/* Dashboard/admin routes - with sidebar */}
       <Route
  path="/*"
  element={
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route
            path="admin/*"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="hr"
            element={
              <ProtectedRoute allowedRoles={['HR', 'admin']}>
                <div>HR Page</div>
              </ProtectedRoute>
            }
          />
          <Route
            path="reports"
            element={
              <ProtectedRoute allowedRoles={['REPORTS', 'admin']}>
                <div>Reports Page</div>
              </ProtectedRoute>
            }
          />
          <Route
            path="compensation"
            element={
              <ProtectedRoute allowedRoles={['CNB', 'admin']}>
                <div>C&B Page</div>
              </ProtectedRoute>
            }
          />
          <Route path="faqs" element={<div>FAQs Page</div>} />
          <Route path="unauthorized" element={<Unauthorize />} />
        </Routes>
      </main>
    </div>
  }
/>
      </Routes>
    </Router>
  );
}

export default App;