import React, { useState, useCallback } from 'react';
import { FaFileDownload, FaTimesCircle, FaUpload, FaTrash } from 'react-icons/fa';
import './EmployeeManagement.css';

const mockValidEmployees = [
  {
    id: 'EMP001',
    name: 'John Doe',
    hireDate: '2023-01-15',
    classification: 'Level 2',
    client: 'Client 1',
    lob: 'LoB Alpha',
    sublob: 'Sub-LoB 1',
    valid: true
  },
  {
    id: 'EMP002',
    name: 'Jane Smith',
    hireDate: '2023-02-20',
    classification: 'Level 3',
    client: 'Client 2',
    lob: 'LoB Beta',
    sublob: 'Sub-LoB 2',
    valid: true
  }
];
const mockInvalidEmployees = [
  {
    id: 'EMPX',
    name: 'Invalid User',
    hireDate: '2023-01-01',
    classification: 'Level 1',
    client: 'Client X',
    lob: 'LoB X',
    sublob: 'Sub-LoB X',
    valid: false,
    reason: 'Invalid Format'
  }
];

function BulkUploadUI({ requiredFields, templateFields, file, setFile, dragActive, setDragActive, handleFileChange, handleDrag, handleDrop }) {
  return (
    <div className="bulk-upload-form">
      <div
        className={`drop-zone ${dragActive ? 'active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="drop-zone-content">
          <p>Drag and drop your file here or</p>
          <p>CSV or Excel files only (max 5MB)</p>
          <input
            type="file"
            id="file-upload"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <label htmlFor="file-upload" className="browse-files-btn">
            Browse Files
          </label>
        </div>
      </div>
      {file && (
        <div className="file-preview">
          <span>📄 {file.name}</span>
          <button onClick={() => setFile(null)} className="remove-file-btn">
            <FaTimesCircle />
          </button>
        </div>
      )}
    </div>
  );
}

const EmployeeManagement = () => {
  const [activeOption, setActiveOption] = useState('option1');

  // Per Sub-LoB state
  const [perSubLobFile, setPerSubLobFile] = useState(null);
  const [perSubLobDragActive, setPerSubLobDragActive] = useState(false);
  const [perSubLobPreviewTab, setPerSubLobPreviewTab] = useState('valid');
  const [perSubLobValidEmployees, setPerSubLobValidEmployees] = useState([]);
  const [perSubLobInvalidEmployees, setPerSubLobInvalidEmployees] = useState([]);

  // Custom Add state
  const [customAddFile, setCustomAddFile] = useState(null);
  const [customAddDragActive, setCustomAddDragActive] = useState(false);
  const [customAddPreviewTab, setCustomAddPreviewTab] = useState('valid');
  const [customAddValidEmployees, setCustomAddValidEmployees] = useState([]);
  const [customAddInvalidEmployees, setCustomAddInvalidEmployees] = useState([]);

  // Handlers for Per Sub-LoB
  const handlePerSubLobDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setPerSubLobDragActive(true);
    } else if (e.type === 'dragleave') {
      setPerSubLobDragActive(false);
    }
  }, []);
  const handlePerSubLobDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setPerSubLobDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handlePerSubLobFile(e.dataTransfer.files[0]);
    }
  }, []);
  const handlePerSubLobFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handlePerSubLobFile(e.target.files[0]);
    }
  };
  const handlePerSubLobFile = (file) => {
    setPerSubLobFile(file);
    setPerSubLobValidEmployees(mockValidEmployees);
    setPerSubLobInvalidEmployees(mockInvalidEmployees);
    setPerSubLobPreviewTab('valid');
  };

  // Handlers for Custom Add
  const handleCustomAddDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setCustomAddDragActive(true);
    } else if (e.type === 'dragleave') {
      setCustomAddDragActive(false);
    }
  }, []);
  const handleCustomAddDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setCustomAddDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleCustomAddFile(e.dataTransfer.files[0]);
    }
  }, []);
  const handleCustomAddFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleCustomAddFile(e.target.files[0]);
    }
  };
  const handleCustomAddFile = (file) => {
    setCustomAddFile(file);
    setCustomAddValidEmployees(mockValidEmployees);
    setCustomAddInvalidEmployees(mockInvalidEmployees);
    setCustomAddPreviewTab('valid');
  };

  return (
    <div className="employee-management-container">
      <div className="white-card">
        <h1 className="page-title">Employee Management</h1>
        <p className="subtitle">Manage employee data and organizational structure</p>
        <div className="tab-buttons">
          <button className={activeOption === 'option1' ? 'active' : ''} onClick={() => setActiveOption('option1')}>Per Sub-LoB</button>
          <button className={activeOption === 'option2' ? 'active' : ''} onClick={() => setActiveOption('option2')}>Custom Add</button>
        </div>
        <div className="add-employees-section">
          {/* Left side: Option 1 or Option 2 card */}
          {activeOption === 'option1' ? (
            <div className="option option-1">
              <h2>Per Sub-LoB</h2>
              <p className="option-desc">Upload employees for a specific organizational unit</p>
              <form className="per-sublob-form">
                <label>Site</label>
                <select><option>Select Site</option></select>
                <label>Client</label>
                <select><option>Select Client</option></select>
                <label>Line of Business (LoB)</label>
                <select><option>Select LoB</option></select>
                <label>Sub-LoB</label>
                <select><option>Select Sub-LoB</option></select>
                <BulkUploadUI
                  requiredFields={["ID", "Full Name", "Hire Date", "Classification"]}
                  templateFields={["ID", "Full Name", "Hire Date", "Classification", "Client", "LoB", "Sub-LoB"]}
                  file={perSubLobFile}
                  setFile={setPerSubLobFile}
                  dragActive={perSubLobDragActive}
                  setDragActive={setPerSubLobDragActive}
                  handleFileChange={handlePerSubLobFileChange}
                  handleDrag={handlePerSubLobDrag}
                  handleDrop={handlePerSubLobDrop}
                />
                {(perSubLobValidEmployees.length > 0 || perSubLobInvalidEmployees.length > 0) && (
                  <div className="upload-preview">
                    <div className="preview-tabs">
                      <button
                        className={`preview-tab ${perSubLobPreviewTab === 'valid' ? 'active' : ''}`}
                        onClick={() => setPerSubLobPreviewTab('valid')}
                        disabled={perSubLobValidEmployees.length === 0}
                      >
                        Valid ({perSubLobValidEmployees.length})
                      </button>
                      <button
                        className={`preview-tab ${perSubLobPreviewTab === 'invalid' ? 'active' : ''}`}
                        onClick={() => setPerSubLobPreviewTab('invalid')}
                        disabled={perSubLobInvalidEmployees.length === 0}
                      >
                        Invalid ({perSubLobInvalidEmployees.length})
                      </button>
                    </div>
                    <div className="preview-content">
                      {perSubLobPreviewTab === 'valid' && perSubLobValidEmployees.length > 0 && (
                        <div className="valid-users-table">
                          <table>
                            <thead>
                              <tr>
                                <th>Employee ID</th>
                                <th>Full Name</th>
                                <th>Hire Date</th>
                                <th>Classification</th>
                                <th>Client</th>
                                <th>LoB</th>
                                <th>Sub-LoB</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {perSubLobValidEmployees.map((emp, idx) => (
                                <tr key={`valid-${idx}`}>
                                  <td>{emp.id}</td>
                                  <td>{emp.name}</td>
                                  <td>{emp.hireDate}</td>
                                  <td>{emp.classification}</td>
                                  <td>{emp.client}</td>
                                  <td>{emp.lob}</td>
                                  <td>{emp.sublob}</td>
                                  <td>
                                    <button className="delete-btn" onClick={() => {}}><FaTrash size={12} /> Delete</button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      {perSubLobPreviewTab === 'invalid' && perSubLobInvalidEmployees.length > 0 && (
                        <div className="invalid-users-table">
                          <table>
                            <thead>
                              <tr>
                                <th>Reason</th>
                                <th>Employee ID</th>
                                <th>Full Name</th>
                                <th>Hire Date</th>
                                <th>Classification</th>
                                <th>Client</th>
                                <th>LoB</th>
                                <th>Sub-LoB</th>
                              </tr>
                            </thead>
                            <tbody>
                              {perSubLobInvalidEmployees.map((emp, idx) => (
                                <tr key={`invalid-${idx}`}>
                                  <td className="reason-cell">{emp.reason}</td>
                                  <td>{emp.id}</td>
                                  <td>{emp.name}</td>
                                  <td>{emp.hireDate}</td>
                                  <td>{emp.classification}</td>
                                  <td>{emp.client}</td>
                                  <td>{emp.lob}</td>
                                  <td>{emp.sublob}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <button type="button" className="upload-btn" disabled={!perSubLobFile}>Upload Employees</button>
              </form>
            </div>
          ) : (
            <div className="option option-2">
              <h2>Custom Add</h2>
              <p className="option-desc">Upload employees with complete organizational data</p>
              <BulkUploadUI
                requiredFields={["ID", "Full Name", "Hire Date", "Classification", "Client", "LoB", "Sub-LoB", "Supervisor ID", "Manager ID"]}
                templateFields={["ID", "Full Name", "Hire Date", "Classification", "Client", "LoB", "Sub-LoB", "Supervisor ID", "Manager ID"]}
                file={customAddFile}
                setFile={setCustomAddFile}
                dragActive={customAddDragActive}
                setDragActive={setCustomAddDragActive}
                handleFileChange={handleCustomAddFileChange}
                handleDrag={handleCustomAddDrag}
                handleDrop={handleCustomAddDrop}
              />
              {customAddFile && (customAddValidEmployees.length > 0 || customAddInvalidEmployees.length > 0) && (
                <div className="upload-preview">
                  <div className="preview-tabs">
                    <button
                      className={`preview-tab ${customAddPreviewTab === 'valid' ? 'active' : ''}`}
                      onClick={() => setCustomAddPreviewTab('valid')}
                      disabled={customAddValidEmployees.length === 0}
                    >
                      Valid ({customAddValidEmployees.length})
                    </button>
                    <button
                      className={`preview-tab ${customAddPreviewTab === 'invalid' ? 'active' : ''}`}
                      onClick={() => setCustomAddPreviewTab('invalid')}
                      disabled={customAddInvalidEmployees.length === 0}
                    >
                      Invalid ({customAddInvalidEmployees.length})
                    </button>
                  </div>
                  <div className="preview-content">
                    {customAddPreviewTab === 'valid' && customAddValidEmployees.length > 0 && (
                      <div className="valid-users-table">
                        <table>
                          <thead>
                            <tr>
                              <th>Employee ID</th>
                              <th>Full Name</th>
                              <th>Hire Date</th>
                              <th>Classification</th>
                              <th>Client</th>
                              <th>LoB</th>
                              <th>Sub-LoB</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {customAddValidEmployees.map((emp, idx) => (
                              <tr key={`valid-${idx}`}>
                                <td>{emp.id}</td>
                                <td>{emp.name}</td>
                                <td>{emp.hireDate}</td>
                                <td>{emp.classification}</td>
                                <td>{emp.client}</td>
                                <td>{emp.lob}</td>
                                <td>{emp.sublob}</td>
                                <td>
                                  <button className="delete-btn" onClick={() => {}}><FaTrash size={12} /> Delete</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {customAddPreviewTab === 'invalid' && customAddInvalidEmployees.length > 0 && (
                      <div className="invalid-users-table">
                        <table>
                          <thead>
                            <tr>
                              <th>Reason</th>
                              <th>Employee ID</th>
                              <th>Full Name</th>
                              <th>Hire Date</th>
                              <th>Classification</th>
                              <th>Client</th>
                              <th>LoB</th>
                              <th>Sub-LoB</th>
                            </tr>
                          </thead>
                          <tbody>
                            {customAddInvalidEmployees.map((emp, idx) => (
                              <tr key={`invalid-${idx}`}>
                                <td className="reason-cell">{emp.reason}</td>
                                <td>{emp.id}</td>
                                <td>{emp.name}</td>
                                <td>{emp.hireDate}</td>
                                <td>{emp.classification}</td>
                                <td>{emp.client}</td>
                                <td>{emp.lob}</td>
                                <td>{emp.sublob}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <button type="button" className="upload-btn" disabled={!customAddFile}>Upload Employees</button>
            </div>
          )}
          {/* Right side: Employee List table always visible */}
          <div className="employee-list-section">
            <h2 className="directory-title">Employee Directory</h2>
            <p className="directory-desc">View and manage all employees in the system</p>
            <div className="search-filter-row">
              <input type="text" placeholder="Search employees..." className="search-input" />
              <button className="filter-btn">Filter</button>
            </div>
            <table className="employee-table">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Full Name</th>
                  <th>Hire Date</th>
                  <th>Classification</th>
                  <th>Client</th>
                  <th>LoB</th>
                  <th>Sub-LoB</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>EMP001</td>
                  <td>John Doe</td>
                  <td>2023-01-15</td>
                  <td><span className="badge level2">Level 2</span></td>
                  <td>Client 1</td>
                  <td>LoB Alpha</td>
                  <td>Sub-LoB 1</td>
                </tr>
                <tr>
                  <td>EMP002</td>
                  <td>Jane Smith</td>
                  <td>2023-02-20</td>
                  <td><span className="badge level3">Level 3</span></td>
                  <td>Client 2</td>
                  <td>LoB Beta</td>
                  <td>Sub-LoB 2</td>
                </tr>
                <tr>
                  <td>EMP003</td>
                  <td>Mike Johnson</td>
                  <td>2023-03-10</td>
                  <td><span className="badge support">Support</span></td>
                  <td>Client 1</td>
                  <td>LoB Alpha</td>
                  <td>Sub-LoB 1</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeManagement; 