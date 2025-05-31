import React, { createContext, useState, useContext, useEffect, useRef } from 'react';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('irisUser');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const wsRef = useRef(null);

  useEffect(() => {
    if (user) {
      localStorage.setItem('irisUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('irisUser');
    }
  }, [user]);

  useEffect(() => {
    // Only connect if user is logged in
    if (!user?.employeeId) return;

    // Connect to WebSocket
    wsRef.current = new window.WebSocket('ws://localhost:3000');
    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'USER_UPDATE') {
          // Re-fetch current user's details
          updateUserDetails(user.employeeId);
        }
      } catch (e) {
        // Ignore malformed messages
      }
    };

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
    // Only re-run if employeeId changes
  }, [user?.employeeId]);

const login = async (loginResponse) => {
  // Store just employeeId and status initially
  const initialUserData = {
    employeeId: loginResponse.user.id,
    status: loginResponse.user.status,
    token: loginResponse.token,
    message: loginResponse.message,
  };
  setUser(initialUserData);

  // Fetch complete user details and merge into user object
  try {
    const response = await fetch(`http://localhost:3000/api/users/${loginResponse.user.id}`);
    const userDetails = await response.json();

    if (response.ok) {
      setUser(prev => ({
        ...prev,
        ...userDetails // Merge all returned fields (employeeId, name, email, type, status)
      }));
    }
  } catch (error) {
    console.error('Error fetching user details:', error);
  }
};

const updateUserDetails = async (employeeId) => {
  try {
    const response = await fetch(`http://localhost:3000/api/users/${employeeId}`);
    const userDetails = await response.json();

    if (response.ok) {
      setUser(prev => ({
        ...prev,
        ...userDetails // Merge all returned fields
      }));
    }
  } catch (error) {
    console.error('Error updating user details:', error);
  }
};

  const logout = () => {
    setUser(null);
    localStorage.removeItem('irisUser');
  };

  return (
    <UserContext.Provider value={{ 
      user,
      login,
      logout,
      updateUserDetails,
      token: user?.token,
      userDetails: user?.user
    }}>
      {children}
    </UserContext.Provider>
  );
};


export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};