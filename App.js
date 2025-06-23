// App.js
import React from 'react';
import { AuthProvider } from './contexts/AuthContext.js'; // Importa tu proveedor de contexto de autenticación
import AppNavigator from './navigation/AppNavigator'; // Importa el navegador principal que creamos

export default function App() {
  return (
    // Envuelve toda tu aplicación con los proveedores de contexto
    // para que todos los componentes anidados tengan acceso a su estado.
    <AuthProvider>
      <ThemeProvider>
        <NotificationProvider>
          {/* AppNavigator se encargará de decidir qué pila de navegación mostrar
              (autenticación, admin o familia) basándose en el estado de AuthContext. */}
          <AppNavigator />
        </NotificationProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}