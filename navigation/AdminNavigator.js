// AdminNavigator.js

import React, { useEffect, useRef, useState } from "react";
import { createDrawerNavigator } from "@react-navigation/drawer"
import { createStackNavigator } from "@react-navigation/stack"
import { Platform, View, Text, StyleSheet } from "react-native"
import { Audio } from 'expo-av';

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
import { useUnreadMessages } from "../src/context/UnreadMessagesContext"

const Drawer = createDrawerNavigator()
const ResidentsStack = createStackNavigator()
const EmployeeStack = createStackNavigator()
const ChatStack = createStackNavigator()

function ResidentsStackScreen() {
  return React.createElement(ResidentsStack.Navigator, {
    initialRouteName: "ResidentsList",
    screenOptions: {
      headerShown: false,
    }
  }, React.createElement(ResidentsStack.Screen, {
    name: "ResidentsList",
    component: ResidentsScreen
  }), React.createElement(ResidentsStack.Screen, {
    name: "RegisterResidentAndFamiliar",
    component: CombinedRegistrationScreen
  }), React.createElement(ResidentsStack.Screen, {
    name: "ResidentEditScreen",
    component: ResidentEditScreen
  }), React.createElement(ResidentsStack.Screen, {
    name: "ResidentProfile",
    component: ResidentProfileScreen
  }), React.createElement(ResidentsStack.Screen, {
    name: "WeeklyCheckupDetail",
    component: WeeklyCheckupDetailScreen
  }), React.createElement(ResidentsStack.Screen, {
    name: "ResidentEdit",
    component: ResidentEditScreen
  }));
}

function EmployeeManagementStackScreen() {
  return React.createElement(EmployeeStack.Navigator, {
    initialRouteName: "EmployeeList",
    screenOptions: {
      headerShown: false,
    }
  }, React.createElement(EmployeeStack.Screen, {
    name: "EmployeeList",
    component: EmployeeManagementScreen,
    options: {
      title: "Gestión de Empleados"
    }
  }), React.createElement(EmployeeStack.Screen, {
    name: "CreateEmployee",
    component: EmployeeCreationScreen,
    options: {
      title: "Registrar Nuevo Empleado"
    }
  }), React.createElement(EmployeeStack.Screen, {
    name: "EditEmployee",
    component: EmployeeEditScreen,
    options: {
      title: "Editar Empleado"
    }
  }));
}

function ChatStackScreen() {
  if (Platform.OS === "web") {
    return React.createElement(ChatStack.Navigator, {
      initialRouteName: "ChatGeneral",
      screenOptions: {
        headerShown: false,
      }
    }, React.createElement(ChatStack.Screen, {
      name: "ChatGeneral",
      component: ChatGeneralScreen,
      options: {
        headerShown: false,
      }
    }));
  } else {
    return React.createElement(ChatStack.Navigator, {
      initialRouteName: "ChatList",
      screenOptions: {
        headerShown: false,
      }
    }, React.createElement(ChatStack.Screen, {
      name: "ChatList",
      component: ChatListScreen,
      options: {
        headerShown: true,
        header: ({
          options,
          navigation,
          route
        }) => React.createElement(Header, {
          title: options.title || route.name,
          onMenuPress: () => navigation.toggleDrawer(),
          navigation: navigation
        }),
        title: "CHAT CON FAMILIARES",
      }
    }), React.createElement(ChatStack.Screen, {
      name: "SpecificChat",
      component: SpecificChatScreen,
      options: {
        headerShown: false,
      }
    }));
  }
}

const AdminNavigator = ({ onLogout, userRole, firebaseUid }) => {
    const ws = useRef(null);
    const [isModalVisible, setModalVisible] = useState(false);
    const [currentAlert, setCurrentAlert] = useState(null);
    const soundObject = useRef(new Audio.Sound());
    const { totalUnreadCount, setTotalUnreadCount } = useUnreadMessages();

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
                playSound();
                setTotalUnreadCount(prevCount => prevCount + 1);
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
            if (ws.current) {
                ws.current.close();
            }
        };

        return () => {
            if (ws.current) {
                ws.current.close();
            }
            stopSound();
        };
    }, []);

    const handleConfirm = () => {
        stopSound();
        setModalVisible(false);
        setCurrentAlert(null);
    };

    return React.createElement(React.Fragment, null, React.createElement(Drawer.Navigator, {
      initialRouteName: "Home",
      drawerContent: (props) => React.createElement(SideMenu, { ...props,
        onLogout: onLogout,
        userRole: userRole
      }),
      screenOptions: ({
        navigation,
        route
      }) => ({
        drawerType: Platform.OS === "web" ? "permanent" : "front",
        drawerStyle: {
          width: 260,
          backgroundColor: "#fcfcfc",
          shadowColor: "#000",
          shadowOffset: {
            width: 6,
            height: 0
          },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 8,
        },
        headerShown: true,
        header: ({
          options
        }) => {
          return React.createElement(Header, {
            title: options.title || route.name,
            onMenuPress: () => navigation.toggleDrawer(),
            navigation: navigation,
            newNotificationsCount: totalUnreadCount,
            onResetUnreadCount: () => setTotalUnreadCount(0)
          });
        },
      })
    }, React.createElement(Drawer.Screen, {
      name: "Home",
      component: HomeScreen,
      options: {
        title: "INICIO"
      }
    }), React.createElement(Drawer.Screen, {
      name: "Residents",
      component: ResidentsStackScreen,
      options: {
        title: "GESTIÓN RESIDENTES"
      }
    }), React.createElement(Drawer.Screen, {
      name: "ChatGeneral",
      component: ChatStackScreen,
      options: {
        title: "CHAT CON FAMILIARES"
      }
    }), React.createElement(Drawer.Screen, {
      name: "DeviceManagement",
      component: DeviceManagementScreen,
      options: {
        title: "GESTIÓN DE DISPOSITIVOS"
      }
    }), React.createElement(Drawer.Screen, {
      name: "CreateConsultas",
      component: CreateConsultasScreen,
      options: {
        title: "CREAR CONSULTAS"
      }
    }), React.createElement(Drawer.Screen, {
      name: "ConsultasHistory",
      component: ConsultasHistoryScreen,
      options: {
        title: "HISTORIAL DE CONSULTAS"
      }
    }), React.createElement(Drawer.Screen, {
      name: "CheckupReports",
      component: CheckupReportsScreen,
      options: {
        title: "REPORTES DE CHEQUEOS"
      }
    }), React.createElement(Drawer.Screen, {
      name: "EmployeeManagement",
      component: EmployeeManagementStackScreen,
      options: {
        title: "GESTIÓN EMPLEADOS"
      }
    }), React.createElement(Drawer.Screen, {
      name: "AsylumData",
      component: AsylumDataScreen,
      options: {
        title: "DATOS DEL ASILO"
      }
    }), React.createElement(Drawer.Screen, {
      name: "MyAccountScreen",
      component: MyAccountScreen,
      options: {
        title: "MI CUENTA"
      },
      initialParams: {
        firebaseUid: firebaseUid
      }
    })), React.createElement(AlertModal, {
      isVisible: isModalVisible,
      alertData: currentAlert,
      onConfirm: handleConfirm
    }));
};

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
});

export default AdminNavigator;