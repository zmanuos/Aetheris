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

const linking = {
  prefixes: ['http://localhost:8081'], // tu entorno local
  config: {
    screens: {
      // nombre de los screens en AuthNavigator
      Login: 'login',
      ForgotPassword: 'forgot-password',
      ResetPassword: 'resetPassword', // manejará /resetPassword?oobCode=...&mode=resetPassword
      // puedes agregar más si hace falta
    },
  },
};

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
      return <AuthNavigator />; 
    } else if (userRole === 'admin' || userRole === 'employee') {
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
    <NavigationContainer linking={linking} fallback={<></>}>
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
