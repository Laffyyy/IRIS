import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import { useUser } from '../contexts/UserContext';
import { Navigate } from 'react-router-dom';



const Dashboard = () => {
const { user, updateUserDetails } = useUser();

    useEffect(() => {
    // Fetch user details when component mounts and user exists
    if (user?.employeeId) {
      updateUserDetails(user.employeeId);
    }
  }, [user?.employeeId]);

    const [processingData, setProcessingData] = useState([
    { location: 'A', hrLog: true, hrDb: true, hrsApp: true, payroll: true, score: true, region: true },
    { location: 'B', hrLog: false, hrDb: false, hrsApp: false, payroll: true, score: true, region: false },
    { location: 'C', hrLog: true, hrDb: false, hrsApp: false, payroll: true, score: true, region: true },
  ]);

    if (!user) {
    return <Navigate to="/" replace />;
  }
  console.log('Full user data:', user);
  console.log('User details:', updateUserDetails); // Access user properties directly
  const userInfo = {
    name: user?.name || 'Unknown User',
    role: user?.type === 'ADMIN' ? 'Incentive Administrator' : user?.type || 'User',
    responsibilities: ['User Management', 'Activity Logs Monitoring'],
    lastLogin: 'Today',
    status: user.status || 'ACTIVE'
  };

  const quickActions = [
    { id: 1, label: 'Manage KPIs' },
    { id: 2, label: 'Review Logs' },
  ];

      if (!user) {
    return <Navigate to="/" replace />;
  }

  const toggleCellValue = (location, field) => {
    setProcessingData(prevData =>
      prevData.map(row =>
        row.location === location
          ? { ...row, [field]: !row[field] }
          : row
      )
    );
  };

  const calculateCompletion = (row) => {
    const fields = ['hrLog', 'hrDb', 'hrsApp', 'payroll', 'score', 'region'];
    const completedCount = fields.filter(field => row[field]).length;
    return Math.round((completedCount / fields.length) * 100) + '%';
  };

  return (
    <div className="dashboard-container">
      <div className="user-header">
        <div className="user-left">
          <h2>{userInfo.name}</h2>
          <span className="user-role">{userInfo.role}</span>
        </div>
        <div className="user-center">
          <span className="labelr">Responsibilities</span>
          <div className="responsibility-pills">
            {userInfo.responsibilities.map((item, idx) => (
              <span key={idx} className="pill">{item}</span>
            ))}
          </div>
        </div>
        <div className="user-right">
          <span className="label">Last Login</span>
          <div className="login-status">
            <span>{userInfo.status}</span>
            <span className="status-pill">{userInfo.status}</span>
          </div>
        </div>
      </div>

      <div className="dashboard-body">
        <div className="main-panel">
          <div className="section-header">
            <h3>Processing month: Mar 2023</h3>
          </div>
          <div className="table-container">
            <table className="processing-table">
              <thead>
                <tr>
                  <th>Location</th>
                  <th>HR Log</th>
                  <th>HR DB</th>
                  <th>Hrs App</th>
                  <th>Payroll</th>
                  <th>Score</th>
                  <th>Region</th>
                  <th>Completion</th>
                </tr>
              </thead>
              <tbody>
                {processingData.map((row, index) => (
                  <tr key={index}>
                    <td>{row.location}</td>
                    <td
                      className={`editable-cell ${row.hrLog ? 'status-check' : 'status-cross'}`}
                      onClick={() => toggleCellValue(row.location, 'hrLog')}
                    >
                      {row.hrLog ? '✓' : 'X'}
                    </td>
                    <td
                      className={`editable-cell ${row.hrDb ? 'status-check' : 'status-cross'}`}
                      onClick={() => toggleCellValue(row.location, 'hrDb')}
                    >
                      {row.hrDb ? '✓' : 'X'}
                    </td>
                    <td
                      className={`editable-cell ${row.hrsApp ? 'status-check' : 'status-cross'}`}
                      onClick={() => toggleCellValue(row.location, 'hrsApp')}
                    >
                      {row.hrsApp ? '✓' : 'X'}
                    </td>
                    <td
                      className={`editable-cell ${row.payroll ? 'status-check' : 'status-cross'}`}
                      onClick={() => toggleCellValue(row.location, 'payroll')}
                    >
                      {row.payroll ? '✓' : 'X'}
                    </td>
                    <td
                      className={`editable-cell ${row.score ? 'status-check' : 'status-cross'}`}
                      onClick={() => toggleCellValue(row.location, 'score')}
                    >
                      {row.score ? '✓' : 'X'}
                    </td>
                    <td
                      className={`editable-cell ${row.region ? 'status-check' : 'status-cross'}`}
                      onClick={() => toggleCellValue(row.location, 'region')}
                    >
                      {row.region ? '✓' : 'X'}
                    </td>
                    <td>{calculateCompletion(row)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="side-panels">
          <div className="panel-box quick-actions">
            <h3>Quick Actions</h3>
            <div className="actions-list">
              {quickActions.map(action => (
                <div key={action.id} className="action-item">
                  {action.label}
                </div>
              ))}
            </div>
          </div>
          <div className="panel-box"></div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;