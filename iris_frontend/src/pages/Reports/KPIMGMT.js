import React, { useState } from 'react';
import { FaExclamationTriangle, FaCheckSquare } from 'react-icons/fa';
import './KPIMGMT.css';

const KPIMGMT = () => {
  const [selectedLevel, setSelectedLevel] = useState('L1');
  const [weights, setWeights] = useState({
    '0-30 days': '20',
    '31-60 days': '20',
    '61-90 days': '20',
    '91-180 days': '20',
    '>180 days': '20'
  });

  return (
    <div className="kpi-mgmt-container">
      {/* Left Panel - Configuration */}
      <div className="left-panel">
        <div className="config-card">
          <div className="section-header">
            <h2>KPI Configuration</h2>
            <p>Configure KPI settings</p>
          </div>

          <div className="form-group">
            <label>Site</label>
            <select className="form-select">
              <option>Site A</option>
            </select>
          </div>

          <div className="form-group">
            <label>Client</label>
            <select className="form-select">
              <option>Client X</option>
            </select>
          </div>

          <div className="form-group">
            <label>LOB</label>
            <select className="form-select">
              <option>Customer Service</option>
            </select>
          </div>

          <div className="form-group">
            <label>Sub LOB</label>
            <select className="form-select">
              <option>None</option>
            </select>
          </div>

          <div className="form-group">
            <label>Level</label>
            <div className="level-group">
              <button 
                className={`level-btn ${selectedLevel === 'L1' ? 'active' : ''}`}
                onClick={() => setSelectedLevel('L1')}
              >L1</button>
              <button 
                className={`level-btn ${selectedLevel === 'L2' ? 'active' : ''}`}
                onClick={() => setSelectedLevel('L2')}
              >L2</button>
              <button 
                className={`level-btn ${selectedLevel === 'L3' ? 'active' : ''}`}
                onClick={() => setSelectedLevel('L3')}
              >L3</button>
            </div>
          </div>

          <div className="form-group">
            <label>KPI Name</label>
            <select className="form-select">
              <option>Average Handle Time</option>
            </select>
          </div>

          <div className="form-group">
            <label>Calculation Behavior</label>
            <select className="form-select">
              <option>Lower the Better</option>
            </select>
          </div>
        </div>
      </div>

      {/* Middle Panel - Tenure Group */}
      <div className="middle-panel">
        <div className="config-card">
          <div className="section-header">
            <h2>Tenure Groups</h2>
            <p>Manage weights and targets</p>
          </div>

          <div className="metrics-table">
            <table>
              <thead>
                <tr>
                  <th>Tenure Group</th>
                  <th>Weight (%)</th>
                  <th>Client Target</th>
                  <th>Operations Target</th>
                  <th>Floor/Ceiling</th>
                  <th>Warning</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(weights).map(([tenure, weight]) => (
                  <tr key={tenure}>
                    <td>{tenure}</td>
                    <td>
                      <input
                        type="text"
                        className="metrics-input"
                        value={weight}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (/^\d*$/.test(value) && Number(value) <= 100) {
                            setWeights(prev => ({
                              ...prev,
                              [tenure]: value
                            }));
                          }
                        }}
                      />
                    </td>
                    <td><input type="text" className="metrics-input" defaultValue="85" /></td>
                    <td><input type="text" className="metrics-input" defaultValue="80" /></td>
                    <td>
                      <select className="form-select">
                        <option>Floor</option>
                        <option>Ceiling</option>
                      </select>
                    </td>
                    <td className="warning-cell">
                      <FaExclamationTriangle className="warning-icon" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="weight-section">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <label>Weight (%)</label>
                <input
                  type="text"
                  className="weight-input"
                  value={Object.values(weights).reduce((sum, w) => sum + Number(w), 0)}
                  readOnly
                />
              </div>
              <div className="weight-total">
                Total Weight: 100.0% | Remaining Weight: 0.0%
              </div>
            </div>
          </div>

          <div className="button-container">
            <button className="action-btn">Save Configuration</button>
          </div>
        </div>
      </div>

      {/* Right Panel - KPI Basket */}
      <div className="right-panel">
        <div className="config-card">
          <div className="section-header">
            <h2>KPI Basket</h2>
            <p>View and manage KPI assignments</p>
          </div>

          <div className="basket-table">
            <table>
              <thead>
                <tr>
                  <th>Site</th>
                  <th>Client</th>
                  <th>LOB</th>
                  <th>Sub LOB</th>
                  <th>Level</th>
                  <th>KPI</th>
                  <th>Calc. Behavior</th>
                  <th>Weight (%)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Site A</td>
                  <td>Client X</td>
                  <td>Finance</td>
                  <td>Accounts Payable</td>
                  <td>L1</td>
                  <td>Customer Satisfaction</td>
                  <td>Higher the better</td>
                  <td>12%</td>
                </tr>
                <tr>
                  <td>Site B</td>
                  <td>Client Y</td>
                  <td>Technical Support</td>
                  <td>Chat Support</td>
                  <td>L2</td>
                  <td>First Contact Resolution</td>
                  <td>Higher the better</td>
                  <td>14%</td>
                </tr>
                <tr>
                  <td>Site C</td>
                  <td>Client Z</td>
                  <td>Customer Service</td>
                  <td>Technical Support</td>
                  <td>L3</td>
                  <td>Average Handle Time</td>
                  <td>Lower the better</td>
                  <td>17%</td>
                </tr>
                <tr>
                  <td>Site D</td>
                  <td>Client H</td>
                  <td>B2C Outbound</td>
                  <td>Conversion Rate</td>
                  <td>L2</td>
                  <td>Net Promoter Score</td>
                  <td>Higher the better</td>
                  <td>19%</td>
                </tr>
                <tr>
                  <td>Site E</td>
                  <td>Client Y</td>
                  <td>Healthcare Services</td>
                  <td>Claims Processing</td>
                  <td>L1</td>
                  <td>Claim Turnaround Time</td>
                  <td>Lower the better</td>
                  <td>15%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="nested-panel">
            <div className="section-header">
              <h2>Validation Rules</h2>
              <p>Configuration requirements and status</p>
            </div>
            <div className="conditions-checklist">
              <div className="checklist-item">
                <FaCheckSquare className="check-icon" />
                <span>Minimum 3 metrics</span>
              </div>
              <div className="checklist-item">
                <FaCheckSquare className="check-icon" />
                <span>Maximum 6 metrics</span>
              </div>
              <div className="checklist-item">
                <FaCheckSquare className="check-icon" />
                <span>No duplicate metrics (same Site, Client, LOB, Sub LOB)</span>
              </div>
              <div className="checklist-item">
                <FaCheckSquare className="check-icon" />
                <span>Total weight must equal 100%</span>
              </div>
              <div className="checklist-item">
                <FaCheckSquare className="check-icon" />
                <span>Weights must be whole numbers only</span>
              </div>
            </div>
          </div>

          <div className="button-container">
            <button className="action-btn">Upload</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KPIMGMT; 