import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import AppManagement from './pages/admin/AppManagement';
import ClientManagement from './pages/admin/ClientManagement';
import ProtectedRoute from './utilities/ProtectedRoute';
import './App.css';

// Layout for admin section
function AdminLayout() {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

// Layout for HR section
function HrLayout() {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

// Layout for Reports section
function ReportsLayout() {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

// Layout for Compensation section
function CompensationLayout() {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Public/standalone routes */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/faqs" element={<div>FAQs Page</div>} />

        {/* Secured/sectioned routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="users" element={<UserManagement />} />
          <Route path="apps" element={<AppManagement />} />
          <Route path="clients" element={<ClientManagement />} />
          {/* Add more admin sub-pages here */}
        </Route>
        <Route
          path="/hr"
          element={
            <ProtectedRoute allowedRoles={['HR', 'admin']}>
              <HrLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<div>HR Page</div>} />
          {/* Add more HR sub-pages here */}
        </Route>
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={['REPORTS', 'admin']}>
              <ReportsLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<div>Reports Page</div>} />
          {/* Add more Reports sub-pages here */}
        </Route>
        <Route
          path="/compensation"
          element={
            <ProtectedRoute allowedRoles={['CNB', 'admin']}>
              <CompensationLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<div>C&B Page</div>} />
          {/* Add more Compensation sub-pages here */}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
