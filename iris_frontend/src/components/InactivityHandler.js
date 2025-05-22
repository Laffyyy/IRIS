import React, { useEffect, useRef, useState } from 'react';
import InactivityWarningModal from './InactivityWarningModal';
import LoggedOutModal from './LoggedOutModal';

const InactivityHandler = ({ children }) => {
  const [showWarning, setShowWarning] = useState(false);
  const [showLoggedOut, setShowLoggedOut] = useState(false);

  const warningTimeout = useRef(null);
  const logoutTimeout = useRef(null);
  const loggedOutRef = useRef(false); // ⬅️ Added

  const WARNING_DELAY = 1 * 30 * 1000;
  const LOGOUT_DELAY = 3 * 60 * 1000;

  const clearTimers = () => {
    if (warningTimeout.current) clearTimeout(warningTimeout.current);
    if (logoutTimeout.current) clearTimeout(logoutTimeout.current);
  };

  const startTimers = () => {
    clearTimers();
    setShowWarning(false);
    setShowLoggedOut(false);
    loggedOutRef.current = false; // ⬅️ Reset logout flag

    warningTimeout.current = setTimeout(() => {
      setShowWarning(true);
    }, WARNING_DELAY);

    logoutTimeout.current = setTimeout(() => {
      setShowWarning(false);
      setShowLoggedOut(true);
      loggedOutRef.current = true; // ⬅️ Set logout flag
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
