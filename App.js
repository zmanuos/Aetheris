// AETHERIS/App.js
import 'react-native-gesture-handler';
import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';

import AuthNavigator from './navigation/AuthNavigator';
import AdminNavigator from './navigation/AdminNavigator';
import FamilyNavigator from './navigation/FamilyNavigator'; 

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);

  const handleLoginSuccess = (role) => {
    setIsAuthenticated(true);
    setUserRole(role);
    console.log("App.js: Login successful, isAuthenticated:", true, "userRole:", role); // Puedes dejar este log para verificar el rol
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    console.log("App.js: Logged out"); // Puedes dejar este log para verificar el logout
  };

  const renderAppNavigator = () => {
    if (!isAuthenticated) {
      return <AuthNavigator onLoginSuccess={handleLoginSuccess} />;
    } else if (userRole === 'admin') {
      return <AdminNavigator onLogout={handleLogout} />;
    } else if (userRole === 'family') { // <-- Nueva condición para el rol "family"
      return <FamilyNavigator onLogout={handleLogout} />;
    }
    return null; // En caso de un rol no reconocido o si no está autenticado y no es un rol específico.
  };

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      {renderAppNavigator()}
    </NavigationContainer>
  );
}