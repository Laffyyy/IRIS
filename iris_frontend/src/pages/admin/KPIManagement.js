// KPIManagement.js
import React, { useState, useCallback, useEffect } from 'react';
import './KPIManagement.css';
import { FaTrash, FaPencilAlt, FaTimes, FaPlus, FaTimesCircle, FaUpload, FaFileDownload, FaSearch } from 'react-icons/fa';

const BASE_URL = 'http://localhost:3000/api/kpis';  // Change from /admin/kpis to /api/kpis

const KPIManagement = () => {

  const isDuplicateKPI = (name) => {
    if (!name) return false;
    
    // Check if any existing KPI has the same name (case-insensitive)
    return kpis.some(existingKpi => 
      existingKpi?.dKPI_Name?.toLowerCase().trim() === name.toLowerCase().trim()
    );
  };
  
  const [activeTab, setActiveTab] = useState('addKPI');
  const [editingKpi, setEditingKpi] = useState(null);
  const [kpis, setKpis] = useState([]);
  
  // Add this at the top with other state declarations
  const [descriptionCount, setDescriptionCount] = useState(0);
  const MAX_CHARS = 150;
  const MAX_NAME_LENGTH = 30;
  

  // Form states
  const [kpiName, setKpiName] = useState('');
  const [category, setCategory] = useState('');
  const [behavior, setBehavior] = useState('');
  const [description, setDescription] = useState('');
  
  // Edit modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentKpi, setCurrentKpi] = useState(null);

  // Add bulk upload states
  const [uploadMethod, setUploadMethod] = useState('individual');
  const [bulkKpis, setBulkKpis] = useState([]);
  const [invalidKpis, setInvalidKpis] = useState([]);
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [previewTab, setPreviewTab] = useState('valid');
  const [individualPreview, setIndividualPreview] = useState([]);

  const categories = ['Compliance', 'Customer Experience', 'Employee Performance', 'Finance', 'Healthcare', 'Logistics', 'Operational Efficiency', 'Sales', 'Tech'];
  const behaviors = ['Lower the Better', 'Higher the Better'];

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [behaviorFilter, setBehaviorFilter] = useState('');

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedKpi, setSelectedKpi] = useState(null);
  
  const ALLOWED_FILE_PATTERN = /^kpi_upload_\d{8}\.csv$/;

  const [isDuplicateName, setIsDuplicateName] = useState(false);

  const handleFormSubmit = () => {
  if (editingKpi) {
    handleUpdateKpi();
  } else {
    // Check for duplicates in existing KPIs
    if (isDuplicateKPI(kpiName)) {
      alert('A KPI with this name already exists. Please use a different name.');
      return;
    }

    // Add to preview by appending to existing array
    setIndividualPreview([
      ...individualPreview,
      {
        name: kpiName,
        category: category,
        behavior: behavior,
        description: description
      }
    ]);
    // Clear form for next entry
    setKpiName('');
    setCategory('');
    setBehavior('');
    setDescription('');
    setDescriptionCount(0);
  }
};

  // Handle file drop for bulk upload
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];

      // Filename validation
      if (!ALLOWED_FILE_PATTERN.test(file.name)) {
        alert('Invalid filename format. Please use: kpi_upload_YYYYMMDD.csv');
        return;
      }

      // File type validation
      if (!file.name.endsWith('.csv')) {
        alert('Please upload a CSV file');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        const kpisToValidate = processFileContent(text);
        
        if (kpisToValidate.length === 0) {
          // processFileContent returns empty array if validation fails
          resetBulkUploadState();
          return;
        }

        const validKpis = [];
        const invalidKpis = [];
        const seenNames = new Set();

        // Validate each KPI
        kpisToValidate.forEach(kpi => {
          let isValid = true;
          let reason = '';

          if (!kpi.name) {
            isValid = false;
            reason = 'Missing KPI name';
          } else if (isDuplicateKPI(kpi.name)) {
            isValid = false;
            reason = 'KPI name already exists';
          } else if (seenNames.has(kpi.name.toLowerCase())) {
            isValid = false;
            reason = 'Duplicate KPI name in CSV file';
          } else if (!kpi.category || !kpi.behavior) {
            isValid = false;
            reason = 'Missing required fields';
          } else if (!categories.includes(capitalizeFirstLetter(kpi.category))) {
            isValid = false;
            reason = 'Invalid category';
          } else if (!behaviors.includes(capitalizeFirstLetter(kpi.behavior))) {
            isValid = false;
            reason = 'Invalid behavior';
          }

          if (isValid) {
            validKpis.push({
              ...kpi,
              category: capitalizeFirstLetter(kpi.category),
              behavior: capitalizeFirstLetter(kpi.behavior)
            });
            seenNames.add(kpi.name.toLowerCase());
          } else {
            invalidKpis.push({
              ...kpi,
              reason
            });
          }
        });

        setFile(file);
        setBulkKpis(validKpis);
        setInvalidKpis(invalidKpis);
        setPreviewTab(invalidKpis.length > 0 ? 'invalid' : 'valid');
      };

      reader.readAsText(file);
    }
  }, [categories, behaviors, isDuplicateKPI]);

  const handleFileChange = (e) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        
        // Add filename validation
        if (!ALLOWED_FILE_PATTERN.test(file.name)) {
          alert('Invalid filename format. Please use: kpi_upload_YYYYMMDD.csv');
          // Reset the file input
          e.target.value = '';
          return;
        }
        
        handleFile(file);
      }
    };

  const handleFile = async (file) => {
    try {

      if (!ALLOWED_FILE_PATTERN.test(file.name)) {
      alert('Invalid filename format. Please use: kpi_upload_YYYYMMDD.csv');
      resetBulkUploadState();
      return;
    }
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target.result;
        const kpisToValidate = processFileContent(text);
        
        const validKpis = [];
        const invalidKpis = [];
        const seenNames = new Set();

        kpisToValidate.forEach(kpi => {
          let isValid = true;
          let reason = '';

          if (!kpi.name) {
            isValid = false;
            reason = 'Missing KPI name';
          } else if (isDuplicateKPI(kpi.name)) {
            isValid = false;
            reason = 'KPI name already exists';
          } else if (seenNames.has(kpi.name.toLowerCase())) {
            isValid = false;
            reason = 'Duplicate KPI name in CSV file';
          } else if (!kpi.category || !kpi.behavior) {
            isValid = false;
            reason = 'Missing required fields';
          } else if (!categories.includes(capitalizeFirstLetter(kpi.category))) {
            isValid = false;
            reason = 'Invalid category';
          } else if (!behaviors.includes(capitalizeFirstLetter(kpi.behavior))) {
            isValid = false;
            reason = 'Invalid behavior';
          }

          if (isValid) {
            validKpis.push({
              ...kpi,
              category: capitalizeFirstLetter(kpi.category),
              behavior: capitalizeFirstLetter(kpi.behavior)
            });
            seenNames.add(kpi.name.toLowerCase());
          } else {
            invalidKpis.push({
              ...kpi,
              reason
            });
          }
        });

        setFile(file);
        setBulkKpis(validKpis);
        setInvalidKpis(invalidKpis);
        setPreviewTab(invalidKpis.length > 0 ? 'invalid' : 'valid');
      };

      reader.readAsText(file);
    } catch (error) {
      console.error('Error processing file:', error);
      resetBulkUploadState();
      alert('Error processing file. Please check the file format.');
    }
  };

  // Remove uploaded file
  const removeFile = () => {
      resetBulkUploadState();
  };

  // Generate template for bulk upload
  const generateTemplate = () => {
    const csvHeader = "KPI Name,Category,Behavior,Description,,,Valid Input Reference";
    const exampleData = [
      "Revenue Growth,Financial,Higher the Better,Measures growth in total revenue,,,Valid Categories: Compliance, Customer Experience, Employee Performance, Finance, Healthcare, Logistics, Operational Efficiency, Sales, Tech",
      "Customer Satisfaction,Customer,Higher the Better,Measures overall customer satisfaction,,,Valid Behaviors: Lower the Better, Higher the Better",
      "Employee Turnover,Employee,Decrease,Tracks employee turnover rate"
    ];

    // Combine header and data rows
    const fileContent = [csvHeader, ...exampleData].join('\n');

    const today = new Date();
    const dateString = today.getFullYear().toString() +
        (today.getMonth() + 1).toString().padStart(2, '0') +
        today.getDate().toString().padStart(2, '0');
    
    const filename = `kpi_upload_${dateString}.csv`;

    const blob = new Blob([fileContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const processFileContent = (text) => {
    try {
      // Split into rows and filter out empty rows and notes
      const rows = text.split('\n')
        .filter(row => row.trim() !== '' && !row.startsWith(',,,'));

      // Get headers from first row
      const headers = rows[0].split(',').map(header => header.trim());
      
      // Validate CSV structure
      const structureValidation = validateCSVStructure(headers);
      if (!structureValidation.isValid) {
        alert(structureValidation.error);
        return [];
      }

      // Process data rows (skip header row)
      const dataRows = rows.slice(1)
        .filter(row => row.trim()) // Remove empty rows
        .map(row => {
          const columns = row.split(',');
          // Only process rows that have data in the KPI Name column
          if (columns[0]?.trim()) {
            return {
              name: columns[0]?.trim(),
              category: columns[1]?.trim(),
              behavior: columns[2]?.trim(),
              description: columns[3]?.trim()
            };
          }
          return null;
        })
        .filter(row => row !== null); // Remove null entries

      return dataRows;
    } catch (error) {
      console.error('Error processing CSV:', error);
      alert('Error processing file. Please check the file format.');
      return [];
    }
  };

  // Add this function to validate CSV structure
  const validateCSVStructure = (headers) => {
    const requiredColumns = ['KPI Name', 'Category', 'Behavior', 'Description'];
    const missingColumns = requiredColumns.filter(col => 
      !headers.some(header => header.trim() === col)
    );

    if (missingColumns.length > 0) {
      return {
        isValid: false,
        error: `Missing required columns: ${missingColumns.join(', ')}`
      };
    }
    return { isValid: true };
  };

  const handleAddKpi = async () => {
    try {
        const promises = individualPreview.map(async kpi => {
            const kpiData = {
                dKPI_Name: kpi.name,
                dCategory: kpi.category,
                dCalculationBehavior: kpi.behavior,
                dDescription: kpi.description,
                dCreatedBy: '2505170018'
            };

            // Updated endpoint to match backend routes
            const response = await fetch(BASE_URL, {  // Changed from api/kpi/create
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(kpiData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Failed to add KPI: ${errorData.message || response.statusText}`);
            }

            return response.json();
        });

        await Promise.all(promises);

        // Updated endpoint to match backend routes
        const refreshResponse = await fetch('http://localhost:3000/api/kpis');  // Changed from api/kpi/getAll
        if (!refreshResponse.ok) {
            throw new Error('Failed to refresh KPI list');
        }
        const updatedKpis = await refreshResponse.json();
        setKpis(updatedKpis);
        setCategoryFilter('');
        setBehaviorFilter('');
        setSearchQuery('');

        resetForm();
        setActiveTab('viewKPIs');
        alert('KPIs added successfully!');
    } catch (error) {
        console.error('Error details:', error);
        alert(`Failed to add KPIs: ${error.message}`);
    }
};

  // Add useEffect for fetching KPIs
  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        const response = await fetch(BASE_URL);
        if (response.ok) {
          const data = await response.json();
          setKpis(data);
        }
      } catch (error) {
        console.error('Error fetching KPIs:', error);
      }
    };

    fetchKPIs();
  }, []);

  // Add this useEffect to revalidate bulk KPIs whenever existing KPIs change
  useEffect(() => {
    if (bulkKpis.length > 0 || invalidKpis.length > 0) {
      revalidateBulkKPIs();
    }
  }, [kpis]); // This will trigger when kpis state changes

  // Add this new function to handle revalidation
  const revalidateBulkKPIs = () => {
      const validKpis = [];
      const newInvalidKpis = [];
      const seenNames = new Set();

      const kpisToValidate = [...bulkKpis, ...invalidKpis];

      kpisToValidate.forEach(kpi => {
        let isValid = true;
        let reason = '';

        // Check required fields
        if (!kpi.name || !kpi.category || !kpi.behavior) {
          isValid = false;
          reason = 'Missing required fields';
        }
        // Check for duplicates within CSV file
        else if (seenNames.has(kpi.name.toLowerCase())) {
          isValid = false;
          reason = 'Duplicate KPI name in CSV file';
        }
        // Check for duplicates with existing KPIs - only check name
        else if (isDuplicateKPI(kpi.name)) {
          isValid = false;
          reason = 'KPI name already exists in system';
        }
        // Validate category
        else if (!categories.includes(capitalizeFirstLetter(kpi.category))) {
          isValid = false;
          reason = 'Invalid category';
        }
        // Validate behavior
        else if (!behaviors.includes(capitalizeFirstLetter(kpi.behavior))) {
          isValid = false;
          reason = 'Invalid behavior';
        }

        if (isValid) {
          validKpis.push({
            ...kpi,
            category: capitalizeFirstLetter(kpi.category),
            behavior: capitalizeFirstLetter(kpi.behavior)
          });
          seenNames.add(kpi.name.toLowerCase());
        } else {
          newInvalidKpis.push({
            ...kpi,
            reason
          });
        }
      });

      setBulkKpis(validKpis);
      setInvalidKpis(newInvalidKpis);
      
      if (newInvalidKpis.length > 0 && validKpis.length === 0) {
        setPreviewTab('invalid');
      } else if (validKpis.length > 0 && newInvalidKpis.length === 0) {
        setPreviewTab('valid');
      }
    };

  const handleUpdateKpi = async () => {
    if (kpiName?.trim() && category && behavior) {
      try {
        const updateData = {
          dKPI_Name: kpiName,
          dCategory: capitalizeFirstLetter(category),
          dDescription: description,
          dCalculationBehavior: capitalizeFirstLetter(behavior)
        };

        const response = await fetch(`http://localhost:3000/api/kpis/${editingKpi.dKPI_ID}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(updateData)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.message || `Server error: ${response.status}`);
        }

        // Fetch updated KPI list
        const refreshResponse = await fetch('http://localhost:3000/api/kpis');
        const updatedKpis = await refreshResponse.json();
        setKpis(updatedKpis);

        // Reset all states
        resetForm();
        setActiveTab('viewKPIs');
        setUploadMethod('individual');
        setBulkKpis([]);
        setInvalidKpis([]);
        setFile(null);
        
        alert('KPI updated successfully!');

      } catch (error) {
        console.error('Error updating KPI:', error);
        alert(`Failed to update KPI: ${error.message}`);
      }
    }
  };

  const handleEditClick = async (kpiId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/kpis/${kpiId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const kpi = await response.json();
      
      // Set the form data and editing state
      setEditingKpi(kpi);
      setKpiName(kpi.dKPI_Name);
      setCategory(kpi.dCategory);
      setBehavior(kpi.dCalculationBehavior);
      setDescription(kpi.dDescription || '');
      setDescriptionCount(kpi.dDescription ? kpi.dDescription.length : 0);
      
      // Force individual upload method when editing
      setUploadMethod('individual');
      setActiveTab('addKPI');
      
      // Clear any bulk upload state
      setBulkKpis([]);
      setInvalidKpis([]);
      setFile(null);
      
    } catch (error) {
      console.error('Error fetching KPI for edit:', error);
      alert('Failed to load KPI data for editing. Please try again.');
    }
  };

  const handleSave = async (updatedKpi) => {
      try {
        // Set the form values from the currentKpi
        setKpiName(updatedKpi.name);
        setCategory(updatedKpi.category);
        setBehavior(updatedKpi.behavior);
        setDescription(updatedKpi.description);
        setEditingKpi({ dKPI_ID: updatedKpi.id }); // Set the ID for update

        // Call handleUpdateKpi which has the API call logic
        await handleUpdateKpi();
        
        // Close the modal
        setEditModalOpen(false);
        setCurrentKpi(null);
        
      } catch (error) {
        console.error('Error saving KPI:', error);
        alert('Failed to save changes. Please try again.');
      }
    };

  // Handle adding individual KPI to preview
  const handleAddToList = () => {
      if (kpiName.trim() && category && behavior) {
        setIndividualPreview([{
          name: kpiName,
          category: category,
          behavior: behavior,
          description: description
        }]);
      }
    };
    
    // Handle bulk upload submission
    const handleBulkUpload = async () => {
      try {
          // Create array of promises for each valid KPI
          const promises = bulkKpis.map(kpi => {
              const kpiData = {
                  dKPI_Name: kpi.name,
                  dCategory: kpi.category,
                  dCalculationBehavior: kpi.behavior,
                  dDescription: kpi.description || '',
                  dCreatedBy: '2505170018'
              };

              return fetch('http://localhost:3000/api/kpis', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                      'Accept': 'application/json'
                  },
                  body: JSON.stringify(kpiData)
              });
          });

          const responses = await Promise.all(promises);
          
          const failedResponses = responses.filter(response => !response.ok);
          if (failedResponses.length > 0) {
              throw new Error(`Failed to add ${failedResponses.length} KPIs`);
          }

          // Fetch updated KPI list
          const refreshResponse = await fetch('http://localhost:3000/api/kpis');
          if (!refreshResponse.ok) {
              throw new Error('Failed to refresh KPI list');
          }
          const updatedKpis = await refreshResponse.json();
          setKpis(updatedKpis);

          // Reset all bulk upload related states
          resetBulkUploadState();
          setActiveTab('viewKPIs');
          
          alert(`Successfully added ${bulkKpis.length} KPIs`);

      } catch (error) {
          console.error('Bulk upload error:', error);
          alert(`Failed to upload KPIs: ${error.message}`);
      }
  };

  const resetBulkUploadState = () => {
    setBulkKpis([]);
    setInvalidKpis([]);
    setFile(null);
    setPreviewTab('valid');
    
    // Reset the file input element
    const fileInput = document.getElementById('file-upload');
    if (fileInput) {
        fileInput.value = '';
    }
};
    
  const handleDeleteKpi = async (kpiId) => {
    if (window.confirm('Are you sure you want to delete this KPI?')) {
      try {
        const response = await fetch(`http://localhost:3000/api/kpis/${kpiId}`, {
          method: 'DELETE',
        });
  
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
  
        setKpis(kpis.filter(kpi => kpi.dKPI_ID !== kpiId));
      } catch (error) {
        console.error('Error deleting KPI:', error);
        alert('Failed to delete KPI. Please try again.');
      }
    }
  };

  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  };

  

  const handleDescriptionChange = (e) => {
    const text = e.target.value;
    if (text.length <= MAX_CHARS) {
      setDescription(text);
      setDescriptionCount(text.length);
    }
  };

  const handleKpiNameChange = (e) => {
    const text = e.target.value;
    if (text.length <= MAX_NAME_LENGTH) {
      setKpiName(text);
      // Check for duplicates whenever name changes
      setIsDuplicateName(isDuplicateKPI(text));
    }
  };

  const handleTabSwitch = (newTab) => {
  const hasUnsavedChanges = kpiName || category || behavior || individualPreview.length > 0;

  if (hasUnsavedChanges) {
    const confirmed = window.confirm('You have unsaved changes. Do you want to discard them?');
    if (confirmed) {
      resetForm();
      setActiveTab(newTab);
    }
  } else {
    setActiveTab(newTab);
  }
};

  const resetForm = () => {
    setKpiName('');
    setDescriptionCount(0);
    setCategory('');
    setBehavior('');
    setDescription('');
    setCurrentKpi(null);
    setEditingKpi(null); // Add this line
    setIndividualPreview([]);
  };
  

  const removeFromPreview = (index) => {
  setIndividualPreview(individualPreview.filter((_, i) => i !== index));
  };

  const renderFilterControls = () => {
    return (
      <div className="filter-controls">
      <div className="search-bar-container">
        <div className="search-bar">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search KPIs..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
              setSelectedKpi(null);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => {
              // Small delay to allow clicking on suggestions
              setTimeout(() => setShowSuggestions(false), 200);
              }}
          />
           {searchQuery && (
            <button 
              className="clear-search"
              onClick={() => {
                setSearchQuery('');
                setSelectedKpi(null);
              }}
            >
              <FaTimes />
            </button>
          )}
        </div>
        {showSuggestions && searchQuery && (
          <div className="suggestions-dropdown">
            {getKpiSuggestions().map(kpi => (
              <div
                key={kpi.id}
                className="suggestion-item"
                onClick={() => {
                  setSelectedKpi(kpi.id);
                  setSearchQuery(kpi.name);
                  setShowSuggestions(false);
                }}
              >
                {kpi.name}
              </div>
         ))}
          </div>
        )}
      </div>
      <div className="filter-selects">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={`filter-${cat}`} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={behaviorFilter}
            onChange={(e) => setBehaviorFilter(e.target.value)}
          >
            <option value="">All Behaviors</option>
            {behaviors.map(beh => (
              <option key={`filter-${beh}`} value={beh}>{beh}</option>
            ))}
          </select>
        </div>
      </div>
    );
  };

  const getKpiSuggestions = () => {
      if (!searchQuery) return [];
      
      return kpis.filter(kpi => 
        kpi.dKPI_Name.toLowerCase().startsWith(searchQuery.toLowerCase())
      ).map(kpi => ({
        id: kpi.dKPI_ID,
        name: kpi.dKPI_Name
      }));
    };

    // Add this function to filter KPIs
  const getFilteredKPIs = () => {
    return kpis.filter(kpi => {
      // If a specific KPI is selected from dropdown
      if (selectedKpi) {
        return kpi.dKPI_ID === selectedKpi;
      }

      // Search query filter - using startsWith() for KPI names
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = kpi.dKPI_Name?.toLowerCase().startsWith(query);

        if (!matchesName) {
          return false;
        }
      }

      // Category filter
      if (categoryFilter && kpi.dCategory !== categoryFilter) {
        return false;
      }

      // Behavior filter
      if (behaviorFilter && kpi.dCalculationBehavior !== behaviorFilter) {
        return false;
      }

      return true;
    });
  };

  const handleKeyDown = (e) => {
      if (e.key === 'Enter' && searchQuery) {
        // Apply the search filter when Enter is pressed
        setShowSuggestions(false);
      } else if (e.key === 'Escape') {
        // Clear search when Escape is pressed
        setSearchQuery('');
        setShowSuggestions(false);
        setSelectedKpi(null);
      } else if (e.key === 'ArrowDown' && showSuggestions) {
        // Prevent cursor movement in input
        e.preventDefault();
      }
    };


  

  return (
    <div className="kpi-management-container">
      <div className="white-card">
        <div className="kpi-management-header">
          <h1>KPI Management</h1>
          <p className="subtitle">Manage your Key Performance Indicators</p>
        </div>

        <div className="tab-container">
          <div 
            className={`tab ${activeTab === 'addKPI' ? 'active' : ''}`}
            onClick={() => setActiveTab('addKPI')}
          >
            {editingKpi ? 'Edit KPI' : 'Add New KPI'}
          </div>
          <div 
            className={`tab ${activeTab === 'viewKPIs' ? 'active' : ''}`}
            onClick={() => {
              // Only reset if there's no data being edited
              if (!kpiName && !category && !behavior && individualPreview.length === 0) {
                resetForm();
              }
              setActiveTab('viewKPIs');
            }}
          >
            Existing KPIs
          </div>
        </div>

        <div className={`tab-content ${activeTab === 'addKPI' ? 'active' : ''}`}>
          <div className="form-section">
            <p className="modal-subtitle">Choose how you want to add new KPIs.</p>
            <div className="upload-method-tabs">
              <button
                className={`tab-btn ${uploadMethod === 'individual' ? 'active' : ''}`}
                onClick={() => setUploadMethod('individual')}
              >
                Individual Upload
              </button>
              <button
                className={`tab-btn ${uploadMethod === 'bulk' ? 'active' : ''}`}
                onClick={() => setUploadMethod('bulk')}
              >
                Bulk Upload
              </button>
            </div>

            {uploadMethod === 'individual' ? (
              <div className="individual-upload-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>KPI Name</label>
                    <input
                      type="text"
                      value={kpiName}
                  onChange={handleKpiNameChange}
                  placeholder="Enter KPI name"
                  maxLength={MAX_NAME_LENGTH}
                  className={isDuplicateName ? 'duplicate-error' : ''}
                    />
                    {isDuplicateName && (
                      <span className="error-message">This KPI name already exists</span>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      disabled={isDuplicateName}
                    >
                     <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={`category-${cat}`} value={cat}>{cat}</option>
                    ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Calculation Behavior</label>
                    <select
                      value={behavior}
                      onChange={(e) => setBehavior(e.target.value)}
                      disabled={isDuplicateName}
                    >
                      <option value="">Select behavior</option>
                      {behaviors.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what this KPI measures and why it's important"
                    rows="3"
                    disabled={isDuplicateName}
                  />
                </div>

                <button 
                  onClick={handleFormSubmit}
                  className="add-to-list-btn"
                  disabled={!kpiName.trim() || !category || !behavior}
                >
                  {editingKpi ? 'Save Changes' : '+ Add New KPI'}
                </button>

                {individualPreview.length > 0 && (
                  <div className="individual-preview">
                    <table>
                      <thead>
                        <tr>
                          <th>KPI Name</th>
                          <th>Category</th>
                          <th>Behavior</th>
                          <th>Description</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {individualPreview.map((kpi, index) => (
                          <tr key={`individual-preview-${index}`}>
                            <td>{kpi.name}</td>
                            <td>{kpi.category}</td>
                            <td>{kpi.behavior}</td>
                            <td>{kpi.description}</td>
                            <td>
                              <button 
                                onClick={() => removeFromPreview(index)} 
                                className="delete-btn"
                              >
                                <FaTrash size={12} /> Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="modal-actions">
                  <button 
                    onClick={handleAddKpi} 
                    className="save-btn"
                    disabled={individualPreview.length === 0}
                  >
                    Add KPI
                  </button>
                </div>
              </div>
            ) : (
              <div className="bulk-upload-form">
                <div className="bulk-upload-actions">
                  <h3><FaUpload /> Upload KPIs</h3>
                  <button onClick={generateTemplate} className="generate-template-btn">
                    <FaFileDownload /> Generate Template
                  </button>
                </div>

                <div
                  className={`drop-zone ${dragActive ? 'active' : ''}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <div className="drop-zone-content">
                      <p>Drag and drop your CSV file here</p>
                      <p>File name format: kpi_upload_YYYYMMDD.csv</p>
                      <p>Example: kpi_upload_20250520.csv</p>
                      <p>Maximum file size: 5MB</p>
                      <input
                          type="file"
                          id="file-upload"
                          accept=".csv"
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
                    <button onClick={removeFile} className="remove-file-btn">
                      <FaTimesCircle />
                    </button>
                  </div>
                )}

                {(bulkKpis.length > 0 || invalidKpis.length > 0) && (
                  <div className="upload-preview">
                    <div className="preview-tabs">
                      <button
                        className={`preview-tab ${previewTab === 'valid' ? 'active' : ''}`}
                        onClick={() => setPreviewTab('valid')}
                        disabled={bulkKpis.length === 0}
                      >
                        Valid ({bulkKpis.length})
                      </button>
                      <button
                        className={`preview-tab ${previewTab === 'invalid' ? 'active' : ''}`}
                        onClick={() => setPreviewTab('invalid')}
                        disabled={invalidKpis.length === 0}
                      >
                        Invalid ({invalidKpis.length})
                      </button>
                    </div>

                    <div className="preview-content">
                      {previewTab === 'valid' && bulkKpis.length > 0 && (
                        <div className="valid-kpis-table">
                          <table>
                            <thead>
                              <tr>
                                <th>KPI Name</th>
                                <th>Category</th>
                                <th>Behavior</th>
                                <th>Description</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {bulkKpis.map((kpi, index) => (
                                <tr key={`valid-${index}`}>
                                  <td>{kpi.name}</td>
                                  <td>{kpi.category}</td>
                                  <td>{kpi.behavior}</td>
                                  <td>{kpi.description}</td>
                                  <td>
                                    <button onClick={() => {
                                      const updatedKpis = [...bulkKpis];
                                      updatedKpis.splice(index, 1);
                                      setBulkKpis(updatedKpis);
                                    }} className="delete-btn">
                                      <FaTrash size={12} /> Delete
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {previewTab === 'invalid' && invalidKpis.length > 0 && (
                        <div className="invalid-kpis-table">
                          <table>
                            <thead>
                              <tr>
                                <th>Reason</th>
                                <th>KPI Name</th>
                                <th>Category</th>
                                <th>Behavior</th>
                                <th>Description</th>
                              </tr>
                            </thead>
                            <tbody>
                              {invalidKpis.map((kpi, index) => (
                                <tr key={`invalid-${index}`}>
                                  <td className="reason-cell">{kpi.reason}</td>
                                  <td>{kpi.name}</td>
                                  <td>{kpi.category}</td>
                                  <td>{kpi.behavior}</td>
                                  <td>{kpi.description}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="modal-actions">
                  <button
                    onClick={handleBulkUpload}
                    className="save-btn"
                    disabled={!file || bulkKpis.length === 0}
                  >
                    Submit KPIs {bulkKpis.length > 0 && `(${bulkKpis.length})`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={`tab-content ${activeTab === 'viewKPIs' ? 'active' : ''}`}>
          <div className="existing-kpis">
            {renderFilterControls()} {/* Add this line */}
            <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>KPI Name</th>
                  <th>Category</th>
                  <th>Calculation Behavior</th>
                  <th>Description</th>
                  <th>Created By</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredKPIs().map((kpi, index) => (
                  <tr key={kpi.dKPI_ID}>
                    <td>{kpi.dKPI_ID}</td>
                    <td>{kpi.dKPI_Name}</td>
                    <td>{kpi.dCategory}</td>
                    <td>{kpi.dCalculationBehavior}</td>
                    <td>{kpi.dDescription}</td>
                    <td>{kpi.dCreatedBy || '-'}</td>
                    <td>{kpi.tCreatedAt ? new Date(kpi.tCreatedAt).toLocaleString() : '-'}</td>
                    <td>
                      <div className="action-buttons">
                        <button onClick={() => handleEditClick(kpi.dKPI_ID)} className="edit-btn">
                          <FaPencilAlt size={12} /> Edit
                        </button>
                        <button onClick={() => handleDeleteKpi(kpi.dKPI_ID)} className="delete-btn">
                          <FaTrash size={12} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </div>

      {/* Edit KPI Modal */}
      {editModalOpen && currentKpi && (
        <div className="modal-overlay">
          <div className="modal edit-kpi-modal">
            <div className="modal-header">
              <h2>Edit KPI</h2>
              <button onClick={() => setEditModalOpen(false)} className="close-btn">
                <FaTimes />
              </button>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>KPI Name</label>
                <input
                  type="text"
                  value={currentKpi.name}
                  onChange={(e) => setCurrentKpi({...currentKpi, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select
                  value={currentKpi.category}
                  onChange={(e) => setCurrentKpi({...currentKpi, category: e.target.value})}
                >
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Calculation Behavior</label>
                <select
                  value={currentKpi.behavior}
                  onChange={(e) => setCurrentKpi({...currentKpi, behavior: e.target.value})}
                >
                  <option value="">Select behavior</option>
                  {behaviors.map((beh) => (
                    <option key={`behavior-${beh}`} value={beh}>
                      {beh}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={description}
                onChange={handleDescriptionChange}
                placeholder="Describe what this KPI measures and why it's important"
                rows="3"
                maxLength={MAX_CHARS}
              />

              <small className={`char-count ${descriptionCount === MAX_CHARS ? 'limit-reached' : ''}`}>
                {descriptionCount}/{MAX_CHARS}
              </small>


            </div>

            <div className="modal-actions">
              <button onClick={() => setEditModalOpen(false)} className="cancel-btn">Cancel</button>
              <button 
                onClick={() => handleSave(currentKpi)} 
                className="save-btn"
                disabled={!currentKpi.name.trim() || !currentKpi.category || !currentKpi.behavior}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KPIManagement;