// AETHERIS/App.js
import 'react-native-gesture-handler';
import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';

import AuthNavigator from './navigation/AuthNavigator';
import AdminNavigator from './navigation/AdminNavigator'; // Este navegador lo usaremos para Admin y Employee
import FamilyNavigator from './navigation/FamilyNavigator';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null); // 'admin', 'family', 'employee'

  const handleLoginSuccess = (role) => {
    setIsAuthenticated(true);
    setUserRole(role);
    console.log("App.js: Login successful, isAuthenticated:", true, "userRole:", role);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    console.log("App.js: Logged out");
  };

  const renderAppNavigator = () => {
    if (!isAuthenticated) {
      return <AuthNavigator onLoginSuccess={handleLoginSuccess} />;
    } else if (userRole === 'admin') {
      return <AdminNavigator onLogout={handleLogout} userRole={userRole} />; // Pasa userRole al AdminNavigator
    } else if (userRole === 'employee') {
      return <AdminNavigator onLogout={handleLogout} userRole={userRole} />; // Pasa userRole al AdminNavigator (el mismo que Admin)
    } else if (userRole === 'family') {
      return <FamilyNavigator onLogout={handleLogout} userRole={userRole} />; // Pasa userRole al FamilyNavigator
    }
    return null;
  };

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      {renderAppNavigator()}
    </NavigationContainer>
  );
}