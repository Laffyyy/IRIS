import React from 'react';
import UserProfile from './UserProfile';
import SystemOverview from './SystemOverview';
import RecentUsers from './RecentUsers';
import QuickActions from './QuickActions';
import SystemAlerts from './SystemAlerts';
import './Dashboard.css';

const Dashboard = () => {
  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      'div',
      { className: 'dashboard-grid' },
      React.createElement(UserProfile)
    ),
    React.createElement(
      'div',
      { className: 'card' },
      React.createElement(SystemOverview),
      React.createElement(RecentUsers),
      React.createElement(QuickActions),
      React.createElement(SystemAlerts)
    )
  );
};

export default Dashboard;