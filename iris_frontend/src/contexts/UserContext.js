import React, { createContext, useState, useContext, useEffect } from 'react';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('irisUser');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('irisUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('irisUser');
    }
  }, [user]);

  const login = async (loginResponse) => {
    // Initially store just employeeId and status
    const initialUserData = {
      token: loginResponse.token,
      message: loginResponse.message,
      user: {
        employeeId: loginResponse.user.id, // Store as employeeId
        status: loginResponse.user.status
      }
    };
    setUser(initialUserData);

    // Fetch complete user details
    try {
      const response = await fetch(`http://localhost:3000/api/users/${loginResponse.user.id}`);
      const userDetails = await response.json();
      
      if (response.ok) {
        // Update with complete user details
        setUser(prev => ({
          ...prev,
          user: {
            ...prev.user,
            name: userDetails.dName,
            email: userDetails.dEmail,
            type: userDetails.dUser_Type
          }
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
          user: {
            ...prev.user,
            name: userDetails.dName,
            email: userDetails.dEmail,
            type: userDetails.dUser_Type
          }
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