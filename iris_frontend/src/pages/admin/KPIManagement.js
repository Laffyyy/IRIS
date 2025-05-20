// KPIManagement.js
import React, { useState, useCallback, useEffect } from 'react';
import './KPIManagement.css';
import { FaTrash, FaPencilAlt, FaTimes, FaPlus, FaTimesCircle, FaUpload, FaFileDownload, FaSearch, FaCheckCircle } from 'react-icons/fa';

const BASE_URL = 'http://localhost:3000/api/kpis';  // Change from /admin/kpis to /api/kpis

const KPIManagement = () => {

  const categories = ['Compliance', 'Customer Experience', 'Employee Performance', 'Finance', 'Healthcare', 'Logistics', 'Operational Efficiency', 'Sales', 'Tech'];
  const behaviors = ['Lower the Better', 'Higher the Better'];

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

  

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [behaviorFilter, setBehaviorFilter] = useState('');

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedKpi, setSelectedKpi] = useState(null);
  
  const ALLOWED_FILE_PATTERN = /^kpi_upload_\d{8}\.csv$/;

  const [isDuplicateName, setIsDuplicateName] = useState(false);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [kpiToAdd, setKpiToAdd] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [successCount, setSuccessCount] = useState(0);
  const [showDisableSuccessModal, setShowDisableSuccessModal] = useState(false);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [kpiToDelete, setKpiToDelete] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const [selectedKPIs, setSelectedKPIs] = useState([]);
  const [showBulkDisableModal, setShowBulkDisableModal] = useState(false);
  const [bulkDisableConfirmation, setBulkDisableConfirmation] = useState('');

  // Add this validation function after the existing functions
  const validateInput = (value) => {
    // Allow alphanumeric characters, spaces, and "-" character
    return value.replace(/[^a-zA-Z0-9\s-]/g, '');
  };

  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('error'); // 'error' or 'success'

  const showAlert = (message, type = 'error') => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlertModal(true);
  };

  const handleFormSubmit = () => {
    if (editingKpi) {
      handleUpdateKpi();
    } else {
      // Check for duplicates in existing KPIs
      if (isDuplicateKPI(kpiName)) {
        showAlert('A KPI with this name already exists. Please use a different name.');
        return;
      }

      // Set the KPI to add and show confirmation modal
      setKpiToAdd({
        name: kpiName,
        category: category,
        behavior: behavior,
        description: description
      });
      setShowConfirmModal(true);
    }
  };

  const handleConfirmAdd = async () => {
    try {
      const kpiData = {
        dKPI_Name: kpiToAdd.name.trim(),
        dCategory: kpiToAdd.category,
        dCalculationBehavior: kpiToAdd.behavior,
        dDescription: kpiToAdd.description || '',
        dCreatedBy: '2505170018'
      };

      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(kpiData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      // Refresh KPI list
      const refreshResponse = await fetch(BASE_URL);
      if (!refreshResponse.ok) {
        throw new Error('Failed to refresh KPI list');
      }
      const updatedKpis = await refreshResponse.json();
      setKpis(updatedKpis);

      resetForm();
      setShowConfirmModal(false);
      setShowSuccessModal(true);
      setActiveTab('viewKPIs');

      // Auto hide success modal after 2 seconds
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 2000);

      setRecentlyAdded(prev => [
        ...prev,
        {
          name: kpiToAdd.name,
          category: kpiToAdd.category,
          behavior: kpiToAdd.behavior,
          description: kpiToAdd.description,
          // add any other fields you want to show
        }
      ]);
    } catch (error) {
      console.error('Error details:', error);
      showAlert(`Failed to add KPI: ${error.message}`);
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
        handleFile(file);
      }
  }, []);

  const handleFileChange = (e) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        
        // Add filename validation
        if (!ALLOWED_FILE_PATTERN.test(file.name)) {
          setValidationMessage('Invalid filename format. Please use: kpi_upload_YYYYMMDD.csv');
          setShowValidationModal(true);
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
        setValidationMessage('Invalid filename format. Please use: kpi_upload_YYYYMMDD.csv');
        setShowValidationModal(true);
        resetBulkUploadState();
        return;
      }
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target.result;
        const kpisToValidate = processFileContent(text);
        
        if (kpisToValidate.length === 0) {
          setValidationMessage('No valid KPIs found in the file');
          setShowValidationModal(true);
          resetBulkUploadState();
          return;
        }

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
          } else if (!categories.includes(kpi.category)) {
            isValid = false;
            reason = 'Invalid category';
          } else if (!behaviors.includes(kpi.behavior)) {
            isValid = false;
            reason = 'Invalid behavior';
          }

          if (isValid) {
            validKpis.push({
              ...kpi,
              category: kpi.category,
              behavior: kpi.behavior
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
      setValidationMessage('Error processing file. Please check the file format.');
      setShowValidationModal(true);
      resetBulkUploadState();
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
      "Customer Satisfaction,Customer Experience,Lower the Better,Measures overall customer satisfaction,,,Valid Behaviors: Lower the Better, Higher the Better",
      "Employee Turnover,Employee Performance,Lower the Better,Tracks employee turnover rate"
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
      const rows = text.split('\n')
        .filter(row => row.trim() !== '' && !row.startsWith(',,,'));

      const headers = rows[0].split(',').map(header => header.trim());
      const structureValidation = validateCSVStructure(headers);
      
      if (!structureValidation.isValid) {
        showAlert(structureValidation.errors.length > 0 ? structureValidation.errors : 'Invalid CSV structure.');
        return [];
      }

      const dataRows = rows.slice(1)
        .filter(row => row.trim())
        .map(row => {
          const columns = row.split(',');
          if (columns[0]?.trim()) {
            const name = columns[0]?.trim();
            const category = columns[1]?.trim();
            const behavior = columns[2]?.trim();
            const description = columns[3]?.trim();

            let isValid = true;
            let reason = '';

            // Case-insensitive category check
            const categoryMatch = categories.find(
              cat => cat.toLowerCase() === category.toLowerCase()
            );
            
            // Case-insensitive behavior check
            const behaviorMatch = behaviors.find(
              beh => beh.toLowerCase() === behavior.toLowerCase()
            );

            if (!categoryMatch) {
              isValid = false;
              reason = 'Invalid category';
            } else if (!behaviorMatch) {
              isValid = false;
              reason = 'Invalid behavior';
            }

            return {
              name,
              category: categoryMatch || category, // Use matched category if found
              behavior: behaviorMatch || behavior, // Use matched behavior if found
              description,
              ...(isValid ? {} : { reason })
            };
          }
          return null;
        })
        .filter(row => row !== null);

      return dataRows;
    } catch (error) {
      console.error('Error processing CSV:', error);
      showAlert('Error processing file. Please check the file format.');
      return [];
    }
  };

  // Add this function to validate CSV structure
  const validateCSVStructure = (headers) => {
    const requiredColumns = ['KPI Name', 'Category', 'Behavior', 'Description'];
    const missingColumns = requiredColumns.filter(col => 
      !headers.some(header => header.trim() === col)
    );
    const errors = [];
    if (missingColumns.length > 0) {
      errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
    }
    // Add more checks and push to errors as needed
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const handleAddKpi = async () => {
    try {
        const promises = individualPreview.map(async kpi => {
            const kpiData = {
                dKPI_Name: kpi.name.trim(),
                dCategory: kpi.category,
                dCalculationBehavior: kpi.behavior,
                dDescription: kpi.description || '', // Ensure description is never null
                dCreatedBy: '2505170018' // Add your actual user ID here
            };

            console.log('Sending KPI data:', kpiData); // Add this for debugging

            const response = await fetch(BASE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(kpiData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Server response:', errorData); // Add this for debugging
                throw new Error(errorData.message || `Server error: ${response.status}`);
            }

            return response.json();
        });

        await Promise.all(promises);
        
        // Refresh KPI list
        const refreshResponse = await fetch(BASE_URL);
        if (!refreshResponse.ok) {
            throw new Error('Failed to refresh KPI list');
        }
        const updatedKpis = await refreshResponse.json();
        setKpis(updatedKpis);

        resetForm();
        setActiveTab('viewKPIs');
        showAlert('KPIs added successfully!');
    } catch (error) {
        console.error('Error details:', error);
        showAlert(`Failed to add KPIs: ${error.message}`);
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
      } else if (!categories.includes(kpi.category)) {
        isValid = false;
        reason = 'Invalid category';
      } else if (!behaviors.includes(kpi.behavior)) {
        isValid = false;
        reason = 'Invalid behavior';
      }

      if (isValid) {
        validKpis.push({
          ...kpi,
          category: kpi.category,
          behavior: kpi.behavior
        });
        seenNames.add(kpi.name.toLowerCase());
      } else {
        invalidKpis.push({
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
        
        showAlert('KPI updated successfully!');

      } catch (error) {
        console.error('Error updating KPI:', error);
        showAlert(`Failed to update KPI: ${error.message}`);
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
      showAlert('Failed to load KPI data for editing. Please try again.');
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
        showAlert('Failed to save changes. Please try again.');
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

          // Set success message and count
          setSuccessMessage('KPIs have been added successfully');
          setSuccessCount(bulkKpis.length);
          setShowSuccessModal(true);

          // Reset all bulk upload related states
          resetBulkUploadState();
          setActiveTab('viewKPIs');

          setRecentlyAdded(prev => [
            ...prev,
            ...bulkKpis.map(kpi => ({
              name: kpi.name,
              category: kpi.category,
              behavior: kpi.behavior,
              description: kpi.description,
              // add any other fields you want to show
            }))
          ]);

      } catch (error) {
          console.error('Bulk upload error:', error);
          showAlert(`Failed to upload KPIs: ${error.message}`);
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
    
  const handleDeleteClick = (kpi) => {
    setKpiToDelete(kpi);
    setShowDeleteModal(true);
    setDeleteConfirmation('');
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirmation.trim() === kpiToDelete.dKPI_Name.trim()) {
      try {
        const response = await fetch(`http://localhost:3000/api/kpis/${kpiToDelete.dKPI_ID}`, {
          method: 'DELETE',
        });
  
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
  
        setKpis(kpis.filter(kpi => kpi.dKPI_ID !== kpiToDelete.dKPI_ID));
        setShowDeleteModal(false);
        setKpiToDelete(null);
        setDeleteConfirmation('');
        setShowDisableSuccessModal(true);
      } catch (error) {
        console.error('Error disabling KPI:', error);
        showAlert('Failed to disable KPI. Please try again.');
      }
    } else {
      showAlert('Please type the exact KPI name to confirm disabling');
    }
  };

  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  };

  

  const handleDescriptionChange = (e) => {
    const text = validateInput(e.target.value);
    if (text.length <= MAX_CHARS) {
      setDescription(text);
      setDescriptionCount(text.length);
    }
  };

  const handleKpiNameChange = (e) => {
    const text = validateInput(e.target.value);
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
              setSelectedKpi(null);
            }}
            onKeyDown={handleKeyDown}
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

  const handleBulkDisable = async () => {
    if (bulkDisableConfirmation.trim() === 'DISABLE') {
      try {
        const promises = selectedKPIs.map(kpi => 
          fetch(`http://localhost:3000/api/kpis/${kpi.dKPI_ID}`, {
            method: 'DELETE',
          })
        );

        const responses = await Promise.all(promises);
        const failedResponses = responses.filter(response => !response.ok);
        
        if (failedResponses.length > 0) {
          throw new Error(`Failed to disable ${failedResponses.length} KPIs`);
        }

        // Update the KPI list
        setKpis(kpis.filter(kpi => !selectedKPIs.some(selected => selected.dKPI_ID === kpi.dKPI_ID)));
        
        // Show success modal
        setSuccessMessage(`${selectedKPIs.length} KPIs have been disabled successfully`);
        setSuccessCount(selectedKPIs.length);
        setShowDisableSuccessModal(true);
        
        // Reset states
        setSelectedKPIs([]);
        setShowBulkDisableModal(false);
        setBulkDisableConfirmation('');
      } catch (error) {
        console.error('Bulk disable error:', error);
        showAlert(`Failed to disable KPIs: ${error.message}`);
      }
    } else {
      showAlert('Please type "DISABLE" to confirm bulk disabling');
    }
  };

  const handleSelectKPI = (kpi) => {
    if (selectedKPIs.some(selected => selected.dKPI_ID === kpi.dKPI_ID)) {
      setSelectedKPIs(selectedKPIs.filter(selected => selected.dKPI_ID !== kpi.dKPI_ID));
    } else {
      setSelectedKPIs([...selectedKPIs, kpi]);
    }
  };

  const handleSelectAll = () => {
    if (selectedKPIs.length === getFilteredKPIs().length) {
      setSelectedKPIs([]);
    } else {
      setSelectedKPIs(getFilteredKPIs());
    }
  };

  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');

  const [recentlyAdded, setRecentlyAdded] = useState([]);
  const [editRecentKpi, setEditRecentKpi] = useState(null); // for editing modal

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
            <div className="kpi-upload-sections">
              <div className="kpi-upload-card">
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
                      <label>RecommendedCalculation Behavior</label>
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
                      onChange={handleDescriptionChange}
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
                </div>
              </div>
              <div className="kpi-upload-card">
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
              </div>
            </div>
          </div>
        </div>

        <div className={`tab-content ${activeTab === 'viewKPIs' ? 'active' : ''}`}>
          <div className="existing-kpis">
            {renderFilterControls()}
            <div className="table-container">
              {selectedKPIs.length > 0 && (
                <div className="bulk-actions">
                  <button 
                    className="bulk-disable-btn"
                    onClick={() => setShowBulkDisableModal(true)}
                  >
                    <FaTimes size={12} />
                    Disable Selected KPIs
                    <span className="count">{selectedKPIs.length}</span>
                  </button>
                </div>
              )}
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          checked={selectedKPIs.length === getFilteredKPIs().length && getFilteredKPIs().length > 0}
                          onChange={handleSelectAll}
                        />
                      </th>
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
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedKPIs.some(selected => selected.dKPI_ID === kpi.dKPI_ID)}
                            onChange={() => handleSelectKPI(kpi)}
                          />
                        </td>
                        <td>{kpi.dKPI_ID}</td>
                        <td>{kpi.dKPI_Name}</td>
                        <td>{kpi.dCategory}</td>
                        <td>{kpi.dCalculationBehavior}</td>
                        <td>{kpi.dDescription}</td>
                        <td>{kpi.dCreatedBy || '-'}</td>
                        <td>{kpi.tCreatedAt ? new Date(kpi.tCreatedAt).toLocaleString() : '-'}</td>
                        <td>
                          <div className="action-buttons">
                            <button onClick={() => handleDeleteClick(kpi)} className="delete-btn">
                              <FaTimes size={12} /> Disable
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
      </div>

      {showConfirmModal && kpiToAdd && (
      <div className="modal-overlay">
        <div className="modal confirm-modal">
          <div className="modal-header">
            <h2>Confirm KPI Addition</h2>
            <button onClick={() => setShowConfirmModal(false)} className="close-btn">
              <FaTimes />
            </button>
          </div>
          
          <div className="modal-content">
            <p>Please confirm the details of the KPI to be added:</p>
            <div className="kpi-details">
              <p>Name:<strong>{kpiToAdd.name}</strong></p>
              <p>Category:<strong>{kpiToAdd.category}</strong></p>
              <p>Behavior:<strong>{kpiToAdd.behavior}</strong></p>
              <p>Description:<strong>{kpiToAdd.description || '-'}</strong></p>
            </div>
          </div>

          <div className="modal-actions">
            <button onClick={() => setShowConfirmModal(false)} className="cancel-btn">
              Cancel
            </button>
            <button onClick={handleConfirmAdd} className="save-btn">
              Confirm Add
            </button>
          </div>
        </div>
      </div>
    )}

          {showSuccessModal && (
        <div className="modal-overlay">
          <div className="modal success-modal">
            <div className="success-content">
              <FaCheckCircle className="success-icon" />
              <h2>Success!</h2>
              <p>{successMessage}</p>
              {successCount > 0 && (
                <p className="success-count">{successCount} KPI{successCount !== 1 ? 's' : ''} added</p>
              )}
              <button 
                onClick={() => setShowSuccessModal(false)} 
                className="ok-btn"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disable Success Modal */}
      {showDisableSuccessModal && (
        <div className="modal-overlay">
          <div className="modal success-modal">
            <div className="success-content">
              <FaCheckCircle className="success-icon" />
              <h2>Success!</h2>
              <p>KPI has been disabled successfully</p>
              <button 
                onClick={() => setShowDisableSuccessModal(false)} 
                className="ok-btn"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && kpiToDelete && (
        <div className="modal-overlay">
          <div className="modal delete-confirmation-modal">
            <div className="modal-header">
              <h2>Confirm KPI Disable</h2>
              <button onClick={() => {
                setShowDeleteModal(false);
                setKpiToDelete(null);
                setDeleteConfirmation('');
              }} className="close-btn">
                <FaTimes />
              </button>
            </div>
            
            <div className="modal-content">
              <div className="warning-message">
                <FaTimesCircle className="warning-icon" />
                <p>Please confirm the details of the KPI you want to disable:</p>
              </div>
              
              <div className="kpi-details">
                <p><strong>KPI Name:</strong> {kpiToDelete.dKPI_Name}</p>
                <p><strong>Category:</strong> {kpiToDelete.dCategory}</p>
                <p><strong>Behavior:</strong> {kpiToDelete.dCalculationBehavior}</p>
                <p><strong>Description:</strong> {kpiToDelete.dDescription || '-'}</p>
              </div>

              <div className="confirmation-input">
                <p>To confirm disabling, please type the KPI name:</p>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(validateInput(e.target.value))}
                  onPaste={(e) => e.preventDefault()}
                  placeholder="Type the KPI name to confirm"
                  className={deleteConfirmation && deleteConfirmation.trim() !== kpiToDelete.dKPI_Name.trim() ? 'error' : ''}
                />
                {deleteConfirmation && deleteConfirmation.trim() !== kpiToDelete.dKPI_Name.trim() && (
                  <span className="error-message">The name doesn't match</span>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button 
                onClick={() => {
                  setShowDeleteModal(false);
                  setKpiToDelete(null);
                  setDeleteConfirmation('');
                }} 
                className="cancel-btn"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteConfirm}
                className="delete-confirm-btn"
                disabled={deleteConfirmation.trim() !== kpiToDelete.dKPI_Name.trim()}
              >
                Disable KPI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Disable Modal */}
      {showBulkDisableModal && (
        <div className="modal-overlay">
          <div className="modal delete-confirmation-modal">
            <div className="modal-header">
              <h2>Confirm Bulk Disable</h2>
              <button onClick={() => {
                setShowBulkDisableModal(false);
                setBulkDisableConfirmation('');
              }} className="close-btn">
                <FaTimes />
              </button>
            </div>
            
            <div className="modal-content">
              <div className="warning-message">
                <FaTimesCircle className="warning-icon" />
                <p>Please confirm the details of the KPIs you want to disable:</p>
              </div>
              
              <div className="kpi-details">
                <p><strong>Number of KPIs to disable:</strong> {selectedKPIs.length}</p>
                <div className="selected-kpis-list">
                  {selectedKPIs.map(kpi => (
                    <p key={kpi.dKPI_ID}><strong>{kpi.dKPI_Name}</strong></p>
                  ))}
                </div>
              </div>

              <div className="confirmation-input">
                <p>To confirm disabling {selectedKPIs.length} KPIs, please type "DISABLE":</p>
                <input
                  type="text"
                  value={bulkDisableConfirmation}
                  onChange={(e) => setBulkDisableConfirmation(validateInput(e.target.value))}
                  onPaste={(e) => e.preventDefault()}
                  placeholder="Type DISABLE to confirm"
                  className={bulkDisableConfirmation && bulkDisableConfirmation.trim() !== 'DISABLE' ? 'error' : ''}
                />
                {bulkDisableConfirmation && bulkDisableConfirmation.trim() !== 'DISABLE' && (
                  <span className="error-message">Please type "DISABLE" to confirm</span>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button 
                onClick={() => {
                  setShowBulkDisableModal(false);
                  setBulkDisableConfirmation('');
                }} 
                className="cancel-btn"
              >
                Cancel
              </button>
              <button 
                onClick={handleBulkDisable}
                className="delete-confirm-btn"
                disabled={bulkDisableConfirmation.trim() !== 'DISABLE'}
              >
                Disable {selectedKPIs.length} KPIs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Validation Modal */}
      {showValidationModal && (
        <div className="modal-overlay">
          <div className="modal validation-modal">
            <div className="modal-header">
              <h2>Validation Error</h2>
              <button onClick={() => setShowValidationModal(false)} className="close-btn">
                <FaTimes />
              </button>
            </div>
            <div className="modal-content">
              <div className="warning-message">
                <FaTimesCircle className="warning-icon" />
                <p>{validationMessage}</p>
              </div>
            </div>
            <div className="modal-actions">
              <button 
                onClick={() => setShowValidationModal(false)} 
                className="ok-btn"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Alert Modal */}
      {showAlertModal && (
        <div className="modal-overlay">
          <div className="modal alert-modal">
            <div className="modal-header">
              <h2>{alertType === 'error' ? 'Error' : 'Success'}</h2>
              <button onClick={() => setShowAlertModal(false)} className="close-btn">
                <FaTimes />
              </button>
            </div>
            <div className="modal-content">
              <div className={`alert-message ${alertType}`}>
                {alertType === 'error' ? (
                  <FaTimesCircle className="alert-icon" />
                ) : (
                  <FaCheckCircle className="alert-icon" />
                )}
                {Array.isArray(alertMessage) ? (
                  <ul style={{ textAlign: 'left', margin: '0 auto' }}>
                    {alertMessage.map((msg, idx) => (
                      <li key={idx}>{msg}</li>
                    ))}
                  </ul>
                ) : (
                  <p>{alertMessage}</p>
                )}
              </div>
            </div>
            <div className="modal-actions">
              <button 
                onClick={() => setShowAlertModal(false)} 
                className="ok-btn"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="recently-added-table">
        <h2>Recently Added</h2>
        {recentlyAdded.length === 0 ? (
          <p>No recently added KPIs.</p>
        ) : (
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
              {recentlyAdded.map((kpi, idx) => (
                <tr key={idx}>
                  <td>{kpi.name}</td>
                  <td>{kpi.category}</td>
                  <td>{kpi.behavior}</td>
                  <td>{kpi.description}</td>
                  <td>
                    <button onClick={() => setEditRecentKpi({ ...kpi, idx })}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editRecentKpi && (
        <EditKpiModal
          kpi={editRecentKpi}
          onSave={updatedKpi => {
            // update in recentlyAdded
            setRecentlyAdded(prev => prev.map((k, i) => i === editRecentKpi.idx ? updatedKpi : k));
            setEditRecentKpi(null);
            // optionally update in backend as well
          }}
          onCancel={() => setEditRecentKpi(null)}
        />
      )}
    </div>
  );
};

const EditKpiModal = ({ kpi, onSave, onCancel }) => {
  const [name, setName] = useState(kpi.name);
  const [category, setCategory] = useState(kpi.category);
  const [behavior, setBehavior] = useState(kpi.behavior);
  const [description, setDescription] = useState(kpi.description);

  const handleSave = () => {
    onSave({
      ...kpi,
      name,
      category,
      behavior,
      description,
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal edit-kpi-modal">
        <div className="modal-header">
          <h2>Edit KPI</h2>
          <button onClick={onCancel} className="close-btn">×</button>
        </div>
        <div className="modal-content">
          <div>
            <label>KPI Name</label>
            <input value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label>Category</label>
            <input value={category} onChange={e => setCategory(e.target.value)} />
          </div>
          <div>
            <label>Behavior</label>
            <input value={behavior} onChange={e => setBehavior(e.target.value)} />
          </div>
          <div>
            <label>Description</label>
            <input value={description} onChange={e => setDescription(e.target.value)} />
          </div>
        </div>
        <div className="modal-actions">
          <button onClick={onCancel} className="cancel-btn">Cancel</button>
          <button onClick={handleSave} className="save-btn">Save</button>
        </div>
      </div>
    </div>
  );
};

export default KPIManagement;