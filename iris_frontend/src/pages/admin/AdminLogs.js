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
  const [activeTab, setActiveTab] = useState('adminLogs'); // New state for active tab

  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('All');
  const [actionTypeFilter, setActionTypeFilter] = useState('All');
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;

  // For custom dropdowns
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);

  const [allLocations, setAllLocations] = useState(['All']);
  const [allActionTypes, setAllActionTypes] = useState(['All']);

  // Reset filters when switching tabs
  const handleTabChange = (tab) => {
    if (tab !== activeTab) {
      // Only reset and fetch if actually changing tabs
      setLoading(true); // Show loading state immediately
      setActiveTab(tab);
      setSearchTerm('');
      setLocationFilter('All');
      setActionTypeFilter('All');
      setDateRange([null, null]);
      
      // Clear the current logs before fetching new ones
      setLogs([]);
    }
  };

  // Fetch logs data from API
  const fetchLogs = async (tabToUse) => {
    setLoading(true);
    setError(null);
    setLogs([]); // Clear previous logs to prevent flashes of old data
  
    try {
      // Use the passed tab or fall back to activeTab state
      const currentTab = tabToUse || activeTab;
      
      // Prepare filters
      const filters = {
        searchTerm: searchTerm || null,
        location: locationFilter !== 'All' ? locationFilter : null,
        actionType: actionTypeFilter !== 'All' ? actionTypeFilter : null
      };
  
      // Add date range if selected
      if (startDate) filters.startDate = startDate.toISOString();
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        filters.endDate = endOfDay.toISOString();
      }
  
      const operation = currentTab === 'adminLogs' ? 'viewadminlogs' : 'viewuseraccesslogs';
      
      console.log(`Fetching ${currentTab} with filters:`, filters);
      
      const response = await axios.post('http://localhost:3000/api/logs', {
        operation,
        filters
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
  
      if (response.data.success) {
        // Update all state in one batch to prevent multiple renders
        const newLogs = response.data.logs;
        
        if (!searchTerm && locationFilter === 'All' && actionTypeFilter === 'All' && !startDate && !endDate) {
          if (currentTab === 'adminLogs') {
            const locations = ['All', ...new Set(newLogs.map(log => log.dActionLocation).filter(Boolean))];
            setAllLocations(locations);
          }
          
          const actionTypes = ['All', ...new Set(newLogs.map(log => log.dActionType).filter(Boolean))];
          setAllActionTypes(actionTypes);
        }
        
        setLogs(newLogs);
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

  useEffect(() => {
    // Skip initial render if we don't have filters applied
    const hasFilters = searchTerm || locationFilter !== 'All' || actionTypeFilter !== 'All' || startDate || endDate;
    
    // This check prevents double fetch on mount, only fetching when:
    // 1. There are filters applied
    // 2. This isn't the initial render (activeTab has been set)
    
    if (hasFilters || activeTab) {
      // Using a debounce to prevent too many requests
      const timer = setTimeout(() => {
        console.log('Fetching due to changed dependency:', 
          { filters: hasFilters, tab: activeTab });
        fetchLogs(activeTab);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchTerm, locationFilter, actionTypeFilter, dateRange, activeTab]);
  
  // Keep the dropdown close effect
  useEffect(() => {
    const closeDropdowns = () => {
      setShowMonthDropdown(false);
      setShowYearDropdown(false);
    };
    document.addEventListener('click', closeDropdowns);
    return () => document.removeEventListener('click', closeDropdowns);
  }, []);
  
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
      <div className="admin-logs-white-card">
        <div className="admin-logs-header">
          <h1>Admin Logs</h1>
          <p className="admin-logs-subtitle">View and manage system activity logs</p>
        </div>
        
        {/* Tabs for switching between log types */}
        <div className="tab-container">
          <div 
            className={`tab ${activeTab === 'adminLogs' ? 'active' : ''}`}
            onClick={() => handleTabChange('adminLogs')}
          >
            Admin Logs
          </div>
          <div 
            className={`tab ${activeTab === 'userAccessLogs' ? 'active' : ''}`}
            onClick={() => handleTabChange('userAccessLogs')}
          >
            User Access Logs
          </div>
        </div>
  
        {/* Loading State Handling - moved to top level */}
        {loading ? (
          <div className="loading-message">Loading logs...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          /* Only render content when not loading and no errors */
          <>
            {/* Admin Logs Content */}
            <div className={`tab-content ${activeTab === 'adminLogs' ? 'active' : ''}`}>
              {/* Search and Filter Controls */}
              <div className="controls">
                <div className="search-container">
                  <FaSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search admin logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
  
                {/* Location filter - only shown for Admin Logs */}
                <div className="filter-container">
                  <label>Location:</label>
                  <select
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                  >
                    {allLocations.map(location => (
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
                    {allActionTypes.map(actionType => (
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
              
              {/* Admin Logs Table */}
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Location ID</th>
                      <th>Location</th>
                      <th>Action Type</th>
                      <th>Action By</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.length > 0 ? (
                      logs.map(log => (
                        <tr key={log.dLog_ID}>
                          <td>{log.dLog_ID}</td>
                          <td>{log.dActionLocation_ID}</td>
                          <td>{log.dActionLocation}</td>
                          <td>{log.dActionType}</td>
                          <td>{log.dActionBy}</td>
                          <td>{formatDate(log.tActionAt)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="no-records">
                          No logs found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
  
            {/* User Access Logs Content */}
            <div className={`tab-content ${activeTab === 'userAccessLogs' ? 'active' : ''}`}>
              {/* Search and Filter Controls */}
              <div className="controls">
                <div className="search-container">
                  <FaSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search user access logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
  
                <div className="filter-container">
                  <label>Action Type:</label>
                  <select
                    value={actionTypeFilter}
                    onChange={(e) => setActionTypeFilter(e.target.value)}
                  >
                    {allActionTypes.map(actionType => (
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
              
              {/* User Access Logs Table */}
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Log ID</th>
                      <th>User ID</th>
                      <th>Action Type</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.length > 0 ? (
                      logs.map(log => (
                        <tr key={log.dLog_ID}>
                          <td>{log.dLog_ID}</td>
                          <td>{log.dUser_ID}</td>
                          <td>{log.dActionType}</td>
                          <td>{formatDate(log.tTimeStamp)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="no-records">
                          No logs found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminLogs;