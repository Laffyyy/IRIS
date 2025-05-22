import React, { useState } from 'react';
import { FaSearch, FaFilter, FaCalendarAlt, FaChevronDown } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import './AdminLogs.css';

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

const AdminLogs = () => {
  // Mock data for logs
  const [logs] = useState([
    {
      id: 1,
      timestamp: '2024-03-21 10:30:45',
      user: 'John Doe',
      action: 'User Created',
      module: 'User Management',
      details: 'Created new user: jane.smith@example.com',
      status: 'Success'
    },
    {
      id: 2,
      timestamp: '2024-03-21 10:25:12',
      user: 'Jane Smith',
      action: 'KPI Updated',
      module: 'KPI Management',
      details: 'Updated KPI: Sales Target',
      status: 'Success'
    },
    {
      id: 3,
      timestamp: '2024-03-21 10:15:33',
      user: 'Admin User',
      action: 'Site Deleted',
      module: 'Site Management',
      details: 'Deleted site: Site A',
      status: 'Success'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;

  // For custom dropdowns
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);

  // Filter logs based on search term, filters, and date range
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesModule = moduleFilter === 'All' || log.module === moduleFilter;
    const matchesStatus = statusFilter === 'All' || log.status === statusFilter;

    // Date range filtering
    const logDate = new Date(log.timestamp);
    const matchesStartDate = !startDate || logDate >= startDate;
    const matchesEndDate = !endDate || logDate <= new Date(endDate.setHours(23, 59, 59, 999));

    return matchesSearch && matchesModule && matchesStatus && matchesStartDate && matchesEndDate;
  });

  // Get unique modules for filter dropdown
  const uniqueModules = ['All', ...new Set(logs.map(log => log.module))];
  const uniqueStatuses = ['All', ...new Set(logs.map(log => log.status))];

  // Custom header for DatePicker: only month and year as label-style dropdowns
  const renderCustomHeader = ({ date, changeYear, changeMonth, decreaseMonth, increaseMonth, prevMonthButtonDisabled, nextMonthButtonDisabled }) => (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, alignItems: 'center', marginBottom: 8, position: 'relative' }}>
      <button onClick={decreaseMonth} disabled={prevMonthButtonDisabled} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#004D8D' }}>{'<'}</button>
      {/* Month label dropdown */}
      <div style={{ position: 'relative' }}>
        <span
          style={{ cursor: 'pointer', padding: '2px 8px', borderRadius: 4, color: '#004D8D', fontWeight: 500, display: 'inline-flex', alignItems: 'center', background: showMonthDropdown ? '#f0f4fa' : 'none' }}
          onClick={e => { e.stopPropagation(); setShowMonthDropdown(v => !v); setShowYearDropdown(false); }}
        >
          {months[date.getMonth()]} <FaChevronDown style={{ marginLeft: 4, fontSize: 12 }} />
        </span>
        {showMonthDropdown && (
          <div style={{ position: 'absolute', top: '100%', left: 0, background: 'white', border: '1px solid #ddd', borderRadius: 4, zIndex: 10, minWidth: 100, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            {months.map((month, idx) => (
              <div
                key={month}
                style={{ padding: '6px 12px', cursor: 'pointer', color: idx === date.getMonth() ? '#004D8D' : '#222', background: idx === date.getMonth() ? '#e6f0fa' : 'none' }}
                onClick={e => { e.stopPropagation(); changeMonth(idx); setShowMonthDropdown(false); }}
              >
                {month}
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Year label dropdown */}
      <div style={{ position: 'relative' }}>
        <span
          style={{ cursor: 'pointer', padding: '2px 8px', borderRadius: 4, color: '#004D8D', fontWeight: 500, display: 'inline-flex', alignItems: 'center', background: showYearDropdown ? '#f0f4fa' : 'none' }}
          onClick={e => { e.stopPropagation(); setShowYearDropdown(v => !v); setShowMonthDropdown(false); }}
        >
          {date.getFullYear()} <FaChevronDown style={{ marginLeft: 4, fontSize: 12 }} />
        </span>
        {showYearDropdown && (
          <div style={{ position: 'absolute', top: '100%', left: 0, background: 'white', border: '1px solid #ddd', borderRadius: 4, zIndex: 10, minWidth: 80, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            {years.map(option => (
              <div
                key={option}
                style={{ padding: '6px 12px', cursor: 'pointer', color: option === date.getFullYear() ? '#004D8D' : '#222', background: option === date.getFullYear() ? '#e6f0fa' : 'none' }}
                onClick={e => { e.stopPropagation(); changeYear(option); setShowYearDropdown(false); }}
              >
                {option}
              </div>
            ))}
          </div>
        )}
      </div>
      <button onClick={increaseMonth} disabled={nextMonthButtonDisabled} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#004D8D' }}>{'>'}</button>
    </div>
  );

  // Close dropdowns on outside click
  React.useEffect(() => {
    const closeDropdowns = () => {
      setShowMonthDropdown(false);
      setShowYearDropdown(false);
    };
    document.addEventListener('click', closeDropdowns);
    return () => document.removeEventListener('click', closeDropdowns);
  }, []);

  return (
    <div className="admin-logs-container">
      <div className="admin-logs-white-card">
        <div className="admin-logs-header">
          <h1>Admin Logs</h1>
          <p className="admin-logs-subtitle">View and manage system activity logs</p>
        </div>

        {/* Search and Filter Controls */}
        <div className="admin-logs-controls">
          <div className="admin-logs-search-container">
            <FaSearch className="admin-logs-search-icon" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="admin-logs-filter-container">
            <label>Module:</label>
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
            >
              {uniqueModules.map(module => (
                <option key={module} value={module}>{module}</option>
              ))}
            </select>
          </div>

          <div className="admin-logs-filter-container">
            <label>Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {uniqueStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div className="admin-logs-date-picker-wrapper">
            <div className="admin-logs-date-input-container">
              <FaCalendarAlt className="admin-logs-date-icon" />
              <DatePicker
                selectsRange={true}
                startDate={startDate}
                endDate={endDate}
                onChange={(update) => setDateRange(update)}
                placeholderText="Select date range"
                dateFormat="MMM d, yyyy"
                className="admin-logs-date-picker-input"
                isClearable={true}
                maxDate={new Date()}
                renderCustomHeader={renderCustomHeader}
              />
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="admin-logs-table-container">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Module</th>
                <th>Details</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => (
                <tr key={log.id}>
                  <td>{log.timestamp}</td>
                  <td>{log.user}</td>
                  <td>{log.action}</td>
                  <td>{log.module}</td>
                  <td>{log.details}</td>
                  <td>
                    <span className={`admin-logs-status-badge ${log.status.toLowerCase()}`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminLogs; 