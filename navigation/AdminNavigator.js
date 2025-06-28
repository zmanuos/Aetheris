import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';

// UI
import Header from '../components/navigation/Header';
import SideMenu from '../components/navigation/SideMenu'; 

// Importa todas tus pantallas
import HomeScreen from '../screens/admin/HomeScreen';
import ResidentsScreen from '../screens/admin/ResidentsScreen';
import CreateConsultasScreen from '../screens/admin/CreateConsultasScreen';
import ConsultasHistoryScreen from '../screens/admin/ConsultasHistory';
import CheckupReportsScreen from '../screens/admin/CheckupReportsScreen';

const Drawer = createDrawerNavigator();

// MODIFICACIÓN CLAVE: AdminNavigator debe recibir 'onLogout'
const AdminNavigator = ({ onLogout }) => { 
  return (
    <Drawer.Navigator
      initialRouteName="Home"
      drawerContent={(props) => <SideMenu {...props} onLogout={onLogout} />} 
      screenOptions={({ navigation, route }) => ({
        drawerType: 'permanent',
        drawerStyle: {
          width: 260,
          backgroundColor: '#fcfcfc',
          shadowColor: '#000',
          shadowOffset: { width: 6, height: 0 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 8,
        },
        headerShown: true,
        header: ({ options }) => (
          <Header
            title={options.title || route.name}
            onMenuPress={() => navigation.toggleDrawer()}
          />
        ),
      })}
    >
      <Drawer.Screen name="Home" component={HomeScreen} options={{ title: 'HOME' }} />
      <Drawer.Screen name="Residents" component={ResidentsScreen} options={{ title: 'RESIDENTES' }} />
      <Drawer.Screen name="CreateConsultas" component={CreateConsultasScreen} options={{ title: 'CREAR CONSULTAS' }} />
      <Drawer.Screen name="ConsultasHistory" component={ConsultasHistoryScreen} options={{ title: 'HISTORIAL DE CONSULTAS' }} />
      <Drawer.Screen name="CheckupReports" component={CheckupReportsScreen} options={{ title: 'REPORTES DE CHEQUEOS' }} />
    </Drawer.Navigator>
  );
};

export default AdminNavigator;