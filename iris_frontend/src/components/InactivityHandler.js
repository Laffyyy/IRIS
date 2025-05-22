import React, { useEffect, useRef, useState } from 'react';
import InactivityWarningModal from './InactivityWarningModal';
import LoggedOutModal from './LoggedOutModal';

const InactivityHandler = ({ children }) => {
  const [showWarning, setShowWarning] = useState(false);
  const [showLoggedOut, setShowLoggedOut] = useState(false);

  const warningTimeout = useRef(null);
  const logoutTimeout = useRef(null);
  const loggedOutRef = useRef(false); // ⬅️ Added

  // Warning shows after 30 seconds of inactivity
  const WARNING_DELAY = 180 * 1000; // 3 minutes
  // Logout occurs after 3 minutes of inactivity
  const LOGOUT_DELAY = 300 * 1000; // 5 minutes

  const clearTimers = () => {
    if (warningTimeout.current) clearTimeout(warningTimeout.current);
    if (logoutTimeout.current) clearTimeout(logoutTimeout.current);
  };

  const startTimers = () => {
    clearTimers();
    setShowWarning(false);
    setShowLoggedOut(false);
    loggedOutRef.current = false;

    warningTimeout.current = setTimeout(() => {
      setShowWarning(true);
    }, WARNING_DELAY);

    logoutTimeout.current = setTimeout(() => {
      setShowWarning(false);
      setShowLoggedOut(true);
      loggedOutRef.current = true;
      // Clear all localStorage items
      localStorage.clear();
      sessionStorage.clear();
    }, LOGOUT_DELAY);
  };

  const handleUserActivity = () => {
    if (loggedOutRef.current) return; // ⬅️ Prevent interaction after logout
    setShowWarning(false);
    startTimers();
  };

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'scroll', 'click'];
    events.forEach((event) => window.addEventListener(event, handleUserActivity));

    startTimers();

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleUserActivity));
      clearTimers();
    };
  }, []);

  return (
    <>
      {showWarning && <InactivityWarningModal />}
      {showLoggedOut && <LoggedOutModal />}
      {children}
    </>
  );
};

export default InactivityHandler;
