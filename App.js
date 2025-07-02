// AETHERIS/App.js
import 'react-native-gesture-handler';
import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';

console.log("--- App.js: Iniciando carga del archivo ---"); 

import './config/firebaseConfig'; 

console.log("--- App.js: firebaseConfig importado ---"); 

import AuthNavigator from './navigation/AuthNavigator';
import AdminNavigator from './navigation/AdminNavigator';
import FamilyNavigator from './navigation/FamilyNavigator';

export default function App() {
  console.log("--- App.js: Componente App renderizando ---"); 
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);

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
    console.log("--- App.js: renderAppNavigator ejecutándose ---"); 
    if (!isAuthenticated) {
      return <AuthNavigator onLoginSuccess={handleLoginSuccess} />;
    } else if (userRole === 'admin') {
      return <AdminNavigator onLogout={handleLogout} userRole={userRole} />;
    } else if (userRole === 'employee') {
      return <AdminNavigator onLogout={handleLogout} userRole={userRole} />;
    } else if (userRole === 'family') {
      return <FamilyNavigator onLogout={handleLogout} userRole={userRole} />;
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