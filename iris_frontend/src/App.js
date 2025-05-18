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
import  ProtectedRoute  from './utilities/ProtectedRoute';
import Unauthorize from './utilities/Unautorize';
import AdminPage from './adminpagecollection';

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
                  <Route path="hr" element={<div>HR Page</div>} />
                  <Route path="reports" element={<div>Reports Page</div>} />
                  <Route path="compensation" element={<div>C&B Page</div>} />
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