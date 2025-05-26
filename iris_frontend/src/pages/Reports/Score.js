import React, { useState } from 'react';
import { FaFileDownload } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import './Score.css';

const Score = () => {
  const [fileName, setFileName] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFileName(file.name);
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Transform the data to match our structure
        const headers = jsonData[0];
        const rows = jsonData.slice(1).map(row => {
          const obj = {};
          headers.forEach((header, index) => {
            obj[header.toLowerCase().replace(/\s+/g, '')] = row[index];
          });
          return obj;
        });
        
        setPreviewData(rows);
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
      ['Employee ID', 'Full Name', 'Department', 'Position', 'Month/Year', 'Attendance', 'Task Completion', 'Outcome/Feedback', 'Total Score', 'Evaluator Comments', 'Evaluator Name'],
      ['EMP1001', 'John Doe', 'HR', 'Specialist', 'May 2025', '90', '85', '250', 'Good performance', 'Good work', 'Evaluator 1']
    ];
    
    const csvContent = templateData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'scoresheet_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="score-container">
      <div className="white-card">
        <div className="score-header">
          <h1>Scoresheet</h1>
          <p className="subtitle">Upload scoresheets to view and manage employee performance data</p>
        </div>

        <div className="upload-section">
          <div className="file-input-container">
            <input
              type="file"
              id="file-upload"
              className="file-input"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            <button 
              className="choose-file-btn"
              onClick={() => document.getElementById('file-upload').click()}
              disabled={isUploading}
            >
              Choose File
            </button>
            <span className="file-name">{fileName || 'No file chosen'}</span>
          </div>

          <div className="filters">
            <button
              className="template-btn"
              onClick={generateTemplate}
              disabled={isUploading}
            >
              <FaFileDownload /> Get Template
            </button>
          </div>
        </div>

        <div className="preview-section">
          <h2>Preview</h2>
          <div className="table-container">
            <div className="table-wrapper">
              <div className="table-scroll">
                {previewData ? (
                  <table>
                    <thead>
                      <tr>
                        <th>Employee ID</th>
                        <th>Full Name</th>
                        <th>Department</th>
                        <th>Position</th>
                        <th>Month/Year</th>
                        <th>Attendance</th>
                        <th>Task Completion</th>
                        <th>Outcome/Feedback</th>
                        <th>Total Score</th>
                        <th>Evaluator Comments</th>
                        <th>Evaluator Name</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, index) => (
                        <tr key={index}>
                          <td>{row.employeeid}</td>
                          <td>{row.fullname}</td>
                          <td>{row.department}</td>
                          <td>{row.position}</td>
                          <td>{row.monthyear}</td>
                          <td>{row.attendance}</td>
                          <td>{row.taskcompletion}</td>
                          <td>{row.outcomefeedback}</td>
                          <td>{row.totalscore}</td>
                          <td>{row.evaluatorcomments}</td>
                          <td>{row.evaluatorname}</td>
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

export default Score;
