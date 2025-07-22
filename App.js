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
  const [firebaseUid, setFirebaseUid] = useState(null);
  const [apiUserId, setApiUserId] = useState(null); // ID numérico de la API (id_personal o id_familiar)
  const [loggedInResidentId, setLoggedInResidentId] = useState(null); // NUEVO ESTADO PARA EL ID DEL RESIDENTE ASOCIADO AL FAMILIAR

  // MODIFICADO: handleLoginSuccess ahora acepta 4 argumentos, incluyendo residentId
  const handleLoginSuccess = (role, uid, backendUserId, residentId) => {
    console.log(`[App.js] Login Exitoso - Rol: ${role}, UID: ${uid}, API UserId: ${backendUserId}, ResidentId: ${residentId}`);
    setIsAuthenticated(true);
    setUserRole(role);
    setFirebaseUid(uid);
    setApiUserId(backendUserId); 
    setLoggedInResidentId(residentId); // Almacenar el residentId
  };

  const handleLogout = () => {
    console.log("[App.js] Cerrando sesión...");
    setIsAuthenticated(false);
    setUserRole(null);
    setFirebaseUid(null);
    setApiUserId(null); 
    setLoggedInResidentId(null); // Limpiar también el residentId al cerrar sesión
    // Lógica de logout de Firebase si aplica
  };

  const renderAppNavigator = () => {
    if (!isAuthenticated) {
      return <AuthNavigator onLoginSuccess={handleLoginSuccess} />;
    } else if (userRole === 'admin') {
      return <AdminNavigator onLogout={handleLogout} userRole={userRole} firebaseUid={firebaseUid} apiUserId={apiUserId} />; 
    } else if (userRole === 'employee') {
      // Si tienes un EmployeeNavigator distinto, deberías pasarlo aquí
      // Por ahora, asumiendo que AdminNavigator maneja ambos si son muy similares
      return <AdminNavigator onLogout={handleLogout} userRole={userRole} firebaseUid={firebaseUid} apiUserId={apiUserId} />; 
    } else if (userRole === 'family') {
      return (
        <FamilyNavigator 
          onLogout={handleLogout} 
          userRole={userRole} 
          currentUserId={apiUserId} // Este es el ID de la tabla Familiar (id_familiar)
          loggedInResidentId={loggedInResidentId} // ¡AQUÍ PASAMOS EL ID DEL RESIDENTE AL NAVIGATOR FAMILIAR!
        />
      );
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