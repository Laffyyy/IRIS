import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import './EmployeeData.css';

const EmployeeData = () => {
  const [siteFilter, setSiteFilter] = useState('All Sites');
  const [selectedDate, setSelectedDate] = useState('05/2025');
  const [excelData, setExcelData] = useState(null);
  const [fileName, setFileName] = useState('');

  const handleUpload = (file) => {
    setFileName(file.name);
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
  };

  return (
    <div className="employee-data-container">
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
            onChange={(e) => handleUpload(e.target.files[0])}
          />
          <label htmlFor="file-upload" className="file-label">Choose File</label>
          <span className="file-name">{fileName || 'No file chosen'}</span>
        </div>

        <div className="filters">
          <select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            className="site-filter"
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
          />
        </div>

        <button className="upload-btn">Upload</button>
      </div>

      {excelData && (
        <div className="preview-section">
          <h2>Preview</h2>
          <div className="excel-preview">
            <table>
              <thead>
                <tr>
                  {excelData[0].map((header, index) => (
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
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeData;
