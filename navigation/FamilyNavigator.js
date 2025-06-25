// navigation/FamilyNavigator.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const FamilyStack = createStackNavigator();
const FamilyTabs = createBottomTabNavigator();

// --- Navegación por Stack para cada pestaña ---

const DashboardFamilyStack = () => (
  <FamilyStack.Navigator screenOptions={{ headerShown: false }}>
    <FamilyStack.Screen name="FamilyDashboard" component={FamilyDashboardScreen} />
    {/* Aquí podrías tener pantallas de detalle para elementos del dashboard familiar */}
  </FamilyStack.Navigator>
);

const ResidentInfoFamilyStack = () => (
  <FamilyStack.Navigator screenOptions={{ headerShown: false }}>
    <FamilyStack.Screen name="ResidentInfo" component={ResidentInfoScreen} />
    {/* Detalles del residente */}
  </FamilyStack.Navigator>
);

const VisitsFamilyStack = () => (
  <FamilyStack.Navigator screenOptions={{ headerShown: false }}>
    <FamilyStack.Screen name="Visits" component={VisitsScreen} />
    {/* Detalles de visitas, agendar visita, etc. */}
  </FamilyStack.Navigator>
);

const NotificationsFamilyStack = () => (
  <FamilyStack.Navigator screenOptions={{ headerShown: false }}>
    <FamilyStack.Screen name="Notifications" component={NotificationsScreen} />
    {/* Pantalla de detalle de notificación si aplica */}
  </FamilyStack.Navigator>
);

const ProfileFamilyStack = () => (
  <FamilyStack.Navigator screenOptions={{ headerShown: false }}>
    <FamilyStack.Screen name="Profile" component={ProfileScreen} />
    {/* Edición de perfil, configuración personal */}
  </FamilyStack.Navigator>
);

const FamilyNavigator = () => {
  return (
    <FamilyTabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => (
          <TabBarIcon name={route.name} focused={focused} color={color} size={size} />
        ),
        tabBarActiveTintColor: 'blue', // Ajusta los colores a tu estilo
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <FamilyTabs.Screen name="Inicio" component={DashboardFamilyStack} />
      <FamilyTabs.Screen name="Residente" component={ResidentInfoFamilyStack} />
      <FamilyTabs.Screen name="Visitas" component={VisitsFamilyStack} />
      <FamilyTabs.Screen name="Notificaciones" component={NotificationsFamilyStack} />
      <FamilyTabs.Screen name="Perfil" component={ProfileFamilyStack} />
    </FamilyTabs.Navigator>
  );
};

export default FamilyNavigator;