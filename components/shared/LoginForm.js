"use client"

import React, { useState, useContext } from "react" // Importa useContext
import { AuthContext } from '../../contexts/AuthContext'; // Importa tu AuthContext
import { useNavigation } from '@react-navigation/native'; // Importa useNavigation si quieres navegar en esta pila

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
// Importa AsyncStorage y Config ya no son necesarios aquí para la versión estática
// import AsyncStorage from "@react-native-async-storage/async-storage"
// import Config from '../../config/config.js'; 

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showSuccessNotification, setShowSuccessNotification] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [fadeAnim] = useState(new Animated.Value(0))

  // Accede a la función signIn de tu AuthContext
  const { signIn } = useContext(AuthContext);
  const navigation = useNavigation(); // Hook de navegación, útil si necesitas navegar dentro de la pila Auth

  // Eliminamos API_AUTH_BASE_URL ya que no haremos fetch directo aquí.
  // const API_AUTH_BASE_URL = `${Config.API_BASE_URL}/auth`; 

  const showSuccess = (message) => {
    setSuccessMessage(message)
    setShowSuccessNotification(true)

    // Animación de entrada
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(3000),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSuccessNotification(false)
      // No necesitamos navigation.navigate('Home') aquí.
      // El AppNavigator se encargará de cambiar la pila de navegación
      // automáticamente cuando el AuthContext actualice su estado de autenticación.
    })
  }

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      // Aquí podrías mostrar un mensaje de error si los campos están vacíos
      console.warn("Por favor, ingresa tu ID y contraseña.");
      return;
    }

    setLoading(true);

    try {
      // Llama a la función signIn de tu AuthContext
      const result = await signIn(email.trim().toLowerCase(), password);

      if (result.success) {
        // En la versión estática, userToken y userRole ya se guardan en el contexto
        // No necesitamos AsyncStorage.setItem aquí directamente.
        // await AsyncStorage.setItem("authToken", data.data.token)
        // await AsyncStorage.setItem("userData", JSON.stringify(data.data.user))

        // Puedes simular el nombre de usuario para el mensaje de éxito
        const userName = email.split('@')[0]; // Simple simulación
        showSuccess(`¡Bienvenido ${userName}!`);

        setEmail("");
        setPassword("");

      } else {
        // Muestra el mensaje de error que viene de AuthContext (e.g., 'Credenciales incorrectas')
        console.error("Error de autenticación:", result.error);
        // Aquí podrías mostrar un mensaje de error al usuario en la interfaz
      }
    } catch (error) {
      console.error("Error inesperado durante el login:", error);
      // Aquí podrías mostrar un mensaje de error general al usuario
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {showSuccessNotification && (
        <Animated.View style={[styles.successNotification, { opacity: fadeAnim }]}>
          <View style={styles.successContent}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        </Animated.View>
      )}

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView}>
        <View style={styles.formContainer}>
          <LinearGradient
            colors={["#3B82F6", "#10B981", "#2563EB"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientBorder}
          >
            <View style={styles.innerContainer}>
              <View style={styles.logoContainer}>
                <Image source={require("../../assets/images/ahorasi.png")} style={styles.logo} resizeMode="contain" />
              </View>

              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>ID</Text>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholder=""
                    editable={!loading}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>PASSWORD</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      placeholder=""
                      editable={!loading}
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowPassword(!showPassword)}
                      disabled={loading}
                    >
                      <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                  onPress={handleSubmit}
                  activeOpacity={0.8}
                  disabled={loading}
                >
                  {loading ? (
                    <Text style={styles.loginButtonText}>CONECTANDO...</Text>
                  ) : (
                    <Text style={styles.loginButtonText}>LOG IN</Text>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.footer}>
                <TouchableOpacity
                  disabled={loading}
                  // Aquí puedes añadir la acción para navegar a ForgotPasswordScreen
                  onPress={() => navigation.navigate('ForgotPassword')}
                >
                  <Text style={[styles.forgotPassword, loading && styles.textDisabled]}>Forgot your password?</Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  successNotification: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 40,
    left: 16,
    right: 16,
    zIndex: 1000,
    backgroundColor: "#ECFDF5",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#10B981",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  successContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  successText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: "600",
    color: "#059669",
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },
  formContainer: {
    alignItems: "center",
  },
  gradientBorder: {
    borderRadius: 8,
    padding: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  innerContainer: {
    backgroundColor: "white",
    borderRadius: 6,
    padding: 32,
    width: Platform.OS === "web" ? 450 : 350,
    maxWidth: "100%",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 5,
    marginTop: 10,
  },
  logo: {
    width: 270,
    height: 130,
  },
  form: {
    marginBottom: 6,
  },
  inputGroup: {
    marginBottom: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
    color: "#374151",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 6,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "white",
  },
  passwordContainer: {
    position: "relative",
  },
  passwordInput: {
    height: 48,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingRight: 48,
    fontSize: 16,
    backgroundColor: "white",
  },
  eyeButton: {
    position: "absolute",
    right: 16,
    top: 14,
  },
  loginButton: {
    backgroundColor: "#4F46E5",
    height: 48,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 32,
  },
  loginButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  loginButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  footer: {
    alignItems: "center",
  },
  forgotPassword: {
    fontSize: 14,
    color: "#6B7280",
  },
  textDisabled: {
    color: "#D1D5DB",
  },
})