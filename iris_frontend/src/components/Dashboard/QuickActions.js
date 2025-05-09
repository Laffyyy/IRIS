import React from 'react';

const QuickActions = () => {
  return React.createElement(
    React.Fragment,
    null,
    React.createElement('h3', { className: 'card-title' }, 'Quick Actions'),
    React.createElement(
      'div',
      { className: 'quick-actions' },
      React.createElement('button', { className: 'action-btn' }, 'Manage KPIs'),
      React.createElement('button', { className: 'action-btn' }, 'Review Logs')
    ),
    React.createElement('div', { className: 'divider' })
  );
};

export default QuickActions;