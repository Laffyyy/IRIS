import React, { useState } from 'react';
import './Dashboard.css';

const Dashboard = () => {
  const mockUser = {
    name: 'John Abide Abdul Doe',
    role: 'Incentive Administrator',
    responsibilities: ['User Management', 'Activity Logs Monitoring'],
    lastLogin: 'Today at 8:45 AM',
    status: 'Active'
  };

  const [processingData, setProcessingData] = useState([
    { location: 'A', hrLog: true, hrDb: true, hrsApp: true, payroll: true, store: true, region: true },
    { location: 'B', hrLog: false, hrDb: false, hrsApp: false, payroll: true, store: true, region: false },
    { location: 'C', hrLog: true, hrDb: false, hrsApp: false, payroll: true, store: true, region: true },
  ]);

  const quickActions = [
    { id: 1, label: 'Manage KPIs' },
    { id: 2, label: 'Review Logs' },
  ];

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
    const fields = ['hrLog', 'hrDb', 'hrsApp', 'payroll', 'store', 'region'];
    const completedCount = fields.filter(field => row[field]).length;
    return Math.round((completedCount / fields.length) * 100) + '%';
  };

  return (
    <div className="dashboard-container">
      <div className="user-header">
        <div className="user-left">
          <h2>{mockUser.name}</h2>
          <span className="user-role">{mockUser.role}</span>
        </div>
        <div className="user-center">
          <span className="labelr">Responsibilities</span>
          <div className="responsibility-pills">
            {mockUser.responsibilities.map((item, idx) => (
              <span key={idx} className="pill">{item}</span>
            ))}
          </div>
        </div>
        <div className="user-right">
          <span className="label">Last Login</span>
          <div className="login-status">
            <span>{mockUser.lastLogin}</span>
            <span className="status-pill">{mockUser.status}</span>
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
                  <th>Store</th>
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
                      className={`editable-cell ${row.store ? 'status-check' : 'status-cross'}`}
                      onClick={() => toggleCellValue(row.location, 'store')}
                    >
                      {row.store ? '✓' : 'X'}
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