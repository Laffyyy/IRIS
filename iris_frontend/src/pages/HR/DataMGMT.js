import React, { useState } from 'react';
import { FaSearch, FaTrash } from 'react-icons/fa';
import './DataMGMT.css';

const DataManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);
  const [activeTab, setActiveTab] = useState('LOA'); // Default active tab
  const [employeeData, setEmployeeData] = useState([
    {
      employeeId: 'E12345',
      employeeName: 'John Doe',
      type: 'Attrition',
      monthYear: 'Jan 2024',
      description: 'Left company due to relocation',
      timestamp: '2024-01-15 09:23 AM',
      team: 'Customer Service',
      lob: 'Operations',
      subLob: 'Voice Support'
    },
    {
      employeeId: '523456',
      employeeName: 'Jane Smith',
      type: 'DA',
      monthYear: 'Feb 2024',
      description: 'Disciplinary action for tardiness',
      timestamp: '2024-02-10 02:45 PM',
      team: 'Technical Support',
      lob: 'Technology',
      subLob: 'IT Help Desk'
    },
    {
      employeeId: 'E34567',
      employeeName: 'Michael Johnson',
      type: 'LOA',
      monthYear: 'Mar 2024',
      description: 'Leave of absence for medical reasons',
      timestamp: '2024-03-05 11:12 AM',
      team: 'Sales',
      lob: 'Business Development',
      subLob: 'Enterprise Sales'
    },
    {
      employeeId: 'E45678',
      employeeName: 'Emily Davis',
      type: 'Attrition',
      monthYear: 'Apr 2024',
      description: 'Resigned for career change',
      timestamp: '2024-04-20 04:30 PM',
      team: 'Marketing',
      lob: 'Brand Management',
      subLob: 'Digital Marketing'
    },
    {
      employeeId: 'E55789',
      employeeName: 'William Brown',
      type: 'DA',
      monthYear: 'May 2024',
      description: 'Disciplinary action for policy violation',
      timestamp: '2024-05-18 01:05 PM',
      team: 'Customer Service',
      lob: 'Operations',
      subLob: 'Chat Support'
    },
    {
      employeeId: 'E67890',
      employeeName: 'Olivia Wilson',
      type: 'LOA',
      monthYear: 'Jun 2024',
      description: 'Leave of absence for family reasons',
      timestamp: '2024-06-12 10:00 AM',
      team: 'Finance',
      lob: 'Accounting',
      subLob: 'Payroll'
    },
    {
      employeeId: 'E78901',
      employeeName: 'James Taylor',
      type: 'Attrition',
      monthYear: 'Jul 2024',
      description: 'Left company for higher education',
      timestamp: '2024-07-22 03:15 PM',
      team: 'Technical Support',
      lob: 'Technology',
      subLob: 'Network Support'
    },
    {
      employeeId: 'E89012',
      employeeName: 'Sophia Martinez',
      type: 'DA',
      monthYear: 'Aug 2024',
      description: 'Disciplinary action for attendance',
      timestamp: '2024-08-08 09:50 AM',
      team: 'Sales',
      lob: 'Business Development',
      subLob: 'SMB Sales'
    },
    {
      employeeId: 'E90123',
      employeeName: 'Benjamin Anderson',
      type: 'LOA',
      monthYear: 'Sep 2024',
      description: 'Leave of absence for personal reasons',
      timestamp: '2024-09-14 08:40 AM',
      team: 'Marketing',
      lob: 'Brand Management',
      subLob: 'Content Marketing'
    },
    {
      employeeId: 'E01234',
      employeeName: 'Mia Thomas',
      type: 'Attrition',
      monthYear: 'Oct 2024',
      description: 'Resigned due to relocation',
      timestamp: '2024-10-30 05:20 PM',
      team: 'Customer Service',
      lob: 'Operations',
      subLob: 'Email Support'
    },
    {
      employeeId: 'E11235',
      employeeName: 'Liam Harris',
      type: 'DA',
      monthYear: 'Nov 2024',
      description: 'Disciplinary action for misconduct',
      timestamp: '2024-11-11 12:00 PM',
      team: 'Technical Support',
      lob: 'Technology',
      subLob: 'Desktop Support'
    },
    {
      employeeId: 'E22346',
      employeeName: 'Emma Clark',
      type: 'LOA',
      monthYear: 'Dec 2024',
      description: 'Leave of absence for maternity',
      timestamp: '2024-12-01 08:00 AM',
      team: 'Finance',
      lob: 'Accounting',
      subLob: 'Accounts Payable'
    },
    {
      employeeId: 'E33467',
      employeeName: 'Noah Lewis',
      type: 'Attrition',
      monthYear: 'Jan 2025',
      description: 'Left company for personal reasons',
      timestamp: '2025-01-10 10:30 AM',
      team: 'Sales',
      lob: 'Business Development',
      subLob: 'Inside Sales'
    }
  ]);

  // Filter data based on search term and filters
  const filteredData = employeeData.filter(employee => {
    const matchesSearch = 
      employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = employee.type === activeTab;
    
    // Convert selected date to format matching the data (MMM YYYY)
    const matchesDate = !selectedDate || (() => {
      if (!selectedDate) return true;
      const [year, month] = selectedDate.split('-');
      const date = new Date(year, month - 1);
      const monthYear = date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      return employee.monthYear.includes(monthYear);
    })();
    
    return matchesSearch && matchesType && matchesDate;
  });

  const handleRowSelect = (employeeId) => {
    setSelectedRows(prev => {
      if (prev.includes(employeeId)) {
        return prev.filter(id => id !== employeeId);
      } else {
        return [...prev, employeeId];
      }
    });
  };

  const handleDelete = () => {
    // Handle bulk delete
    setEmployeeData(prev => prev.filter(emp => !selectedRows.includes(emp.employeeId)));
    setSelectedRows([]);
  };

  const handleSingleDelete = (employeeId) => {
    // Handle single row delete
    setEmployeeData(prev => prev.filter(emp => emp.employeeId !== employeeId));
    setSelectedRows(prev => prev.filter(id => id !== employeeId));
  };

  return (
    <div className="data-management-container hr-data-mgmt-container">
      <div className="data-management-content hr-data-mgmt-content">
        <div className="data-management-header hr-data-mgmt-header">
          <h1>Data Management</h1>
          <p className="subtitle hr-data-mgmt-subtitle">View, filter, and delete uploaded HR data by date or employee ID.</p>
        </div>

        <div className="controls-section hr-data-mgmt-controls">
          <div className="search-container hr-data-mgmt-search">
            <FaSearch className="search-icon hr-data-mgmt-search-icon" />
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filters hr-data-mgmt-filters">
            <input
              type="month"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="month-filter hr-data-mgmt-month-filter"
            />
          </div>
        </div>

        <div className="hr-data-mgmt-tabs-container">
          <div className="hr-data-mgmt-tabs">
            <button 
              className={`hr-data-mgmt-tab ${activeTab === 'LOA' ? 'active' : ''}`}
              onClick={() => setActiveTab('LOA')}
            >
              LOA
            </button>
            <button 
              className={`hr-data-mgmt-tab ${activeTab === 'Attrition' ? 'active' : ''}`}
              onClick={() => setActiveTab('Attrition')}
            >
              Attrition
            </button>
            <button 
              className={`hr-data-mgmt-tab ${activeTab === 'DA' ? 'active' : ''}`}
              onClick={() => setActiveTab('DA')}
            >
              DA
            </button>
          </div>

          <div className="table-section hr-data-mgmt-table-section">
            <div className="table-container hr-data-mgmt-table-container">
              <div className="table-wrapper hr-data-mgmt-table-wrapper">
                <div className="table-scroll hr-data-mgmt-table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th className="checkbox-column hr-data-mgmt-checkbox-column">
                          <input
                            type="checkbox"
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedRows(filteredData.map(emp => emp.employeeId));
                              } else {
                                setSelectedRows([]);
                              }
                            }}
                            checked={selectedRows.length === filteredData.length && filteredData.length > 0}
                          />
                        </th>
                        <th>Employee ID</th>
                        <th>Employee Name</th>
                        <th>Month/Year</th>
                        <th>Description</th>
                        <th>Team</th>
                        <th>LOB</th>
                        <th>Sub LOB</th>
                        <th>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.map((report) => (
                        <tr key={report.employeeId}>
                          <td className="checkbox-column hr-data-mgmt-checkbox-column">
                            <input
                              type="checkbox"
                              checked={selectedRows.includes(report.employeeId)}
                              onChange={() => handleRowSelect(report.employeeId)}
                            />
                          </td>
                          <td className="employee-id hr-data-mgmt-employee-id">{report.employeeId}</td>
                          <td>{report.employeeName}</td>
                          <td>{report.monthYear}</td>
                          <td className="description hr-data-mgmt-description">{report.description}</td>
                          <td>{report.team}</td>
                          <td>{report.lob}</td>
                          <td>{report.subLob}</td>
                          <td>{report.timestamp}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {selectedRows.length > 0 && (
              <div className="action-bar hr-data-mgmt-action-bar">
                <button className="delete-btn hr-data-mgmt-delete-btn" onClick={handleDelete}>
                  <FaTrash /> Delete Selected ({selectedRows.length})
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataManagement;
