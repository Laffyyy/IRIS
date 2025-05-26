import React, { useState, useMemo } from 'react';
import { FaSearch, FaChevronDown } from 'react-icons/fa';
import './Report.css';

const Report = () => {
  const [selectedRows, setSelectedRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState('All Client');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [selectedMonthYear, setSelectedMonthYear] = useState('');
  const [reports] = useState([
    { id: 1, site: 'Site A', client: 'Client X', month: 'January', year: '2024', payoutAmount: 1200.00, status: 'Success' },
    { id: 2, site: 'Site B', client: 'Client Y', month: 'February', year: '2024', payoutAmount: 0.00, status: 'Failed' },
    { id: 3, site: 'Site C', client: 'Client Z', month: 'March', year: '2024', payoutAmount: 995.00, status: 'Success' },
    { id: 4, site: 'Site D', client: 'Client X', month: 'April', year: '2024', payoutAmount: 1100.00, status: 'Success' },
    { id: 5, site: 'Site E', client: 'Client Y', month: 'May', year: '2024', payoutAmount: 0.00, status: 'Failed' },
    { id: 6, site: 'Site F', client: 'Client Z', month: 'June', year: '2024', payoutAmount: 1300.00, status: 'Success' },
    { id: 7, site: 'Site G', client: 'Client X', month: 'July', year: '2024', payoutAmount: 1150.00, status: 'Success' },
    { id: 8, site: 'Site H', client: 'Client Y', month: 'August', year: '2024', payoutAmount: 0.00, status: 'Failed' },
    { id: 9, site: 'Site I', client: 'Client Z', month: 'September', year: '2024', payoutAmount: 1400.00, status: 'Success' },
    { id: 10, site: 'Site J', client: 'Client X', month: 'October', year: '2024', payoutAmount: 1000.00, status: 'Success' },
    { id: 11, site: 'Site K', client: 'Client Y', month: 'November', year: '2024', payoutAmount: 850.00, status: 'Success' },
    { id: 12, site: 'Site L', client: 'Client Z', month: 'December', year: '2024', payoutAmount: 1100.00, status: 'Success' }
  ]);

  // Extract unique values for filters
  const clients = useMemo(() => ['All Client', ...new Set(reports.map(report => report.client))], [reports]);
  const statuses = useMemo(() => ['All Status', ...new Set(reports.map(report => report.status))], [reports]);

  // Filter the reports based on all criteria
  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      const matchesSearch = 
        report.site.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.month.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.year.includes(searchTerm) ||
        report.payoutAmount.toString().includes(searchTerm) ||
        report.status.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesClient = selectedClient === 'All Client' || report.client === selectedClient;
      const matchesStatus = selectedStatus === 'All Status' || report.status === selectedStatus;
      
      // Convert selected date to format matching the data (MMM YYYY)
      const matchesDate = !selectedMonthYear || (() => {
        if (!selectedMonthYear) return true;
        const [year, month] = selectedMonthYear.split('-');
        const date = new Date(year, month - 1);
        const monthYear = date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
        return `${report.month} ${report.year}`.includes(monthYear);
      })();

      return matchesSearch && matchesClient && matchesStatus && matchesDate;
    });
  }, [reports, searchTerm, selectedClient, selectedStatus, selectedMonthYear]);

  const handleRowSelect = (id) => {
    setSelectedRows(prev => {
      if (prev.includes(id)) {
        return prev.filter(rowId => rowId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleExport = () => {
    const selectedData = filteredReports.filter(report => selectedRows.includes(report.id));
    const dataToExport = selectedRows.length > 0 ? selectedData : filteredReports;
    
    // Create CSV content
    const headers = ['Site', 'Client', 'Month', 'Year', 'Payout Amounts', 'Status'];
    const csvContent = [
      headers.join(','),
      ...dataToExport.map(report => [
        report.site,
        report.client,
        report.month,
        report.year,
        report.payoutAmount.toFixed(2),
        report.status
      ].join(','))
    ].join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'reports.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="report-container">
      <div className="white-card">
        <div className="report-header">
          <h1>Reports</h1>
          <p className="subtitle">Filter and export reports with eligibility, duration, payout, and status details.</p>
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
              className="data-type-filter"
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
            >
              {clients.map(client => (
                <option key={client} value={client}>{client}</option>
              ))}
            </select>

            <select 
              className="data-type-filter"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>

            <input
              type="month"
              value={selectedMonthYear}
              onChange={(e) => setSelectedMonthYear(e.target.value)}
              className="month-filter"
              placeholder="Month/Year"
            />
          </div>
        </div>

        <div className="table-section">
          <div className="table-container">
            <div className="table-wrapper">
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th className="checkbox-column">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRows(filteredReports.map(report => report.id));
                            } else {
                              setSelectedRows([]);
                            }
                          }}
                          checked={selectedRows.length === filteredReports.length && filteredReports.length > 0}
                        />
                      </th>
                      <th>Site</th>
                      <th>Client</th>
                      <th>Month</th>
                      <th>Year</th>
                      <th>Payout Amounts</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map((report) => (
                      <tr key={report.id}>
                        <td className="checkbox-column">
                          <input
                            type="checkbox"
                            checked={selectedRows.includes(report.id)}
                            onChange={() => handleRowSelect(report.id)}
                          />
                        </td>
                        <td>{report.site}</td>
                        <td>{report.client}</td>
                        <td>{report.month}</td>
                        <td>{report.year}</td>
                        <td>${report.payoutAmount.toFixed(2)}</td>
                        <td>
                          <span className={`status-badge ${report.status.toLowerCase()}`}>
                            {report.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="action-bar">
          <button className="export-btn" onClick={handleExport}>
            Export
          </button>
        </div>
      </div>
    </div>
  );
};

export default Report; 