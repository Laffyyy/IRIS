import React from 'react';

const Header = ({ toggleSidebar }) => {
  return React.createElement(
    'div',
    { className: 'header' },
    React.createElement('div', { className: 'page-title' }, 'Dashboard'),
    React.createElement(
      'div',
      { className: 'user-actions' },
      React.createElement('i', { className: 'fas fa-search' }),
      React.createElement('i', { className: 'fas fa-bell' }),
      React.createElement('i', { className: 'fas fa-question-circle' })
    )
  );
};

export default Header;