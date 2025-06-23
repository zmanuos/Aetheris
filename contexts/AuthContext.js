import React, { createContext, useState, useEffect, useMemo } from 'react';

// 1. Crear el Contexto
export const AuthContext = createContext();

// 2. Crear el Proveedor del Contexto
export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    userToken: null,
    userRole: null, // Puede ser 'admin' o 'family'
    isLoading: false, // Siempre falso en modo estático para no mostrar loader
  });

  // 3. Efecto (vacío o simplificado para fines de prueba)
  // En este modo, no necesitamos cargar datos de AsyncStorage al inicio.
  useEffect(() => {
    // Aquí podrías establecer un usuario por defecto para pruebas si lo necesitas
    // Por ejemplo, iniciar como admin automáticamente:
    // setAuthState({
    //   isAuthenticated: true,
    //   userToken: 'fake-admin-token',
    //   userRole: 'admin',
    //   isLoading: false,
    // });
  }, []);

  // 4. Funciones de autenticación simuladas
  const signIn = async (email, password) => {
    // Simula una respuesta exitosa de login con roles fijos
    if (email === 'admin@test.com' && password === 'password') {
      setAuthState({
        isAuthenticated: true,
        userToken: 'fake-admin-token',
        userRole: 'admin',
        isLoading: false,
      });
      return { success: true };
    } else if (email === 'family@test.com' && password === 'password') {
      setAuthState({
        isAuthenticated: true,
        userToken: 'fake-family-token',
        userRole: 'family',
        isLoading: false,
      });
      return { success: true };
    } else {
      // Simula un error de credenciales
      return { success: false, error: 'Correo o contraseña incorrectos.' };
    }
  };

  const signOut = async () => {
    // Simplemente restablece el estado de autenticación
    setAuthState({
      isAuthenticated: false,
      userToken: null,
      userRole: null,
      isLoading: false,
    });
    return { success: true };
  };

  const signUp = async (userData) => {
    // En modo estático, el registro no hace nada persistente
    console.log('Registro simulado con datos:', userData);
    return { success: true, message: 'Registro simulado exitoso.' };
  };

  // 5. Memorizar el valor del contexto
  const authContextValue = useMemo(() => ({
    authState,
    signIn,
    signOut,
    signUp,
  }), [authState]);

  // 6. En modo estático, no necesitamos pantalla de carga inicial
  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};