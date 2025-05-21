import React, { useState, useEffect } from 'react';
import { FaSearch, FaCalendarAlt, FaChevronDown } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import './AdminLogs.css';
import axios from 'axios';

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

const AdminLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('All');
  const [actionTypeFilter, setActionTypeFilter] = useState('All');
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;

  // For custom dropdowns
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);

  // Fetch logs data from API
  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
  
    try {
      // Comment out mock data and uncomment API code
      /*
      const mockLogs = [
        { 
          dLog_ID: 1, 
          tActionAt: new Date().toISOString(), 
          dActionBy: 'Test User', 
          dActionType: 'Login', 
          dActionLocation: 'Authentication', 
          dActionLocation_ID: '1'
        },
        { 
          dLog_ID: 2, 
          tActionAt: new Date(Date.now() - 86400000).toISOString(), 
          dActionBy: 'Admin', 
          dActionType: 'Update', 
          dActionLocation: 'User Management', 
          dActionLocation_ID: '5'
        }
      ];
      
      // Set mock logs directly without API call
      setLogs(mockLogs);
      */
  
      // UNCOMMENT THIS SECTION
      // We're bypassing token validation for now
      // const token = localStorage.getItem('token');
      // if (!token) {
      //   throw new Error('Authentication token not found');
      // }
  
      // Prepare filters
      const filters = {
        searchTerm: searchTerm || null,
        location: locationFilter,
        actionType: actionTypeFilter
      };
  
      // Add date range if selected
      if (startDate) {
        filters.startDate = startDate.toISOString();
      }
      if (endDate) {
        // Set end date to end of day
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        filters.endDate = endOfDay.toISOString();
      }
  
      // Make API call without authentication for now
      const response = await axios.post('http://localhost:3000/api/logs', {
        operation: 'viewadminlogs',
        filters
      }, {
        // No authentication header for testing
        headers: {
          'Content-Type': 'application/json'
        }
      });
  
      console.log("API response:", response.data);
  
      if (response.data.success) {
        setLogs(response.data.logs);
      } else {
        throw new Error(response.data.message || 'Failed to fetch logs');
      }
      
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError('Failed to load logs: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchLogs();
  }, []); // Empty dependency array for initial load only

  // Refetch when filters change
  useEffect(() => {
    // Using a debounce to prevent too many requests
    const timer = setTimeout(() => {
      fetchLogs();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, locationFilter, actionTypeFilter, dateRange]);

  // Get unique locations and action types for filter dropdowns
  const uniqueLocations = ['All', ...new Set(logs.map(log => log.dActionLocation).filter(Boolean))];
  const uniqueActionTypes = ['All', ...new Set(logs.map(log => log.dActionType).filter(Boolean))];

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

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
  useEffect(() => {
    const closeDropdowns = () => {
      setShowMonthDropdown(false);
      setShowYearDropdown(false);
    };
    document.addEventListener('click', closeDropdowns);
    return () => document.removeEventListener('click', closeDropdowns);
  }, []);

  return (
    <div className="admin-logs-container">
      <div className="white-card">
        <div className="admin-logs-header">
          <h1>Admin Logs</h1>
          <p className="subtitle">View and manage system activity logs</p>
        </div>

        {/* Search and Filter Controls */}
        <div className="controls">
          <div className="search-container">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-container">
            <label>Location:</label>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
            >
              {uniqueLocations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>

          <div className="filter-container">
            <label>Action Type:</label>
            <select
              value={actionTypeFilter}
              onChange={(e) => setActionTypeFilter(e.target.value)}
            >
              {uniqueActionTypes.map(actionType => (
                <option key={actionType} value={actionType}>{actionType}</option>
              ))}
            </select>
          </div>

          <div className="date-picker-wrapper">
            <div className="date-input-container">
              <FaCalendarAlt className="date-icon" />
              <DatePicker
                selectsRange={true}
                startDate={startDate}
                endDate={endDate}
                onChange={(update) => setDateRange(update)}
                placeholderText="Select date range"
                dateFormat="MMM d, yyyy"
                className="date-picker-input"
                isClearable={true}
                maxDate={new Date()}
                renderCustomHeader={renderCustomHeader}
              />
            </div>
          </div>
        </div>

        {/* Loading and Error States */}
        {loading && <div className="loading-message">Loading logs...</div>}
        {error && <div className="error-message">{error}</div>}

        {/* Logs Table */}
        {!loading && !error && (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Timestamp</th>
                  <th>Action By</th>
                  <th>Action Type</th>
                  <th>Location</th>
                  <th>Location ID</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.dLog_ID}> {/* Changed from dLog_ID to dLog_ID */}
                    <td>{log.dLog_ID}</td> {/* Changed from dLog_ID to dLog_ID */}
                    <td>{formatDate(log.tActionAt)}</td>
                    <td>{log.dActionBy}</td>
                    <td>{log.dActionType}</td>
                    <td>{log.dActionLocation}</td>
                    <td>{log.dActionLocation_ID}</td>
                  </tr>
                ))}
                {logs.length === 0 && !loading && (
                  <tr>
                    <td colSpan="6" className="no-records">No logs found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLogs;