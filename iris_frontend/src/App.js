import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import AppManagement from './pages/admin/AppManagement';
import ClientManagement from './pages/admin/ClientManagement';
import SiteManagement from './pages/admin/SiteManagement';
import KPIManagement from './pages/admin/KPIManagement';
import AdminLogs from './pages/admin/AdminLogs';
import Login from './Login';
import Otp from './Otp';
import ChangePassword from './ChangePassword';
import SecurityQuestions from './SecurityQuestions';
import UpdatePassword from './UpdatePassword';
import ProtectedRoute from './utilities/ProtectedRoute';
import InactivityHandler from './components/InactivityHandler';
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
        <Route path="/login" element={<Login />} />
        <Route path="/otp" element={<Otp />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/security-questions" element={<SecurityQuestions />} />
        <Route path="/update-password" element={<UpdatePassword />} />

        {/* Protected routes with layouts */}
        <Route
          path="/admin"
          element={
            <InactivityHandler>
              {/* <ProtectedRoute allowedRoles={['ADMIN']}> */}
                <AdminLayout />
              {/* </ProtectedRoute> */}
            </InactivityHandler>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="apps" element={<AppManagement />} />
          <Route path="clients" element={<ClientManagement />} />
          <Route path="sites" element={<SiteManagement />} />
          <Route path="kpis" element={<KPIManagement />} />
          <Route path="logs" element={<AdminLogs />} />
        </Route>

        <Route
          path="/hr"
          element={
            <InactivityHandler>
              {/* <ProtectedRoute allowedRoles={['HR', 'ADMIN']}> */}
                <HrLayout />
              {/* </ProtectedRoute> */}
            </InactivityHandler>
          }
        >
          <Route index element={<Dashboard />} />
        </Route>

        <Route
          path="/reports"
          element={
            <InactivityHandler>
              {/* <ProtectedRoute allowedRoles={['REPORTS', 'ADMIN']}> */}
                <ReportsLayout />
              {/* </ProtectedRoute> */}
            </InactivityHandler>
          }
        >
          <Route index element={<Dashboard />} />
        </Route>

        <Route
          path="/compensation"
          element={
            <InactivityHandler>
              {/* <ProtectedRoute allowedRoles={['CNB', 'ADMIN']}> */}
                <CompensationLayout />
              {/* </ProtectedRoute> */}
            </InactivityHandler>
          }
        >
          <Route index element={<Dashboard />} />
        </Route>

        {/* Redirect root to login if not authenticated */}
        <Route path="/" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
