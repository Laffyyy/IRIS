import React, { useState, useRef } from 'react';
import './KPIMGMT.css';
import { FaExclamationTriangle, FaUpload, FaCheckCircle, FaArrowUp, FaArrowDown } from 'react-icons/fa';

const KPIMGMT = () => {
  const [selectedLevel, setSelectedLevel] = useState('L1');
  const [isAtTop, setIsAtTop] = useState(true);
  const basketRef = useRef(null);
  const configRef = useRef(null);

  const scrollToSection = () => {
    if (isAtTop) {
      basketRef.current?.scrollIntoView({ behavior: 'smooth' });
      setIsAtTop(false);
    } else {
      configRef.current?.scrollIntoView({ behavior: 'smooth' });
      setIsAtTop(true);
    }
  };

  return (
    <div className="kpi-mgmt-container">
      {/* KPI Configuration Section */}
      <div className="white-card" ref={configRef}>
        <div className="kpi-mgmt-header">
          <h1>KPI/Metrics Configuration</h1>
          <p className="subtitle">Manage KPIs with weighted metrics, conditions, and real-time validation</p>
        </div>

        <div className="config-form">
          <div className="form-row">
            <div className="form-group">
              <label>Site<span className="required">*</span></label>
              <select className="compact-select">
                <option value="">Site A</option>
              </select>
            </div>
            <div className="form-group">
              <label>Client<span className="required">*</span></label>
              <select className="compact-select">
                <option value="">Client A</option>
              </select>
            </div>
            <div className="form-group">
              <label>LOB<span className="required">*</span></label>
              <select className="compact-select">
                <option value="">Customer Service</option>
              </select>
            </div>
            <div className="form-group">
              <label>Sub LOB<span className="required">*</span></label>
              <select className="compact-select">
                <option value="">None</option>
              </select>
            </div>
          </div>

          <div className="form-row levels-kpi-section">
            <div className="level-container">
              <label>Level<span className="required">*</span></label>
              <div className="level-buttons">
                <button 
                  className={selectedLevel === 'L1' ? 'active' : ''} 
                  onClick={() => setSelectedLevel('L1')}
                >L1</button>
                <button 
                  className={selectedLevel === 'L2' ? 'active' : ''} 
                  onClick={() => setSelectedLevel('L2')}
                >L2</button>
                <button 
                  className={selectedLevel === 'L3' ? 'active' : ''} 
                  onClick={() => setSelectedLevel('L3')}
                >L3</button>
              </div>
            </div>
          </div>

          <div className="kpi-behavior-section">
            <div className="form-group kpi-name-container">
              <label>KPI Name<span className="required">*</span></label>
              <select className="compact-select">
                <option value="">KPOG - Average Handle Time</option>
              </select>
            </div>
            <div className="calc-behavior-container">
              <div className="form-group">
                <label>Calculation Behavior</label>
                <select className="compact-select">
                  <option value="">Lower the Better</option>
                </select>
              </div>
            </div>
          </div>

          <div className="metrics-table">
            <table>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Tenure Group</th>
                  <th>Weight (%)</th>
                  <th>Client Target</th>
                  <th>Operations Target</th>
                  <th>Floor / Ceiling</th>
                  <th>Warning</th>
                </tr>
              </thead>
              <tbody>
                {['0-30 days', '31-60 days', '61-90 days', '91-180 days', '>180 days'].map((tenure) => (
                  <tr key={tenure}>
                    <td>Customer Satisfaction</td>
                    <td>{tenure}</td>
                    <td><input type="text" className="compact-input" value="20" /></td>
                    <td><input type="text" className="compact-input" value="85" /></td>
                    <td><input type="text" className="compact-input" value="80" /></td>
                    <td>
                      <select className="compact-select">
                        <option value="floor">Floor</option>
                        <option value="ceiling">Ceiling</option>
                      </select>
                    </td>
                    <td className="warning-cell">
                      <FaExclamationTriangle className="warning-icon" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="warning-note">*Warning appears if Operations Target is less than Client Target.</p>
          </div>

          <div className="weight-total">
            <div className="form-group">
              <label>Weight (%)<span className="required">*</span></label>
              <input type="text" className="compact-input" />
            </div>
            <div className="weight-summary">
              <span>Total Weight: 100.0% | </span>
              <span>Remaining Weight: 0.0%</span>
            </div>
          </div>

          <div className="config-footer">
            <button className="save-config-btn">Save Configuration</button>
          </div>
        </div>
      </div>

      {/* KPI Basket Section */}
      <div className="white-card kpi-basket" ref={basketRef}>
        <div className="kpi-mgmt-header">
          <h1>KPI Basket</h1>
          <p className="subtitle">Select and assign weights to KPIs with real-time validation and balance checks.</p>
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
                <td>None</td>
                <td>L2</td>
                <td>Net Promoter Score</td>
                <td>Higher the better</td>
                <td>19%</td>
              </tr>
              <tr>
                <td>Site E</td>
                <td>Client I</td>
                <td>Healthcare Services</td>
                <td>Claims Processing</td>
                <td>L1</td>
                <td>Claim Turnaround Time</td>
                <td>Lower the better</td>
                <td>15%</td>
              </tr>
            </tbody>
          </table>
          <div className="weight-total-summary">
            <span>Total Weight: 100.0% | </span>
            <span>Remaining Weight: 0.0%</span>
          </div>
        </div>

        <div className="basket-footer">
          <div className="minimal-checklist">
            <div className="checklist-item">
              <FaCheckCircle className="check-icon" />
              <span>3-6 metrics</span>
            </div>
            <div className="checklist-item">
              <FaCheckCircle className="check-icon" />
              <span>No duplicates</span>
            </div>
            <div className="checklist-item">
              <FaCheckCircle className="check-icon" />
              <span>Weight: 100%</span>
            </div>
          </div>
          <button className="upload-btn">
            <FaUpload />
            <span>Upload KPIs</span>
          </button>
        </div>
      </div>

      <button className="quick-nav-btn" onClick={scrollToSection} title={isAtTop ? "Go to KPI Basket" : "Go to KPI Configuration"}>
        {isAtTop ? <FaArrowDown /> : <FaArrowUp />}
      </button>
    </div>
  );
};

export default KPIMGMT; 