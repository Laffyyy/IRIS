import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FaLock, FaUnlock, FaChevronDown, FaChevronRight } from 'react-icons/fa';
import './Sidebar.css';
import logo from '../assets/logo.png';
import dashboardIcon from '../assets/icons/dashboard-icon.png';
import adminIcon from '../assets/icons/admin-icon.png';
import hrIcon from '../assets/icons/hr-icon.png';
import reportsIcon from '../assets/icons/reports-icon.png';
import cbIcon from '../assets/icons/cb-icon.png';
import faqsIcon from '../assets/icons/faqs-icon.png';
import logoutIcon from '../assets/icons/logout-icon.png';
import userManagementIcon from '../assets/icons/users.png';
import appManagementIcon from '../assets/icons/apps.png';
import siteManagementIcon from '../assets/icons/sites.png';
import clientManagementIcon from '../assets/icons/clients.png';
import kpiManagementIcon from '../assets/icons/kpis.png';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: dashboardIcon },
  { 
    name: 'Admin', 
    icon: adminIcon,
    subItems: [
      { name: 'User Management', path: '/admin/users', icon: userManagementIcon },
      { name: 'App Management', path: '/admin/apps', icon: appManagementIcon },
      { name: 'Site Management', path: '/admin/sites', icon: siteManagementIcon },
      { name: 'Client Management', path: '/admin/clients', icon: clientManagementIcon },
      { name: 'KPI Management', path: '/admin/kpis', icon: kpiManagementIcon }
    ]
  },
  { name: 'HR', path: '/hr', icon: hrIcon },
  { name: 'Reports', path: '/reports', icon: reportsIcon },
  { name: 'C&B', path: '/cb', icon: cbIcon },
  { name: 'FAQs', path: '/faqs', icon: faqsIcon }
];

const Sidebar = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [expandedItems, setExpandedItems] = useState([]);

  const shouldShowExpanded = isLocked || isHovered;

  const toggleSubMenu = (itemName) => {
    if (expandedItems.includes(itemName)) {
      setExpandedItems(expandedItems.filter(item => item !== itemName));
    } else {
      setExpandedItems([...expandedItems, itemName]);
    }
  };

  return (
    <div 
      className={`sidebar ${isLocked ? 'locked' : ''}`}
      onMouseEnter={() => !isLocked && setIsHovered(true)}
      onMouseLeave={() => !isLocked && setIsHovered(false)}
    >
      {(shouldShowExpanded || isLocked) && (
        <button 
          className="lock-btn"
          onClick={() => setIsLocked(!isLocked)}
          title={isLocked ? "Unlock sidebar" : "Lock sidebar"}
        >
          {isLocked ? <FaLock size={14} /> : <FaUnlock size={14} />}
        </button>
      )}

      {/* Logo Section */}
      <div className="sidebar-header">
        <div className="logo-container">
          <img src={logo} alt="IRIS Logo" className="logo-img" />
          {shouldShowExpanded && <span className="logo-text">IRIS</span>}
        </div>
      </div>

      {/* Menu Items */}
      <ul className="nav-links">
        {navItems.map((item) => (
          <li key={item.name}>
            {item.subItems ? (
              <>
                <div 
                  className={`nav-link ${expandedItems.includes(item.name) ? 'active-parent' : ''}`}
                  onClick={() => toggleSubMenu(item.name)}
                >
                  <img src={item.icon} alt={item.name} className="nav-icon" />
                  {shouldShowExpanded && (
                    <>
                      <span className="nav-text">{item.name}</span>
                      {expandedItems.includes(item.name) ? (
                        <FaChevronDown className="chevron-icon" />
                      ) : (
                        <FaChevronRight className="chevron-icon" />
                      )}
                    </>
                  )}
                </div>
                {expandedItems.includes(item.name) && shouldShowExpanded && (
                  <ul className="submenu">
                    {item.subItems.map((subItem) => (
                      <li key={subItem.name}>
                        <NavLink
                          to={subItem.path}
                          className={({ isActive }) => 
                            `submenu-link ${isActive ? 'active' : ''}`
                          }
                        >
                          <img src={subItem.icon} alt={subItem.name} className="submenu-icon" />
                          <span className="submenu-text">{subItem.name}</span>
                          <div className="active-indicator" />
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <NavLink
                to={item.path}
                className={({ isActive }) => 
                  `nav-link ${isActive ? 'active' : ''}`
                }
              >
                <img src={item.icon} alt={item.name} className="nav-icon" />
                {shouldShowExpanded && <span className="nav-text">{item.name}</span>}
                <div className="active-indicator" />
              </NavLink>
            )}
          </li>
        ))}
      </ul>

      {/* Log Out Section */}
      <div className="logout-section">
        <NavLink to="/logout" className="logout-link">
          <img src={logoutIcon} alt="Log out" className="logout-icon" />
          {shouldShowExpanded && <span>Log out</span>}
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;