import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  FaLock, 
  FaUnlock, 
  FaChevronDown, 
  FaChevronRight,
  FaChartBar,
  FaFileAlt,
  FaChartLine,
  FaClipboardList,
  FaRegFileAlt,
  FaRegFile,
  FaBars,
  FaTimes
} from 'react-icons/fa';
import './Sidebar.css';
import logo from '../assets/logo.png';
import dashboardIcon from '../assets/icons/dashboard-icon.png';
import adminIcon from '../assets/icons/admin-icon.png';
import hrIcon from '../assets/icons/hr-icon.png';
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
  { 
    name: 'HR', 
    icon: hrIcon,
    subItems: [
      { name: 'Employee Data', path: '/hr/employee-data', icon: userManagementIcon },
      { name: 'Data Management', path: '/hr/data-management', icon: appManagementIcon },
      { name: 'Reports', path: '/hr/reports', icon: FaRegFile }
    ]
  },
  { 
    name: 'Reports', 
    icon: FaChartBar,
    subItems: [
      { name: 'KPI Management', path: '/reports/kpi-mgmt', icon: FaChartLine },
      { name: 'Report', path: '/reports/report', icon: FaRegFile },
      { name: 'Score', path: '/reports/scoresheet', icon: FaClipboardList }
    ]
  },
  { name: 'C&B', path: '/cb', icon: cbIcon },
  { name: 'FAQs', path: '/faqs', icon: faqsIcon }
];

const Sidebar = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [expandedItems, setExpandedItems] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const shouldShowExpanded = isLocked || isHovered || isMobileMenuOpen;

  const toggleSubMenu = (itemName) => {
    if (expandedItems.includes(itemName)) {
      setExpandedItems(expandedItems.filter(item => item !== itemName));
    } else {
      setExpandedItems([...expandedItems, itemName]);
    }
  };

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    if (!isMobileMenuOpen) {
      setIsLocked(true);
    }
  };

  const handleNavLinkClick = () => {
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <>
      {isMobile && (
        <button 
          className="mobile-menu-toggle"
          onClick={handleMobileMenuToggle}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>
      )}
      <div 
        className={`sidebar ${isLocked ? 'locked' : ''} ${isMobileMenuOpen ? 'mobile-open' : ''}`}
        onMouseEnter={() => !isLocked && !isMobile && setIsHovered(true)}
        onMouseLeave={() => !isLocked && !isMobile && setIsHovered(false)}
      >
        {(shouldShowExpanded || isLocked) && !isMobile && (
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
                    {typeof item.icon === 'string' ? (
                      <img src={item.icon} alt={item.name} className="nav-icon" />
                    ) : (
                      <item.icon className="nav-icon" />
                    )}
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
                            onClick={handleNavLinkClick}
                          >
                            {typeof subItem.icon === 'string' ? (
                              <img src={subItem.icon} alt={subItem.name} className="submenu-icon" />
                            ) : (
                              <subItem.icon className="submenu-icon" />
                            )}
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
                  onClick={handleNavLinkClick}
                >
                  {typeof item.icon === 'string' ? (
                    <img src={item.icon} alt={item.name} className="nav-icon" />
                  ) : (
                    <item.icon className="nav-icon" />
                  )}
                  {shouldShowExpanded && <span className="nav-text">{item.name}</span>}
                  <div className="active-indicator" />
                </NavLink>
              )}
            </li>
          ))}
        </ul>

        {/* Log Out Section */}
        <div className="logout-section">
          <NavLink to="/logout" className="logout-link" onClick={handleNavLinkClick}>
            <img src={logoutIcon} alt="Log out" className="logout-icon" />
            {shouldShowExpanded && <span>Log out</span>}
          </NavLink>
        </div>
      </div>
      {isMobileMenuOpen && <div className="sidebar-overlay" onClick={handleMobileMenuToggle} />}
    </>
  );
};

export default Sidebar;