<div className="table-wrapper">
{activeTable === 'users' && (
  getFilteredUsers().length === 0 ? (
    <div style={{ textAlign: 'center', padding: '40px 0', color: '#888', fontSize: 20 }}>
      No users found.
    </div>
  ) : (
    <table>
      <thead>
        <tr>
          <th className="employee-id-col" onClick={() => handleSort('dUser_ID')} style={{ cursor: 'pointer' }}>
            Employee ID {sortConfig.key === 'dUser_ID' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
          </th>
          <th className="name-col" onClick={() => handleSort('dName')} style={{ cursor: 'pointer' }}>
            Name {sortConfig.key === 'dName' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
          </th>
          <th className="email-col" onClick={() => handleSort('dEmail')} style={{ cursor: 'pointer' }}>
            Email {sortConfig.key === 'dEmail' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
          </th>
          <th className="role-col" onClick={() => handleSort('dUser_Type')} style={{ cursor: 'pointer' }}>
            Role {sortConfig.key === 'dUser_Type' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
          </th>
          <th className="status-col" onClick={() => handleSort('dStatus')} style={{ cursor: 'pointer' }}>
            Status {sortConfig.key === 'dStatus' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
          </th>
          <th className="actions-col">
            <div className="actions-header">
              Actions
              <div className="select-all-container">
                <input
                  type="checkbox"
                  checked={selectedUsers.length > 0 && selectedUsers.length === sortedUsers.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedUsers(sortedUsers.map(user => String(user.dUser_ID)));
                      // When selecting all, clear anchor/last
                      setAnchorSelectedIndex(null);
                      setLastSelectedIndex(null);
                    } else {
                      setSelectedUsers([]);
                      // When deselecting all, clear anchor/last
                      setAnchorSelectedIndex(null);
                      setLastSelectedIndex(null);
                    }
                  }}
                />
                <span className="selected-count">
                  {selectedUsers.length > 0 ? `${selectedUsers.length}` : ''}
                </span>
              </div>
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        {sortedUsers.map((user, index) => (
          <tr
            key={user.dLogin_ID || user.dUser_ID}
            className={selectedUsers.includes(user.dUser_ID) ? 'selected-row' : ''}
            onMouseDown={e => {
              // Only handle row selection if not clicking on a checkbox or button
              if (
                e.target.tagName === 'INPUT' && e.target.type === 'checkbox'
              ) return;
              if (
                e.target.tagName === 'BUTTON' ||
                e.target.tagName === 'svg' ||
                e.target.tagName === 'path'
              ) return;
              setIsDragging(true);
              setDragLastIndex(index);
              setDragToggled(new Set([index]));
              setSelectedUsers(prev => {
                if (prev.includes(user.dUser_ID)) {
                  return prev.filter(id => id !== user.dUser_ID);
                } else {
                  return [...prev, user.dUser_ID];
                }
              });
            }}
            onMouseEnter={() => {
              if (isDragging && dragLastIndex !== null && dragLastIndex !== index) {
                // Get all indices between dragLastIndex and current index
                const start = Math.min(dragLastIndex, index);
                const end = Math.max(dragLastIndex, index);
                const indicesToToggle = [];
                for (let i = start; i <= end; i++) {
                  if (!dragToggled.has(i)) {
                    indicesToToggle.push(i);
                  }
                }
                if (indicesToToggle.length > 0) {
                  setSelectedUsers(prev => {
                    let newSelected = [...prev];
                    indicesToToggle.forEach(i => {
                      const rowUser = sortedUsers[i];
                      if (!rowUser) return;
                      if (newSelected.includes(rowUser.dUser_ID)) {
                        newSelected = newSelected.filter(id => id !== rowUser.dUser_ID);
                      } else {
                        newSelected.push(rowUser.dUser_ID);
                      }
                    });
                    return newSelected;
                  });
                  setDragToggled(prevSet => {
                    const newSet = new Set(prevSet);
                    indicesToToggle.forEach(i => newSet.add(i));
                    return newSet;
                  });
                }
                setDragLastIndex(index);
              }
            }}
            onMouseUp={() => {
              setIsDragging(false);
              setDragLastIndex(null);
              setDragToggled(new Set());
            }}
          >
            <td>{user.dUser_ID}</td>
            <td>{user.dName}</td>
            <td>{user.dEmail}</td>
            <td>{user.dUser_Type}</td>
            <td>{user.dStatus}</td>
            <td>
              <div className="action-buttons">
                <button onClick={() => handleEdit(user)} className="edit-btn">
                  <FaEdit size={12} /> Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedUsers([String(user.dUser_ID)]);
                    setShowDeleteModal(true);
                  }}
                  className="delete-btn"
                >
                  <FaTrash size={12} /> Delete
                </button>
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(user.dUser_ID)}
                  onClick={e => e.stopPropagation()}
                  onChange={e => {
                    // Only handle checkbox toggle, prevent row click
                    setSelectedUsers(prev =>
                      e.target.checked
                        ? [...prev, user.dUser_ID]
                        : prev.filter(id => id !== user.dUser_ID)
                    );
                    if (!e.target.checked && selectedUsers.length === 1) {
                      setAnchorSelectedIndex(null);
                    } else if (e.target.checked && selectedUsers.length === 0) {
                      setAnchorSelectedIndex(index);
                    }
                    setLastSelectedIndex(index);
                  }}
                />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
)}
{activeTable === 'admin' && (
  getFilteredUsers().length === 0 ? (
    <div style={{ textAlign: 'center', padding: '40px 0', color: '#888', fontSize: 20 }}>
      No users found.
    </div>
  ) : (
    <table>
      <thead>
        <tr>
          <th className="employee-id-col" onClick={() => handleSort('dUser_ID')} style={{ cursor: 'pointer' }}>
            Employee ID {sortConfig.key === 'dUser_ID' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
          </th>
          <th className="name-col" onClick={() => handleSort('dName')} style={{ cursor: 'pointer' }}>
            Name {sortConfig.key === 'dName' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
          </th>
          <th className="email-col" onClick={() => handleSort('dEmail')} style={{ cursor: 'pointer' }}>
            Email {sortConfig.key === 'dEmail' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
          </th>
          <th className="role-col" onClick={() => handleSort('dUser_Type')} style={{ cursor: 'pointer' }}>
            Role {sortConfig.key === 'dUser_Type' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
          </th>
          <th className="status-col" onClick={() => handleSort('dStatus')} style={{ cursor: 'pointer' }}>
            Status {sortConfig.key === 'dStatus' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
          </th>
          <th className="actions-col">
            <div className="actions-header">
              Actions
              <div className="select-all-container">
                <input
                  type="checkbox"
                  checked={selectedUsers.length > 0 && selectedUsers.length === sortedUsers.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedUsers(sortedUsers.map(user => user.dUser_ID));
                      // When selecting all, clear anchor/last
                      setAnchorSelectedIndex(null);
                      setLastSelectedIndex(null);
                    } else {
                      setSelectedUsers([]);
                      // When deselecting all, clear anchor/last
                      setAnchorSelectedIndex(null);
                      setLastSelectedIndex(null);
                    }
                  }}
                />
                <span className="selected-count">
                  {selectedUsers.length > 0 ? `${selectedUsers.length}` : ''}
                </span>
              </div>
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        {sortedUsers.map((user, index) => (
          <tr
            key={user.dLogin_ID || user.dUser_ID}
            className={selectedUsers.includes(user.dUser_ID) ? 'selected-row' : ''}
            onMouseDown={e => {
              // Only handle row selection if not clicking on a checkbox or button
              if (
                e.target.tagName === 'INPUT' && e.target.type === 'checkbox'
              ) return;
              if (
                e.target.tagName === 'BUTTON' ||
                e.target.tagName === 'svg' ||
                e.target.tagName === 'path'
              ) return;
              setIsDragging(true);
              setDragLastIndex(index);
              setDragToggled(new Set([index]));
              setSelectedUsers(prev => {
                if (prev.includes(user.dUser_ID)) {
                  return prev.filter(id => id !== user.dUser_ID);
                } else {
                  return [...prev, user.dUser_ID];
                }
              });
            }}
            onMouseEnter={() => {
              if (isDragging && dragLastIndex !== null && dragLastIndex !== index) {
                // Get all indices between dragLastIndex and current index
                const start = Math.min(dragLastIndex, index);
                const end = Math.max(dragLastIndex, index);
                const indicesToToggle = [];
                for (let i = start; i <= end; i++) {
                  if (!dragToggled.has(i)) {
                    indicesToToggle.push(i);
                  }
                }
                if (indicesToToggle.length > 0) {
                  setSelectedUsers(prev => {
                    let newSelected = [...prev];
                    indicesToToggle.forEach(i => {
                      const rowUser = sortedUsers[i];
                      if (!rowUser) return;
                      if (newSelected.includes(rowUser.dUser_ID)) {
                        newSelected = newSelected.filter(id => id !== rowUser.dUser_ID);
                      } else {
                        newSelected.push(rowUser.dUser_ID);
                      }
                    });
                    return newSelected;
                  });
                  setDragToggled(prevSet => {
                    const newSet = new Set(prevSet);
                    indicesToToggle.forEach(i => newSet.add(i));
                    return newSet;
                  });
                }
                setDragLastIndex(index);
              }
            }}
            onMouseUp={() => {
              setIsDragging(false);
              setDragLastIndex(null);
              setDragToggled(new Set());
            }}
          >
            <td>{user.dUser_ID}</td>
            <td>{user.dName}</td>
            <td>{user.dEmail}</td>
            <td>{user.dUser_Type}</td>
            <td>{user.dStatus}</td>
            <td>
              <div className="action-buttons">
                <button onClick={() => handleEdit(user)} className="edit-btn">
                  <FaEdit size={12} /> Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedUsers([user.dUser_ID]);
                    setShowDeleteModal(true);
                  }}
                  className="delete-btn"
                >
                  <FaTrash size={12} /> Delete
                </button>
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(user.dUser_ID)}
                  onClick={e => e.stopPropagation()}
                  onChange={e => {
                    // Only handle checkbox toggle, prevent row click
                    setSelectedUsers(prev =>
                      e.target.checked
                        ? [...prev, user.dUser_ID]
                        : prev.filter(id => id !== user.dUser_ID)
                    );
                    if (!e.target.checked && selectedUsers.length === 1) {
                      setAnchorSelectedIndex(null);
                    } else if (e.target.checked && selectedUsers.length === 0) {
                      setAnchorSelectedIndex(index);
                    }
                    setLastSelectedIndex(index);
                  }}
                />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
)}
{activeTable === 'tickets' && (
  getFilteredUsers().length === 0 ? (
    <div style={{ textAlign: 'center', padding: '40px 0', color: '#888', fontSize: 20 }}>
      No users found.
    </div>
  ) : (
    <table>
      <thead>
        <tr>
          <th className="employee-id-col" onClick={() => handleSort('dUser_ID')} style={{ cursor: 'pointer' }}>
            Employee ID {sortConfig.key === 'dUser_ID' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
          </th>
          <th className="name-col" onClick={() => handleSort('dName')} style={{ cursor: 'pointer' }}>
            Name {sortConfig.key === 'dName' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
          </th>
          <th className="email-col" onClick={() => handleSort('dEmail')} style={{ cursor: 'pointer' }}>
            Email {sortConfig.key === 'dEmail' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
          </th>
          <th className="role-col" onClick={() => handleSort('dUser_Type')} style={{ cursor: 'pointer' }}>
            Role {sortConfig.key === 'dUser_Type' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
          </th>
          <th className="status-col" onClick={() => handleSort('dStatus')} style={{ cursor: 'pointer' }}>
            Status {sortConfig.key === 'dStatus' ? (sortConfig.direction === 'asc' ? '▲' : sortConfig.direction === 'desc' ? '▼' : '') : ''}
          </th>
          <th className="actions-col">
            <div className="actions-header">
              Actions
              <div className="select-all-container">
                <input
                  type="checkbox"
                  checked={selectedUsers.length > 0 && selectedUsers.length === sortedUsers.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedUsers(sortedUsers.map(user => user.dUser_ID));
                      // When selecting all, clear anchor/last
                      setAnchorSelectedIndex(null);
                      setLastSelectedIndex(null);
                    } else {
                      setSelectedUsers([]);
                      // When deselecting all, clear anchor/last
                      setAnchorSelectedIndex(null);
                      setLastSelectedIndex(null);
                    }
                  }}
                />
                <span className="selected-count">
                  {selectedUsers.length > 0 ? `${selectedUsers.length}` : ''}
                </span>
</div>