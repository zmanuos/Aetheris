import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import './config/firebaseConfig';

import AuthNavigator from './navigation/AuthNavigator';
import AdminNavigator from './navigation/AdminNavigator';
import FamilyNavigator from './navigation/FamilyNavigator';

import { NotificationProvider } from './src/context/NotificationContext';
import { SessionProvider, useSession } from './src/context/SessionContext';

function AppContent() {
  const { session, logout } = useSession(); 
  const { isAuthenticated, userRole, firebaseUid, apiUserId, residentId } = session;

  useEffect(() => {
    if (session.isAuthenticated) {
      console.log(">>> Objeto de sesión ACTUALIZADO en AppContent:", session);
    }
  }, [session]);

  const handleLogout = () => {
    console.log("[App.js] Cerrando sesión...");
    logout();
  };

  const renderAppNavigator = () => {
    if (!isAuthenticated) {
      // Asumiendo que AuthNavigator tiene una prop onLoginSuccess si la necesitas
      return <AuthNavigator />; 
    } else if (userRole === 'admin') {
      return <AdminNavigator onLogout={handleLogout} userRole={userRole} firebaseUid={firebaseUid} apiUserId={apiUserId} />; 
    } else if (userRole === 'employee') {
      return <AdminNavigator onLogout={handleLogout} userRole={userRole} firebaseUid={firebaseUid} apiUserId={apiUserId} />; 
    } else if (userRole === 'family') {
      return (
        <FamilyNavigator 
          onLogout={handleLogout} 
          userRole={userRole} 
          currentUserId={apiUserId} 
          loggedInResidentId={residentId} 
        />
      );
    }
    return null;
  };

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      {renderAppNavigator()}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <NotificationProvider>
      <SafeAreaProvider>
        <SessionProvider>
          <AppContent />
        </SessionProvider>
      </SafeAreaProvider>
    </NotificationProvider>
  );
}