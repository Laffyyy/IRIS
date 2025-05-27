import React from 'react';
import { Routes, Route } from 'react-router-dom';
import UserManagement from './pages/admin/UserManagement';
import AppManagement from './pages/admin/AppManagement';
import ClientManagement from './pages/admin/ClientManagement';
import SiteManagement from './pages/admin/SiteManagement';
import KPIManagement from './pages/admin/KPIManagement';
import EmployeeManagement from './pages/admin/EmployeeManagement';
import Dashboard from './pages/Dashboard';

const AdminPage = () => (
  <Routes>
    <Route path="dashboard" element={<Dashboard />} />
    <Route path="users" element={<UserManagement />} />
    <Route path="apps" element={<AppManagement />} />
    <Route path="clients" element={<ClientManagement />} />
    <Route path="sites" element={<SiteManagement />} />
    <Route path="kpis" element={<KPIManagement />} />
    <Route path="employees" element={<EmployeeManagement />} />
  </Routes>
);

export default AdminPage;