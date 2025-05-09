import React from 'react';

const SystemOverview = () => {
  return React.createElement(
    React.Fragment,
    null,
    React.createElement('h2', { className: 'section-title' }, 'System Overview'),
    React.createElement('p', null, 'Key system metrics and recently added users'),
    React.createElement('h3', { className: 'card-title' }, 'Total Active Users'),
    React.createElement(
      'div',
      { className: 'stats-grid' },
      React.createElement(
        'div',
        { className: 'stat-item' },
        React.createElement('div', { className: 'stat-value' }, '2,345'),
        React.createElement('div', { className: 'stat-label' }, 'Total Users')
      ),
      React.createElement(
        'div',
        { className: 'stat-item' },
        React.createElement('div', { className: 'stat-value' }, '1,247'),
        React.createElement('div', { className: 'stat-label' }, 'Active Users')
      ),
      React.createElement(
        'div',
        { className: 'stat-item' },
        React.createElement('div', { className: 'stat-value' }, '125'),
        React.createElement('div', { className: 'stat-label' }, 'New this Month')
      )
    ),
    React.createElement('div', { className: 'divider' }),
    React.createElement('h3', { className: 'card-title' }, 'System Uptime Status'),
    React.createElement(
      'div',
      { className: 'status-item' },
      React.createElement('div', { className: 'status-label' }, 'Current Status'),
      React.createElement('div', { className: 'status-value operational' }, 'Operational'),
      React.createElement('div', null, 'All systems running normally')
    ),
    React.createElement(
      'div',
      { className: 'status-item' },
      React.createElement('div', { className: 'status-label' }, 'Uptime Percentage'),
      React.createElement('div', { className: 'stat-value' }, '99.98%'),
      React.createElement('div', null, 'Last Incident: 14 days ago')
    ),
    React.createElement('div', { className: 'divider' })
  );
};

export default SystemOverview;