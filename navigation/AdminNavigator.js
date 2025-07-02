// AETHERIS/navigation/AdminNavigator.js
import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';

import Header from '../components/navigation/Header';
import SideMenu from '../components/navigation/SideMenu';

// Importa las pantallas
import HomeScreen from '../screens/employee/HomeScreen';
import ResidentsScreen from '../screens/employee/ResidentsScreen';
import ResidentRegistrationScreen from '../screens/employee/ResidentRegistrationScreen'; 
import FamiliarRegistrationScreen from '../screens/employee/FamiliarRegistrationScreen'; // Esta es la pantalla clave
import CreateConsultasScreen from '../screens/employee/CreateConsultasScreen';
import ConsultasHistoryScreen from '../screens/employee/ConsultasHistoryScreen';
import CheckupReportsScreen from '../screens/employee/CheckupReportsScreen';

// Importa las pantallas específicas de Admin
import EmployeeManagementScreen from '../screens/admin/EmployeeManagementScreen';
import AsylumDataScreen from '../screens/admin/AsylumDataScreen';

const Drawer = createDrawerNavigator();
const ResidentsStack = createStackNavigator();

function ResidentsStackScreen() {
  return (
    <ResidentsStack.Navigator
      initialRouteName="ResidentsList"
      screenOptions={{
        headerShown: false,
      }}
    >
      <ResidentsStack.Screen name="ResidentsList" component={ResidentsScreen} />
      
      {/* La pantalla de registro de nuevo residente */}
      <ResidentsStack.Screen name="RegisterResident" component={ResidentRegistrationScreen} />

      {/* LA LÍNEA QUE SE AJUSTÓ EN LA NAVEGACIÓN */}
      <ResidentsStack.Screen 
        name="FamiliarRegistrationScreen" // <-- ¡Aquí se ajustó el nombre para coincidir!
        component={FamiliarRegistrationScreen} 
      />

    </ResidentsStack.Navigator>
  );
}


const AdminNavigator = ({ onLogout, userRole }) => {
  return (
    <Drawer.Navigator
      initialRouteName="Home"
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
      <Drawer.Screen name="Home" component={HomeScreen} options={{ title: 'INICIO' }} />
      
      <Drawer.Screen name="Residents" component={ResidentsStackScreen} options={{ title: 'GESTIÓN RESIDENTES' }} />
      
      <Drawer.Screen name="CreateConsultas" component={CreateConsultasScreen} options={{ title: 'CREAR CONSULTAS' }} />
      <Drawer.Screen name="ConsultasHistory" component={ConsultasHistoryScreen} options={{ title: 'HISTORIAL DE CONSULTAS' }} />
      <Drawer.Screen name="CheckupReports" component={CheckupReportsScreen} options={{ title: 'REPORTES DE CHEQUEOS' }} />

      <Drawer.Screen name="EmployeeManagement" component={EmployeeManagementScreen} options={{ title: 'GESTIÓN EMPLEADOS' }} />
      <Drawer.Screen name="AsylumData" component={AsylumDataScreen} options={{ title: 'DATOS DEL ASILO' }} />
    </Drawer.Navigator>
  );
};

export default AdminNavigator;