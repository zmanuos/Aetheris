// AETHERIS/navigation/FamilyNavigator.js
import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { Platform } from 'react-native'; // <--- ¡Importa Platform aquí!

import Header from '../components/navigation/Header';
import SideMenu from '../components/navigation/SideMenu'; 
import HeartRateHistoryScreen from '../screens/family/HeartRateHistoryScreen';
import WeeklyCheckupsHistoryScreen from '../screens/family/WeeklyCheckupsHistoryScreen';
import AsylumInfoScreen from '../screens/family/AsylumInfoScreen';
import WeeklyCheckupDetailScreen from '../screens/employee/WeeklyCheckupDetailScreen';
import FamilyChatScreen from '../screens/family/FamilyChatScreen'; 
import FamilyResidentProfileScreen from '../screens/family/FamilyResidentProfileScreen'; 

// Importar el nuevo proveedor de contexto
import { UnreadMessagesProvider } from "../src/context/UnreadMessagesContext";

const Drawer = createDrawerNavigator();
const FamilyStack = createStackNavigator();

const FamilyNavigator = ({ onLogout, userRole, currentUserId, loggedInResidentId }) => { 
  console.log(`[FamilyNavigator] Recibiendo props - userRole: ${userRole}, currentUserId: ${currentUserId}, loggedInResidentId: ${loggedInResidentId}`);
  return (
    // ¡Envuelve el Drawer.Navigator con el UnreadMessagesProvider!
    <UnreadMessagesProvider>
      <Drawer.Navigator
        initialRouteName="FamilyResidentProfile"
        drawerContent={(props) => <SideMenu {...props} onLogout={onLogout} userRole={userRole} />}
        screenOptions={({ navigation, route }) => ({
          // MODIFICACIÓN CLAVE AQUÍ: Usar Platform.OS
          drawerType: Platform.OS === 'web' ? 'permanent' : 'front', 
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
        <Drawer.Screen
          name="FamilyResidentProfile"
          options={{ title: 'Home' }}
        >
          {(props) => (
            <FamilyResidentProfileScreen
              {...props}
              residentId={loggedInResidentId}
              currentUserRole={userRole}
              currentUserId={currentUserId}
            />
          )}
        </Drawer.Screen>

        <Drawer.Screen name="HeartRateHistory" component={HeartRateHistoryScreen} options={{ title: 'RITMO CARDÍACO' }} />
        <Drawer.Screen name="AsylumInfo" component={AsylumInfoScreen} options={{ title: 'INFO DEL ASILO' }} />
        <Drawer.Screen 
          name="WeeklyCheckupDetail" 
          component={WeeklyCheckupDetailScreen} 
          options={{ title: 'DETALLE DE CHEQUEO SEMANAL' }} 
        />
        <Drawer.Screen name="FamilyChatContainer" options={{ title: 'CHAT CON EL ASILO' }}>
          {(props) => (
            <FamilyChatScreen
              {...props}
              currentUserRole={userRole}
              currentUserId={currentUserId}
              residentId={loggedInResidentId}
            />
          )}
        </Drawer.Screen>
      </Drawer.Navigator>
    </UnreadMessagesProvider>
  );
};

export default FamilyNavigator;