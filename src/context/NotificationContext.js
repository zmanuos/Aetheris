// src/context/NotificationContext.js
import React, { createContext, useRef, useContext } from 'react';
import Notification from '../../components/shared/Notification'; // Asegúrate de que esta ruta sea correcta

// 1. Crear el Contexto
const NotificationContext = createContext(null);

// 2. Crear el Proveedor de Notificaciones
export const NotificationProvider = ({ children }) => {
  const notificationRef = useRef(null); // Ref para el componente Notification

  // Función para mostrar la notificación, que se expondrá a través del contexto
  const showNotification = (message, type = 'success', duration = 3000) => {
    if (notificationRef.current) {
      notificationRef.current.show(message, type, duration);
    }
  };

  // Función para ocultar la notificación (opcional, pero buena práctica)
  const hideNotification = () => {
    if (notificationRef.current) {
      notificationRef.current.hide();
    }
  };

  return (
    <NotificationContext.Provider value={{ showNotification, hideNotification }}>
      {children}
      {/* El componente Notification se renderiza aquí, en un nivel superior.
          Estará siempre montado mientras el NotificationProvider lo esté. */}
      <Notification ref={notificationRef} />
    </NotificationContext.Provider>
  );
};

// 3. Crear un Hook personalizado para consumir el contexto fácilmente
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};