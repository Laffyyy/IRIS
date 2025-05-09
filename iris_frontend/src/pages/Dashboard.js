import React from 'react';
import './Dashboard.css';

const Dashboard = () => {
  const mockUser = {
    name: 'John Abide Abdul Doe',
    role: 'Incentive Administrator',
    responsibilities: ['User Management', 'Activity Logs Monitoring'],
    lastLogin: 'Today at 8:45 AM',
    status: 'Active'
  };

  return (
    <div className="dashboard-container">
      <div className="user-header">
        <div className="user-info">
          <h2>{mockUser.name}</h2>
          <span className="user-role">{mockUser.role}</span>
        </div>
        <div className="user-meta">
          <div className="responsibilities">
            <span className="label">Responsibilities</span>
            {mockUser.responsibilities.map((item, idx) => (
              <span key={idx} className="pill">{item}</span>
            ))}
          </div>
          <div className="last-login">
            <span className="label">Last Login</span>
            <div>
              <span>{mockUser.lastLogin}</span>
              <span className="status-pill">{mockUser.status}</span>
            </div>
          </div>
        </div>
      </div>

      {/* These are just empty sections to match layout */}
      <div className="dashboard-body">
        <div className="main-panel"></div>
        <div className="side-panels">
          <div className="panel-box"></div>
          <div className="panel-box"></div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;