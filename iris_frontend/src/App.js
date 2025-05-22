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
import ProtectedRoute from './utilities/ProtectedRoute';
import Unauthorize from './utilities/Unautorize';
import AdminPage from './adminpagecollection';
import InactivityHandler from './components/InactivityHandler';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Login routes */}
          <Route path="/" element={<Login />} />
          <Route path="/otp" element={<Otp />} />
          <Route 
            path="/change-password" element={<ProtectedRoute allowedRoles={['admin' , 'HR' , 'REPORTS' , 'CNB']}><ChangePassword /></ProtectedRoute>} />
          <Route path="/security-questions" element={<ProtectedRoute allowedRoles={['admin' , 'HR' , 'REPORTS' , 'CNB']}><SecurityQuestions /></ProtectedRoute>} />
          <Route path="/update-password" element={<ProtectedRoute allowedRoles={['admin' , 'HR' , 'REPORTS' , 'CNB']}><UpdatePassword /></ProtectedRoute>} />

          {/* Protected routes */}
          <Route
            path="/admin/*"
            element={
              <InactivityHandler>
                <div className="app-container">
                  <Sidebar />
                  <main className="main-content">
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminPage />
                    </ProtectedRoute>
                  </main>
                </div>
              </InactivityHandler>
            }
          />
          <Route
            path="/hr"
            element={
              <InactivityHandler>
                <div className="app-container">
                  <Sidebar />
                  <main className="main-content">
                    <ProtectedRoute allowedRoles={['HR', 'admin']}>
                      <div>HR Page</div>
                    </ProtectedRoute>
                  </main>
                </div>
              </InactivityHandler>
            }
          />
          <Route
            path="/reports"
            element={
              <InactivityHandler>
                <div className="app-container">
                  <Sidebar />
                  <main className="main-content">
                    <ProtectedRoute allowedRoles={['REPORTS', 'admin']}>
                      <div>Reports Page</div>
                    </ProtectedRoute>
                  </main>
                </div>
              </InactivityHandler>
            }
          />
          <Route
            path="/compensation"
            element={
              <InactivityHandler>
                <div className="app-container">
                  <Sidebar />
                  <main className="main-content">
                    <ProtectedRoute allowedRoles={['CNB', 'admin']}>
                      <div>C&B Page</div>
                    </ProtectedRoute>
                  </main>
                </div>
              </InactivityHandler>
            }
          />
          <Route path="/faqs" element={<div>FAQs Page</div>} />
          <Route path="/unauthorized" element={<Unauthorize />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
