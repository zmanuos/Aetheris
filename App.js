import 'react-native-gesture-handler';
import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';


import './config/firebaseConfig';

import AuthNavigator from './navigation/AuthNavigator';
import AdminNavigator from './navigation/AdminNavigator';
import FamilyNavigator from './navigation/FamilyNavigator';

import { NotificationProvider } from './src/context/NotificationContext';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [firebaseUid, setFirebaseUid] = useState(null); // Nuevo estado para el UID

  const handleLoginSuccess = (role, uid) => { // Aceptar UID
    setIsAuthenticated(true);
    setUserRole(role);
    setFirebaseUid(uid); // Guardar el UID
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    setFirebaseUid(null); // Limpiar el UID al cerrar sesión
  };

  const renderAppNavigator = () => {
    if (!isAuthenticated) {
      return <AuthNavigator onLoginSuccess={handleLoginSuccess} />;
    } else if (userRole === 'admin') {
      return <AdminNavigator onLogout={handleLogout} userRole={userRole} firebaseUid={firebaseUid} />; // Pasar UID
    } else if (userRole === 'employee') {
      return <AdminNavigator onLogout={handleLogout} userRole={userRole} firebaseUid={firebaseUid} />; // Pasar UID
    } else if (userRole === 'family') {
      return <FamilyNavigator onLogout={handleLogout} userRole={userRole} firebaseUid={firebaseUid} />; // Pasar UID
    }
    return null;
  };

  return (
    <NotificationProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          {renderAppNavigator()}
        </NavigationContainer>
      </SafeAreaProvider>
    </NotificationProvider>
  );
}