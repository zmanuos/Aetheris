// AdminNavigator.js

import React, { useEffect, useRef, useState } from "react";
import { createDrawerNavigator } from "@react-navigation/drawer"
import { createStackNavigator } from "@react-navigation/stack"
import { Platform, View, Text, StyleSheet } from "react-native"
import { Audio } from 'expo-av'; // Importar la librería de audio

import AlertModal from "../components/shared/AlertModal";

import Header from "../components/navigation/Header"
import SideMenu from "../components/navigation/SideMenu"

import HomeScreen from "../screens/employee/HomeScreen"
import ResidentsScreen from "../screens/employee/ResidentsScreen"
import CombinedRegistrationScreen from "../screens/employee/CombinedRegistrationScreen"
import ResidentProfileScreen from "../screens/employee/ResidentProfileScreen"
import WeeklyCheckupDetailScreen from "../screens/employee/WeeklyCheckupDetailScreen"
import ResidentEditScreen from "../screens/employee/ResidentEditScreen"
import ChatListScreen from "../screens/employee/ChatListScreen"
import SpecificChatScreen from "../screens/employee/SpecificChatScreen"
import CreateConsultasScreen from "../screens/employee/CreateConsultasScreen"
import ConsultasHistoryScreen from "../screens/employee/ConsultasHistoryScreen"
import CheckupReportsScreen from "../screens/employee/CheckupReportsScreen"
import EmployeeManagementScreen from "../screens/admin/EmployeeManagementScreen"
import EmployeeCreationScreen from "../screens/admin/EmployeeCreationScreen"
import AsylumDataScreen from "../screens/admin/AsylumDataScreen"
import EmployeeEditScreen from "../screens/admin/EmployeeEditScreen"
import DeviceManagementScreen from "../screens/admin/DeviceManagementScreen"
import MyAccountScreen from "../components/navigation/MyAccountScreen"
import ChatGeneralScreen from "../screens/employee/ChatGeneralScreen"

import { UnreadMessagesProvider } from "../src/context/UnreadMessagesContext"

const Drawer = createDrawerNavigator()
const ResidentsStack = createStackNavigator()
const EmployeeStack = createStackNavigator()
const ChatStack = createStackNavigator()

function ResidentsStackScreen() {
  return (
    <ResidentsStack.Navigator
      initialRouteName="ResidentsList"
      screenOptions={{
        headerShown: false,
      }}
    >
      <ResidentsStack.Screen name="ResidentsList" component={ResidentsScreen} />
      <ResidentsStack.Screen name="RegisterResidentAndFamiliar" component={CombinedRegistrationScreen} />
      <ResidentsStack.Screen name="ResidentEditScreen" component={ResidentEditScreen} />
      <ResidentsStack.Screen name="ResidentProfile" component={ResidentProfileScreen} />
      <ResidentsStack.Screen name="WeeklyCheckupDetail" component={WeeklyCheckupDetailScreen} />
      <ResidentsStack.Screen name="ResidentEdit" component={ResidentEditScreen} />
    </ResidentsStack.Navigator>
  )
}

function EmployeeManagementStackScreen() {
  return (
    <EmployeeStack.Navigator
      initialRouteName="EmployeeList"
      screenOptions={{
        headerShown: false,
      }}
    >
      <EmployeeStack.Screen
        name="EmployeeList"
        component={EmployeeManagementScreen}
        options={{ title: "Gestión de Empleados" }}
      />
      <EmployeeStack.Screen
        name="CreateEmployee"
        component={EmployeeCreationScreen}
        options={{ title: "Registrar Nuevo Empleado" }}
      />
      <EmployeeStack.Screen name="EditEmployee" component={EmployeeEditScreen} options={{ title: "Editar Empleado" }} />
    </EmployeeStack.Navigator>
  )
}

function ChatStackScreen() {
  if (Platform.OS === "web") {
    return (
      <ChatStack.Navigator
        initialRouteName="ChatGeneral"
        screenOptions={{
          headerShown: false,
        }}
      >
        <ChatStack.Screen
          name="ChatGeneral"
          component={ChatGeneralScreen}
          options={{
            headerShown: false,
          }}
        />
      </ChatStack.Navigator>
    )
  } else {
    return (
      <ChatStack.Navigator
        initialRouteName="ChatList"
        screenOptions={{
          headerShown: false,
        }}
      >
        <ChatStack.Screen
          name="ChatList"
          component={ChatListScreen}
          options={{
            headerShown: true,
            header: ({ options, navigation, route }) => (
              <Header
                title={options.title || route.name}
                onMenuPress={() => navigation.toggleDrawer()}
                navigation={navigation}
              />
            ),
            title: "CHAT CON FAMILIARES",
          }}
        />
        <ChatStack.Screen
          name="SpecificChat"
          component={SpecificChatScreen}
          options={{
            headerShown: false,
          }}
        />
      </ChatStack.Navigator>
    )
  }
}

const AdminNavigator = ({ onLogout, userRole, firebaseUid }) => {
    const ws = useRef(null);
    const [isModalVisible, setModalVisible] = useState(false);
    const [currentAlert, setCurrentAlert] = useState(null);
    const soundObject = useRef(new Audio.Sound());

    const playSound = async () => {
        try {
            await soundObject.current.loadAsync(require('../assets/sounds/alerta.mp3'));
            await soundObject.current.setIsLoopingAsync(true);
            await soundObject.current.playAsync();
        } catch (error) {
            console.error("Error al reproducir el sonido de alerta:", error);
        }
    };

    const stopSound = async () => {
        try {
            if (soundObject.current) {
                await soundObject.current.stopAsync();
                await soundObject.current.unloadAsync();
            }
        } catch (error) {
            console.error("Error al detener el sonido de alerta:", error);
        }
    };

    useEffect(() => {
        ws.current = new WebSocket("ws://localhost:5214/ws"); 

        ws.current.onopen = () => {
            console.log("Conectado al servidor WebSocket.");
        };

        const handleNewAlert = (event) => {
            try {
                const alertData = JSON.parse(event.data);
                console.log("Nueva alerta recibida:", alertData);

                setCurrentAlert(alertData);
                setModalVisible(true);
                playSound(); // Iniciar la reproducción del sonido
                
            } catch (error) {
                console.error("Error al procesar el mensaje WebSocket:", error);
            }
        };

        ws.current.onmessage = handleNewAlert;

        ws.current.onerror = (e) => {
            console.error("Error en WebSocket:", e.message);
        };

        ws.current.onclose = () => {
            console.log("Conexión WebSocket cerrada.");
            // Limpieza al cerrar la conexión
            if (ws.current) {
                ws.current.close();
            }
        };

        // Limpieza del useEffect para evitar fugas de memoria
        return () => {
            if (ws.current) {
                ws.current.close();
            }
            stopSound(); // Detener el sonido si el componente se desmonta
        };
    }, []);

    const handleConfirm = () => {
        stopSound(); // Detener el sonido al confirmar la alerta
        setModalVisible(false);
        setCurrentAlert(null);
    };

    return (
        <UnreadMessagesProvider>
            <Drawer.Navigator
                initialRouteName="Home"
                drawerContent={(props) => <SideMenu {...props} onLogout={onLogout} userRole={userRole} />}
                screenOptions={({ navigation, route }) => ({
                    drawerType: Platform.OS === "web" ? "permanent" : "front",
                    drawerStyle: {
                        width: 260,
                        backgroundColor: "#fcfcfc",
                        shadowColor: "#000",
                        shadowOffset: { width: 6, height: 0 },
                        shadowOpacity: 0.05,
                        shadowRadius: 10,
                        elevation: 8,
                    },
                    headerShown: true,
                    header: ({ options }) => {
                        return (
                            <Header
                                title={options.title || route.name}
                                onMenuPress={() => navigation.toggleDrawer()}
                                navigation={navigation}
                            />
                        )
                    },
                })}
            >
                <Drawer.Screen name="Home" component={HomeScreen} options={{ title: "INICIO" }} />
                <Drawer.Screen name="Residents" component={ResidentsStackScreen} options={{ title: "GESTIÓN RESIDENTES" }} />
                <Drawer.Screen name="ChatGeneral" component={ChatStackScreen} options={{ title: "CHAT CON FAMILIARES" }} />
                <Drawer.Screen
                    name="DeviceManagement"
                    component={DeviceManagementScreen}
                    options={{ title: "GESTIÓN DE DISPOSITIVOS" }}
                />
                <Drawer.Screen
                    name="CreateConsultas"
                    component={CreateConsultasScreen}
                    options={{ title: "CREAR CONSULTAS" }}
                />
                <Drawer.Screen
                    name="ConsultasHistory"
                    component={ConsultasHistoryScreen}
                    options={{ title: "HISTORIAL DE CONSULTAS" }}
                />
                <Drawer.Screen
                    name="CheckupReports"
                    component={CheckupReportsScreen}
                    options={{ title: "REPORTES DE CHEQUEOS" }}
                />
                <Drawer.Screen
                    name="EmployeeManagement"
                    component={EmployeeManagementStackScreen}
                    options={{ title: "GESTIÓN EMPLEADOS" }}
                />
                <Drawer.Screen name="AsylumData" component={AsylumDataScreen} options={{ title: "DATOS DEL ASILO" }} />
                <Drawer.Screen
                    name="MyAccountScreen"
                    component={MyAccountScreen}
                    options={{ title: "MI CUENTA" }}
                    initialParams={{ firebaseUid: firebaseUid }}
                />
            </Drawer.Navigator>

            <AlertModal isVisible={isModalVisible} alertData={currentAlert} onConfirm={handleConfirm} />

        </UnreadMessagesProvider>
    )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e0e0e0",
  },
  sideMenuContainer: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fcfcfc",
  },
  text: {
    fontSize: 18,
    marginBottom: 10,
    color: "#333",
  },
  logoutButton: {
    fontSize: 16,
    color: "blue",
    marginTop: 20,
    textDecorationLine: "underline",
  },
})

export default AdminNavigator;