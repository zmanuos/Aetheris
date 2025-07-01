// AETHERIS/navigation/AdminNavigator.js
import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';

import Header from '../components/navigation/Header';
import SideMenu from '../components/navigation/SideMenu'; 

// Importa las pantallas comunes (que pueden tener lógica condicional interna si es necesario)
import HomeScreen from '../screens/employee/HomeScreen';
import ResidentsScreen from '../screens/employee/ResidentsScreen';
import CreateConsultasScreen from '../screens/employee/CreateConsultasScreen';
import ConsultasHistoryScreen from '../screens/employee/ConsultasHistoryScreen';
import CheckupReportsScreen from '../screens/employee/CheckupReportsScreen';

// Importa las NUEVAS pantallas específicas de Admin
import EmployeeManagementScreen from '../screens/admin/EmployeeManagementScreen';
import AsylumDataScreen from '../screens/admin/AsylumDataScreen';

const Drawer = createDrawerNavigator();

const AdminNavigator = ({ onLogout, userRole }) => { // Recibe userRole aquí
  return (
    <Drawer.Navigator
      initialRouteName="Home"
      // Pasa onLogout Y userRole al SideMenu UNIFICADO
      drawerContent={(props) => <SideMenu {...props} onLogout={onLogout} userRole={userRole} />}
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
      {/* Pantallas comunes para Admin y Employee */}
      <Drawer.Screen name="Home" component={HomeScreen} options={{ title: 'INICIO' }} />
      <Drawer.Screen name="Residents" component={ResidentsScreen} options={{ title: 'RESIDENTES' }} />
      <Drawer.Screen name="CreateConsultas" component={CreateConsultasScreen} options={{ title: 'CREAR CONSULTAS' }} />
      <Drawer.Screen name="ConsultasHistory" component={ConsultasHistoryScreen} options={{ title: 'HISTORIAL DE CONSULTAS' }} />
      <Drawer.Screen name="CheckupReports" component={CheckupReportsScreen} options={{ title: 'REPORTES DE CHEQUEOS' }} />

      {/* NUEVAS Pantallas ESPECÍFICAS DE ADMIN */}
      <Drawer.Screen name="EmployeeManagement" component={EmployeeManagementScreen} options={{ title: 'GESTIÓN EMPLEADOS' }} />
      <Drawer.Screen name="AsylumData" component={AsylumDataScreen} options={{ title: 'DATOS DEL ASILO' }} />
    </Drawer.Navigator>
  );
};

export default AdminNavigator;