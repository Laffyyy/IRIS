import React, { useState } from 'react';
import { FaSearch } from 'react-icons/fa';
import './DataMGMT.css';

const DataManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dataType, setDataType] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);

  // Mock data matching the image exactly
  const employeeData = [
    {
      employeeId: 'E12345',
      employeeName: 'John Doe',
      type: 'Attrition',
      monthYear: 'Jan 2024',
      description: 'Left company due to relocation',
      timestamp: '2024-01-15 09:23 AM'
    },
    {
      employeeId: '523456',
      employeeName: 'Jane Smith',
      type: 'DA',
      monthYear: 'Feb 2024',
      description: 'Disciplinary action for tardiness',
      timestamp: '2024-02-10 02:45 PM'
    },
    {
      employeeId: 'E34567',
      employeeName: 'Michael Johnson',
      type: 'LOA',
      monthYear: 'Mar 2024',
      description: 'Leave of absence for medical reasons',
      timestamp: '2024-03-05 11:12 AM'
    },
    {
      employeeId: 'E45678',
      employeeName: 'Emily Davis',
      type: 'Attrition',
      monthYear: 'Apr 2024',
      description: 'Resigned for career change',
      timestamp: '2024-04-20 04:30 PM'
    },
    {
      employeeId: 'E55789',
      employeeName: 'William Brown',
      type: 'DA',
      monthYear: 'May 2024',
      description: 'Disciplinary action for policy violation',
      timestamp: '2024-05-18 01:05 PM'
    },
    {
      employeeId: 'E67890',
      employeeName: 'Olivia Wilson',
      type: 'LOA',
      monthYear: 'Jun 2024',
      description: 'Leave of absence for family reasons',
      timestamp: '2024-06-12 10:00 AM'
    },
    {
      employeeId: 'E78901',
      employeeName: 'James Taylor',
      type: 'Attrition',
      monthYear: 'Jul 2024',
      description: 'Left company for higher education',
      timestamp: '2024-07-22 03:15 PM'
    },
    {
      employeeId: 'E89012',
      employeeName: 'Sophia Martinez',
      type: 'DA',
      monthYear: 'Aug 2024',
      description: 'Disciplinary action for attendance',
      timestamp: '2024-08-08 09:50 AM'
    },
    {
      employeeId: 'E90123',
      employeeName: 'Benjamin Anderson',
      type: 'LOA',
      monthYear: 'Sep 2024',
      description: 'Leave of absence for personal reasons',
      timestamp: '2024-09-14 08:40 AM'
    },
    {
      employeeId: 'E01234',
      employeeName: 'Mia Thomas',
      type: 'Attrition',
      monthYear: 'Oct 2024',
      description: 'Resigned due to relocation',
      timestamp: '2024-10-30 05:20 PM'
    },
    {
      employeeId: 'E11235',
      employeeName: 'Liam Harris',
      type: 'DA',
      monthYear: 'Nov 2024',
      description: 'Disciplinary action for misconduct',
      timestamp: '2024-11-11 12:00 PM'
    },
    {
      employeeId: 'E22346',
      employeeName: 'Emma Clark',
      type: 'LOA',
      monthYear: 'Dec 2024',
      description: 'Leave of absence for maternity',
      timestamp: '2024-12-01 08:00 AM'
    },
    {
      employeeId: 'E33467',
      employeeName: 'Noah Lewis',
      type: 'Attrition',
      monthYear: 'Jan 2025',
      description: 'Left company for personal reasons',
      timestamp: '2025-01-10 10:30 AM'
    }
  ];

  // Filter data based on search term and filters
  const filteredData = employeeData.filter(employee => {
    const matchesSearch = 
      employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = !dataType || employee.type === dataType;
    
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
    // Handle delete logic here
    console.log('Deleting rows:', selectedRows);
  };

  return (
    <div className="data-management-container">
      <div className="data-management-content">
        <div className="data-management-header">
          <h1>Data Management</h1>
          <p className="subtitle">View, filter, and delete uploaded HR data by type, date, or employee ID.</p>
        </div>

        <div className="controls-section">
          <div className="search-container">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filters">
            <select
              value={dataType}
              onChange={(e) => setDataType(e.target.value)}
              className="data-type-filter"
            >
              <option value="">Data Type</option>
              <option value="Attrition">Attrition</option>
              <option value="DA">DA</option>
              <option value="LOA">LOA</option>
            </select>

            <input
              type="month"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="month-filter"
            />
          </div>
        </div>

        <div className="table-section">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th className="checkbox-column">
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
                  <th>Type</th>
                  <th>Month/Year</th>
                  <th>Description</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((employee) => (
                  <tr key={employee.employeeId}>
                    <td className="checkbox-column">
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(employee.employeeId)}
                        onChange={() => handleRowSelect(employee.employeeId)}
                      />
                    </td>
                    <td>{employee.employeeId}</td>
                    <td>{employee.employeeName}</td>
                    <td>{employee.type}</td>
                    <td>{employee.monthYear}</td>
                    <td>{employee.description}</td>
                    <td>{employee.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedRows.length > 0 && (
            <div className="action-bar">
              <button className="delete-btn" onClick={handleDelete}>
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataManagement;
