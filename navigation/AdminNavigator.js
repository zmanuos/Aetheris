// navigation/AdminNavigator.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';

const AdminStack = createStackNavigator();
const AdminDrawer = createDrawerNavigator();

// --- Navegación por Stack para cada sección principal si es necesario ---
// Puedes anidar stacks dentro del Drawer para tener navegación interna en cada sección.

const DashboardStack = () => (
  <AdminStack.Navigator screenOptions={{ headerShown: false }}>
    <AdminStack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
    {/* Podrías añadir más pantallas relacionadas con el dashboard aquí */}
  </AdminStack.Navigator>
);

const ResidentsStack = () => (
  <AdminStack.Navigator screenOptions={{ headerShown: false }}>
    <AdminStack.Screen name="ResidentsManagement" component={ResidentsManagementScreen} />
    {/* Por ejemplo, una pantalla de detalle de residente: */}
    {/* <AdminStack.Screen name="ResidentDetail" component={ResidentDetailScreen} /> */}
  </AdminStack.Navigator>
);

const UsersStack = () => (
  <AdminStack.Navigator screenOptions={{ headerShown: false }}>
    <AdminStack.Screen name="UsersManagement" component={UsersManagementScreen} />
    {/* Por ejemplo, una pantalla de detalle de usuario: */}
    {/* <AdminStack.Screen name="UserDetail" component={UserDetailScreen} /> */}
  </AdminStack.Navigator>
);

const ReportsStack = () => (
  <AdminStack.Navigator screenOptions={{ headerShown: false }}>
    <AdminStack.Screen name="Reports" component={ReportsScreen} />
  </AdminStack.Navigator>
);

const SettingsStack = () => (
  <AdminStack.Navigator screenOptions={{ headerShown: false }}>
    <AdminStack.Screen name="Settings" component={SettingsScreen} />
  </AdminStack.Navigator>
);

const AdminNavigator = () => {
  return (
    <AdminDrawer.Navigator
      initialRouteName="Dashboard"
      screenOptions={{ headerShown: false }} // Controla si el header de la navegación principal se muestra
      drawerContent={props => <CustomDrawerContent {...props} />} // Si usas un componente de cajón personalizado
    >
      <AdminDrawer.Screen name="Dashboard" component={DashboardStack} />
      <AdminDrawer.Screen name="Residentes" component={ResidentsStack} />
      <AdminDrawer.Screen name="Usuarios" component={UsersStack} />
      <AdminDrawer.Screen name="Reportes" component={ReportsStack} />
      <AdminDrawer.Screen name="Configuración" component={SettingsStack} />
    </AdminDrawer.Navigator>
  );
};

export default AdminNavigator;