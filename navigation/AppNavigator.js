// navigation/AppNavigator.js
import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthContext } from '../contexts/AuthContext.js'; // Asegúrate de que tu AuthContext provea el estado de autenticación y el rol del usuario

import AuthNavigator from './AuthNavigator';
import AdminNavigator from './AdminNavigator';
import FamilyNavigator from './FamilyNavigator';

const AppNavigator = () => {
  const { authState } = useContext(AuthContext); // Asumiendo que authState contiene { isAuthenticated, userRole }

  return (
    <NavigationContainer>
      {authState.isAuthenticated ? (
        authState.userRole === 'admin' ? (
          <AdminNavigator />
        ) : (
          <FamilyNavigator />
        )
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;