// src/context/SessionContext.js
import React, { createContext, useContext, useState } from 'react';

const SessionContext = createContext(null);

export const SessionProvider = ({ children }) => {
  const [session, setSession] = useState({
    isAuthenticated: false,
    firebaseUid: null,
    userRole: null,
    apiUserId: null,
    residentId: null
  });

  const login = (firebaseUid, userRole, apiUserId, residentId = null) => {
    setSession({
      isAuthenticated: true,
      firebaseUid,
      userRole,
      apiUserId,
      residentId
    });
  };

  const logout = () => {
    setSession({
      isAuthenticated: false,
      firebaseUid: null,
      userRole: null,
      apiUserId: null,
      residentId: null
    });
  };

  const contextValue = {
    session,
    login,
    logout,
  };

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

export default SessionContext;