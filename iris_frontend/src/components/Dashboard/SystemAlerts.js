import React from 'react';

const SystemAlerts = () => {
  return React.createElement(
    React.Fragment,
    null,
    React.createElement('h3', { className: 'card-title' }, 'System Alerts'),
    React.createElement('p', null, 'Recent system notifications'),
    React.createElement(
      'div',
      { className: 'alert-item' },
      React.createElement('div', { className: 'alert-title' }, 'Database Optimization Scheduled'),
      React.createElement('div', { className: 'alert-desc' }, 'Maintenance scheduled for tonight at 2:00 AM'),
      React.createElement('div', { className: 'alert-time' }, '2 hours ago')
    ),
    React.createElement(
      'div',
      { className: 'alert-item' },
      React.createElement('div', { className: 'alert-title' }, 'System Update Completed'),
      React.createElement('div', { className: 'alert-desc' }, 'Version 1.2.5 successfully deployed'),
      React.createElement('div', { className: 'alert-time' }, '1 day ago')
    ),
    React.createElement(
      'div',
      { className: 'alert-item' },
      React.createElement('div', { className: 'alert-title' }, 'Failed Login Attempts Detected'),
      React.createElement('div', { className: 'alert-desc' }, 'Multiple failed attempts from IP 192.168.1.45'),
      React.createElement('div', { className: 'alert-time' }, '2 days ago')
    )
  );
};

export default SystemAlerts;