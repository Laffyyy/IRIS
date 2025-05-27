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
    // Simulate upload process
    setTimeout(() => {
      // Here you would typically make an API call to upload the file
      setIsUploading(false);
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

  return (
    <div className="employee-data-container">
      <div className="white-card">
        <div className="employee-data-header">
          <h1>Employee Data</h1>
          <p className="subtitle">Employee Data from Excel logs DA, attrition, and LOA</p>
        </div>

        <div className="upload-section">
          <div className="file-input-container">
            <input
              type="file"
              id="file-upload"
              className="choose-file"
              accept=".xlsx,.xls"
              onChange={(e) => handleFileSelect(e.target.files[0])}
              disabled={isUploading}
            />
            <label htmlFor="file-upload" className="file-label">Choose File</label>
            <span className="file-name">{fileName || 'No file chosen'}</span>
          </div>

          <div className="filters">
            <select
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
              className="site-filter"
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
              className="date-filter"
              disabled={isUploading}
            />

            <button className="template-btn" onClick={generateTemplate}>
              <FaFileDownload /> Get Template
            </button>
          </div>
        </div>

        <div className="preview-section">
          <h2>Preview</h2>
          <div className="table-container">
            <div className="table-wrapper">
              <div className="table-scroll">
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
                  <div className="no-data-message">
                    <p>No data available. Please upload an Excel file to view the data.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="action-bar">
            <button 
              className="upload-btn"
              onClick={handleUpload}
              disabled={isUploading || !selectedFile}
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeData;
