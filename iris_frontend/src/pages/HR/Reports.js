import React, { useState } from 'react';
import { FaSearch } from 'react-icons/fa';
import './Reports.css';

const Reports = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('All Team');
  const [selectedMonthYear, setSelectedMonthYear] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);
  const [activeTab, setActiveTab] = useState('LOA'); // Default active tab
  const [reports] = useState([
    { 
      employeeId: 'E12345',
      employeeName: 'John Doe',
      type: 'Attrition',
      monthYear: 'Jan 2024',
      description: 'Left company due to relocation',
      team: 'Team A',
      lob: 'LOB 1',
      subLob: 'Sub LOB A',
      timestamp: '2024-01-15 09:23 AM'
    },
    {
      employeeId: 'E23456',
      employeeName: 'Jane Smith',
      type: 'DA',
      monthYear: 'Feb 2024',
      description: 'Disciplinary action for tardiness',
      team: 'Team B',
      lob: 'LOB 2',
      subLob: 'Sub LOB B',
      timestamp: '2024-02-10 02:45 PM'
    },
    {
      employeeId: 'E34567',
      employeeName: 'Michael Johnson',
      type: 'LOA',
      monthYear: 'Mar 2024',
      description: 'Leave of absence for medical reasons',
      team: 'Team C',
      lob: 'LOB 1',
      subLob: 'Sub LOB C',
      timestamp: '2024-03-05 11:12 AM'
    },
    {
      employeeId: 'E45678',
      employeeName: 'Emily Davis',
      type: 'Attrition',
      monthYear: 'Apr 2024',
      description: 'Resigned for career change',
      team: 'Team A',
      lob: 'LOB 3',
      subLob: 'Sub LOB C',
      timestamp: '2024-04-20 04:30 PM'
    },
    {
      employeeId: 'E55789',
      employeeName: 'William Brown',
      type: 'DA',
      monthYear: 'May 2024',
      description: 'Disciplinary action for policy violation',
      team: 'Team B',
      lob: 'LOB 1',
      subLob: 'Sub LOB A',
      timestamp: '2024-05-18 01:05 PM'
    },
    {
      employeeId: 'E67890',
      employeeName: 'Olivia Wilson',
      type: 'LOA',
      monthYear: 'Jul 2024',
      description: 'Leave of absence for family reasons',
      team: 'Team C',
      lob: 'LOB 1',
      subLob: 'Sub LOB A',
      timestamp: '2024-06-12 10:00 AM'
    },
    {
      employeeId: 'E78901',
      employeeName: 'James Taylor',
      type: 'Attrition',
      monthYear: 'Jul 2024',
      description: 'Left company for higher education',
      team: 'Team A',
      lob: 'LOB 3',
      subLob: 'Sub LOB C',
      timestamp: '2024-07-22 03:15 PM'
    }
  ]);

  const handleRowSelect = (employeeId) => {
    setSelectedRows(prev => {
      if (prev.includes(employeeId)) {
        return prev.filter(id => id !== employeeId);
      } else {
        return [...prev, employeeId];
      }
    });
  };

  const handleExport = () => {
    // If there are selected rows, export only those from the filtered data
    const dataToExport = selectedRows.length > 0 
      ? filteredReports.filter(report => selectedRows.includes(report.employeeId))
      : filteredReports; // If no rows selected, export all filtered data
    
    // Create CSV content
    const headers = ['Employee ID', 'Employee Name', 'Type', 'Month/Year', 'Description', 'Team', 'LOB', 'Sub LOB', 'Timestamp'];
    const csvContent = [
      headers.join(','),
      ...dataToExport.map(report => [
        report.employeeId,
        report.employeeName,
        report.type,
        report.monthYear,
        `"${report.description}"`,
        report.team,
        report.lob,
        report.subLob,
        report.timestamp
      ].join(','))
    ].join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'hr_reports.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter data based on search term and filters
  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTeam = selectedTeam === 'All Team' || report.team === selectedTeam;
    const matchesType = report.type === activeTab;
    
    const matchesDate = !selectedMonthYear || (() => {
      if (!selectedMonthYear) return true;
      const [year, month] = selectedMonthYear.split('-');
      const date = new Date(year, month - 1);
      const monthYear = date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      return report.monthYear.includes(monthYear);
    })();

    return matchesSearch && matchesTeam && matchesType && matchesDate;
  });

  return (
    <div className="reports-container hr-reports-container">
      <div className="data-management-content hr-reports-content">
        <div className="reports-header hr-reports-header">
          <h1>Reports</h1>
          <p className="subtitle hr-reports-subtitle">View and manage employee reports with filters for team and date.</p>
        </div>

        <div className="controls-section hr-reports-controls">
          <div className="search-container hr-reports-search">
            <FaSearch className="search-icon hr-reports-search-icon" />
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filters hr-reports-filters">
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="data-type-filter hr-reports-team-filter"
            >
              <option value="All Team">All Teams</option>
              <option value="Team A">Team A</option>
              <option value="Team B">Team B</option>
              <option value="Team C">Team C</option>
            </select>

            <input
              type="month"
              value={selectedMonthYear}
              onChange={(e) => setSelectedMonthYear(e.target.value)}
              className="month-filter hr-reports-month-filter"
              placeholder="Month/Year"
            />
          </div>
        </div>

        <div className="hr-reports-tabs-container">
          <div className="hr-reports-tabs">
            <button 
              className={`hr-reports-tab ${activeTab === 'LOA' ? 'active' : ''}`}
              onClick={() => setActiveTab('LOA')}
            >
              LOA
            </button>
            <button 
              className={`hr-reports-tab ${activeTab === 'Attrition' ? 'active' : ''}`}
              onClick={() => setActiveTab('Attrition')}
            >
              Attrition
            </button>
            <button 
              className={`hr-reports-tab ${activeTab === 'DA' ? 'active' : ''}`}
              onClick={() => setActiveTab('DA')}
            >
              DA
            </button>
          </div>

          <div className="table-section hr-reports-table-section">
            <div className="table-container hr-reports-table-container">
              <div className="table-wrapper hr-reports-table-wrapper">
                <div className="table-scroll hr-reports-table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th className="checkbox-column hr-reports-checkbox-column">
                          <input
                            type="checkbox"
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedRows(filteredReports.map(report => report.employeeId));
                              } else {
                                setSelectedRows([]);
                              }
                            }}
                            checked={selectedRows.length === filteredReports.length && filteredReports.length > 0}
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
                      {filteredReports.map((report) => (
                        <tr key={report.employeeId}>
                          <td className="checkbox-column hr-reports-checkbox-column">
                            <input
                              type="checkbox"
                              checked={selectedRows.includes(report.employeeId)}
                              onChange={() => handleRowSelect(report.employeeId)}
                            />
                          </td>
                          <td className="employee-id hr-reports-employee-id">{report.employeeId}</td>
                          <td>{report.employeeName}</td>
                          <td>{report.monthYear}</td>
                          <td className="description hr-reports-description">{report.description}</td>
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

            <div className="action-bar hr-reports-action-bar">
              <button className="export-btn hr-reports-export-btn" onClick={handleExport}>
                Export
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
