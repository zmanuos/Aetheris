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
import { UnreadMessagesProvider } from './src/context/UnreadMessagesContext';

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
      return React.createElement(AuthNavigator, null);
    } else if (userRole === 'admin' || userRole === 'employee') {
      return React.createElement(AdminNavigator, {
        onLogout: handleLogout,
        userRole: userRole,
        firebaseUid: firebaseUid,
        apiUserId: apiUserId
      });
    } else if (userRole === 'family') {
      return React.createElement(FamilyNavigator, {
        onLogout: handleLogout,
        userRole: userRole,
        currentUserId: apiUserId,
        loggedInResidentId: residentId
      });
    }
    return null;
  };

  return React.createElement(NavigationContainer, {
    linking: linking,
    fallback: React.createElement(React.Fragment, null)
  }, React.createElement(StatusBar, {
    style: "auto"
  }), renderAppNavigator());
}

const linking = {
  prefixes: ['http://localhost:8081'],
  config: {
    screens: {
      Login: 'login',
      ForgotPassword: 'forgot-password',
      ResetPassword: 'resetPassword',
    },
  },
};

export default function App() {
  return React.createElement(NotificationProvider, null, React.createElement(SafeAreaProvider, null, React.createElement(SessionProvider, null, React.createElement(UnreadMessagesProvider, null, React.createElement(AppContent, null)))));
}