import React from 'react';

const NavItem = ({ icon, text, active = false }) => {
  return React.createElement(
    'div',
    { className: `nav-item ${active ? 'active' : ''}` },
    React.createElement('i', { className: icon }),
    React.createElement('span', { className: 'menu-text' }, text)
  );
};

export default NavItem;