import React, { useState } from 'react';
import { FaFileDownload } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import './EmployeeData.css';

const EmployeeData = () => {
  const [siteFilter, setSiteFilter] = useState('All Sites');
  const [selectedDate, setSelectedDate] = useState('05/2025');
  const [excelData, setExcelData] = useState(null);
  const [fileName, setFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('LOA'); // Default active tab

  const handleFileSelect = (file) => {
    if (file) {
      setFileName(file.name);
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        setExcelData(json);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    setIsUploading(true);
    // Simulate upload process with the current active tab type
    setTimeout(() => {
      setIsUploading(false);
      // Here you would typically make an API call to upload the file
      // with the activeTab as the type
    }, 1000);
  };

  const generateTemplate = () => {
    const templateData = [
      ['Employee ID', 'Full Name', 'Department', 'Position', 'Type', 'Month/Year', 'Description', 'Team', 'LOB', 'Sub LOB']
    ];
    
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(templateData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    XLSX.writeFile(workbook, 'employee_data_template.xlsx');
  };

  const renderTabContent = () => {
    return (
      <div className="hr-employee-data-tab-content">
        <div className="table-container hr-employee-data-table-container">
          <div className="table-wrapper hr-employee-data-table-wrapper">
            <div className="table-scroll hr-employee-data-table-scroll">
              {excelData ? (
                <table>
                  <thead>
                    <tr>
                      {excelData[0]?.map((header, index) => (
                        <th key={index}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {excelData.slice(1).map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="no-data-message hr-employee-data-no-data">
                  <p>No data available. Please upload an Excel file to view {activeTab} data.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="employee-data-container hr-employee-data-container">
      <div className="white-card hr-employee-data-card">
        <div className="employee-data-header hr-employee-data-header">
          <h1>Employee Data</h1>
          <p className="subtitle hr-employee-data-subtitle">Employee Data from Excel logs DA, attrition, and LOA</p>
        </div>

        <div className="upload-section hr-employee-data-upload">
          <div className="file-input-container hr-employee-data-file-input">
            <input
              type="file"
              id="file-upload"
              className="choose-file hr-employee-data-choose-file"
              accept=".xlsx,.xls"
              onChange={(e) => handleFileSelect(e.target.files[0])}
              disabled={isUploading}
            />
            <label htmlFor="file-upload" className="file-label hr-employee-data-file-label">Choose File</label>
            <span className="file-name hr-employee-data-file-name">{fileName || 'No file chosen'}</span>
          </div>

          <div className="filters hr-employee-data-filters">
            <select
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
              className="site-filter hr-employee-data-site-filter"
              disabled={isUploading}
            >
              <option value="All Sites">All Sites</option>
              <option value="Site 1">Site 1</option>
              <option value="Site 2">Site 2</option>
              <option value="Site 3">Site 3</option>
            </select>

            <input
              type="month"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="date-filter hr-employee-data-date-filter"
              disabled={isUploading}
            />

            <button className="template-btn hr-employee-data-template-btn" onClick={generateTemplate}>
              <FaFileDownload /> Get Template
            </button>
          </div>
        </div>

        <div className="hr-employee-data-tabs-container">
          <div className="hr-employee-data-tabs">
            <button 
              className={`hr-employee-data-tab ${activeTab === 'LOA' ? 'active' : ''}`}
              onClick={() => setActiveTab('LOA')}
            >
              LOA
            </button>
            <button 
              className={`hr-employee-data-tab ${activeTab === 'Attrition' ? 'active' : ''}`}
              onClick={() => setActiveTab('Attrition')}
            >
              Attrition
            </button>
            <button 
              className={`hr-employee-data-tab ${activeTab === 'DA' ? 'active' : ''}`}
              onClick={() => setActiveTab('DA')}
            >
              DA
            </button>
          </div>

          {renderTabContent()}

          <div className="action-bar hr-employee-data-action-bar">
            <button 
              className="upload-btn hr-employee-data-upload-btn"
              onClick={handleUpload}
              disabled={isUploading || !selectedFile}
            >
              {isUploading ? 'Uploading...' : `Upload as ${activeTab}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeData;
