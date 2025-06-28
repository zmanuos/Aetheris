// AETHERIS/navigation/FamilyNavigator.js
import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';

// Importa los componentes de UI/navegación
import Header from '../components/navigation/Header'; 
import FamilySideMenu from '../components/navigation/FamilySideMenu'; 

// Importa las pantallas específicas del familiar
import FamilyDashboardScreen from '../screens/family/FamilyDashboardScreen';
import HeartRateHistoryScreen from '../screens/family/HeartRateHistoryScreen';
import WeeklyCheckupsHistoryScreen from '../screens/family/WeeklyCheckupsHistoryScreen';
import AsylumInfoScreen from '../screens/family/AsylumInfoScreen';


const Drawer = createDrawerNavigator();

// MODIFICACIÓN CLAVE: FamilyNavigator debe recibir 'onLogout'
const FamilyNavigator = ({ onLogout }) => { 
  return (
    <Drawer.Navigator
      initialRouteName="FamilyDashboard" 
      // MODIFICACIÓN: Pasa onLogout al FamilySideMenu
      drawerContent={(props) => <FamilySideMenu {...props} onLogout={onLogout} />} 
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
      {/* Pantallas para el familiar */}
      <Drawer.Screen name="FamilyDashboard" component={FamilyDashboardScreen} options={{ title: 'DASHBOARD FAMILIAR' }} />
      <Drawer.Screen name="HeartRateHistory" component={HeartRateHistoryScreen} options={{ title: 'RITMO CARDÍACO' }} />
      <Drawer.Screen name="WeeklyCheckupsHistory" component={WeeklyCheckupsHistoryScreen} options={{ title: 'CHEQUEOS SEMANALES' }} />
      <Drawer.Screen name="AsylumInfo" component={AsylumInfoScreen} options={{ title: 'INFO DEL ASILO' }} />
    </Drawer.Navigator>
  );
};

export default FamilyNavigator;