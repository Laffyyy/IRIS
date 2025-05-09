import React from 'react';
import NavItem from './NavItem';
import './Sidebar.css';

const Sidebar = ({ collapsed }) => {
  return React.createElement(
    'div',
    { className: `sidebar ${collapsed ? 'collapsed' : ''}` },
    React.createElement(
      'div',
      { className: 'sidebar-header' },
      React.createElement(
        'div',
        { className: 'logo' },
        React.createElement('i', { className: 'fas fa-cube' })
      ),
      React.createElement('span', { className: 'app-name' }, 'AdminPro')
    ),
    React.createElement(
      'div',
      { className: 'profile-section' },
      React.createElement('div', { className: 'profile-pic' }, 'JD'),
      React.createElement(
        'div',
        { className: 'profile-info' },
        React.createElement('div', { className: 'profile-name' }, 'John Doe'),
        React.createElement('div', { className: 'profile-title' }, 'Admin')
      )
    ),
    React.createElement(
      'div',
      { className: 'nav-menu' },
      React.createElement(NavItem, { icon: 'fas fa-tachometer-alt', text: 'Dashboard', active: true }),
      React.createElement(NavItem, { icon: 'fas fa-users', text: 'Users' }),
      React.createElement(NavItem, { icon: 'fas fa-chart-bar', text: 'Reports' }),
      React.createElement(NavItem, { icon: 'fas fa-cog', text: 'Settings' }),
      React.createElement(NavItem, { icon: 'fas fa-bell', text: 'Notifications' }),
      React.createElement(NavItem, { icon: 'fas fa-sign-out-alt', text: 'Logout' })
    )
  );
};

export default Sidebar;