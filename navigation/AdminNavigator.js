// AETHERIS/navigation/AdminNavigator.js

import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { Platform } from 'react-native';
import Header from '../components/navigation/Header';
import SideMenu from '../components/navigation/SideMenu';
import HomeScreen from '../screens/employee/HomeScreen';
import ResidentsScreen from '../screens/employee/ResidentsScreen';
import CombinedRegistrationScreen from '../screens/employee/CombinedRegistrationScreen';
import ResidentProfileScreen from '../screens/employee/ResidentProfileScreen'; // Asegúrate de que esta sea la importación correcta
import WeeklyCheckupDetailScreen from '../screens/employee/WeeklyCheckupDetailScreen';
import CreateConsultasScreen from '../screens/employee/CreateConsultasScreen';
import ConsultasHistoryScreen from '../screens/employee/ConsultasHistoryScreen';
import CheckupReportsScreen from '../screens/employee/CheckupReportsScreen';
import EmployeeManagementScreen from '../screens/admin/EmployeeManagementScreen';
import EmployeeCreationScreen from '../screens/admin/EmployeeCreationScreen';
import AsylumDataScreen from '../screens/admin/AsylumDataScreen';
import EmployeeEditScreen from '../screens/admin/EmployeeEditScreen';
import DeviceManagementScreen from '../screens/admin/DeviceManagementScreen';
import MyAccountScreen from '../components/navigation/MyAccountScreen';
import ResidentEditScreen from '../screens/employee/ResidentEditScreen';

const Drawer = createDrawerNavigator();
const ResidentStack = createStackNavigator();
const EmployeeManagementStack = createStackNavigator();

const ResidentsStackScreen = ({ currentUserRole, currentUserId }) => { // Recibe props de App.js
  return (
    <ResidentStack.Navigator screenOptions={{ headerShown: false }}>
      <ResidentStack.Screen
        name="ResidentsList"
        options={{ title: 'Residentes' }}
      >
        {(props) => (
          <ResidentsScreen
            {...props}
            currentUserRole={currentUserRole}
            currentUserId={currentUserId}
          />
        )}
      </ResidentStack.Screen>
      <ResidentStack.Screen
        name="CombinedRegistration"
        options={{ title: 'Registro' }}
        component={CombinedRegistrationScreen}
      />
      <ResidentStack.Screen
        name="ResidentProfile"
        options={{ title: 'Perfil del Residente' }}
      >
        {(props) => (
          <ResidentProfileScreen // ESTA ES LA PANTALLA PARA ADMIN/EMPLOYEE
            {...props}
            currentUserRole={currentUserRole}
            currentUserId={currentUserId}
          />
        )}
      </ResidentStack.Screen>
      <ResidentStack.Screen
        name="WeeklyCheckupDetail"
        options={{ title: 'Detalle de Chequeo Semanal' }}
        component={WeeklyCheckupDetailScreen}
      />
      <ResidentStack.Screen
        name="ResidentEdit"
        options={{ title: 'Editar Residente' }}
        component={ResidentEditScreen}
      />
    </ResidentStack.Navigator>
  );
};

const EmployeeManagementStackScreen = () => {
  return (
    <EmployeeManagementStack.Navigator screenOptions={{ headerShown: false }}>
      <EmployeeManagementStack.Screen
        name="EmployeeList"
        options={{ title: 'Gestión de Empleados' }}
        component={EmployeeManagementScreen}
      />
      <EmployeeManagementStack.Screen
        name="EmployeeCreation"
        options={{ title: 'Crear Empleado' }}
        component={EmployeeCreationScreen}
      />
      <EmployeeManagementStack.Screen
        name="EmployeeEdit"
        options={{ title: 'Editar Empleado' }}
        component={EmployeeEditScreen}
      />
    </EmployeeManagementStack.Navigator>
  );
};

const AdminNavigator = ({ onLogout, userRole, firebaseUid, apiUserId }) => {
  return (
    <Drawer.Navigator
      initialRouteName="Home"
      drawerContent={(props) => <SideMenu {...props} onLogout={onLogout} userRole={userRole} />}
      screenOptions={({ navigation, route }) => ({
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
      <Drawer.Screen name="Residents" options={{ title: 'GESTIÓN RESIDENTES' }}>
        {(props) => (
          <ResidentsStackScreen
            {...props}
            currentUserRole={userRole}
            currentUserId={apiUserId} // ¡Aquí pasamos el ID numérico de la API!
          />
        )}
      </Drawer.Screen>
      <Drawer.Screen
        name="DeviceManagement" component={DeviceManagementScreen} options={{ title: 'GESTIÓN DE DISPOSITIVOS' }}
      />
      <Drawer.Screen name="CreateConsultas" component={CreateConsultasScreen} options={{ title: 'CREAR CONSULTAS' }} />
      <Drawer.Screen name="ConsultasHistory" component={ConsultasHistoryScreen} options={{ title: 'HISTORIAL DE CONSULTAS' }} />
      <Drawer.Screen name="CheckupReports" component={CheckupReportsScreen} options={{ title: 'REPORTES DE CHEQUEOS' }} />
      <Drawer.Screen
        name="EmployeeManagement"
        component={EmployeeManagementStackScreen}
        options={{ title: 'GESTIÓN EMPLEADOS' }}
      />
      <Drawer.Screen name="AsylumData" component={AsylumDataScreen} options={{ title: 'DATOS DEL ASILO' }} />
      <Drawer.Screen
        name="MyAccountScreen"
        component={MyAccountScreen}
        options={{ title: 'MI CUENTA' }}
        initialParams={{ firebaseUid: firebaseUid }}
      />
    </Drawer.Navigator>
  );
};

export default AdminNavigator;