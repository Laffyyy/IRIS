import React from 'react';

const UserProfile = () => {
  return React.createElement(
    'div',
    { className: 'card' },
    React.createElement(
      'div',
      { className: 'profile-header' },
      React.createElement('div', { className: 'profile-pic' }, 'JA'),
      React.createElement(
        'div',
        { className: 'profile-info' },
        React.createElement('div', { className: 'profile-name' }, 'John Abide Abdul Doe'),
        React.createElement('div', { className: 'profile-title' }, 'Incentive Administrator')
      )
    ),
    React.createElement(
      'div',
      { className: 'responsibilities' },
      React.createElement('h3', null, 'Responsibilities'),
      React.createElement(
        'ul',
        null,
        React.createElement('li', null, '(User Management)'),
        React.createElement('li', null, 'Activity Logs Monitoring')
      )
    ),
    React.createElement(
      'div',
      { className: 'last-login' },
      React.createElement('span', null, 'Last Login'),
      React.createElement('div', null, 'Today at 8:45 AM')
    )
  );
};

export default UserProfile;