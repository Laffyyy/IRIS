import React from 'react';

const RecentUsers = () => {
  return React.createElement(
    React.Fragment,
    null,
    React.createElement('h3', { className: 'card-title' }, 'Security Add Users'),
    React.createElement(
      'table',
      null,
      React.createElement(
        'thead',
        null,
        React.createElement(
          'tr',
          null,
          React.createElement('th', null, 'Name'),
          React.createElement('th', null, 'Department'),
          React.createElement('th', null, 'Role'),
          React.createElement('th', null, 'Added')
        )
      ),
      React.createElement(
        'tbody',
        null,
        React.createElement(
          'tr',
          null,
          React.createElement('td', null, 'Robert Johnson'),
          React.createElement('td', null, 'HR Specialist'),
          React.createElement('td', null, 'HR'),
          React.createElement('td', null, '2 hours ago')
        ),
        React.createElement(
          'tr',
          null,
          React.createElement('td', null, 'Jane Smith'),
          React.createElement('td', null, 'Axtwa'),
          React.createElement('td', null, 'Reports POC'),
          React.createElement('td', null, '5 hours ago')
        ),
        React.createElement(
          'tr',
          null,
          React.createElement('td', null, 'Emily Davis'),
          React.createElement('td', null, 'Operations'),
          React.createElement('td', null, 'C&B'),
          React.createElement('td', null, '1 day ago')
        ),
        React.createElement(
          'tr',
          null,
          React.createElement('td', null, 'Michael Wilson'),
          React.createElement('td', null, 'HR Specialist'),
          React.createElement('td', null, 'HR'),
          React.createElement('td', null, '2 days ago')
        )
      )
    ),
    React.createElement('div', { className: 'divider' })
  );
};

export default RecentUsers;