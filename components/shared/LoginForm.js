// AETHERIS/components/shared/LoginForm.js
"use client"

import React, { useState } from "react";
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
  Alert, // Importa Alert para mostrar mensajes al usuario
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

// Importa Firebase Authentication
import { auth } from '../../config/firebaseConfig'; // <-- Asegúrate que la ruta sea correcta
import { signInWithEmailAndPassword } from 'firebase/auth'; // <-- Para iniciar sesión
// Si quisieras añadir registro, también importarías:
// import { createUserWithEmailAndPassword } from 'firebase/auth';


export default function LoginForm({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Nuevo estado para indicar carga

  // Credenciales estáticas de ejemplo (PARA PRUEBAS INICIALES, LUEGO LAS QUITARÁS)
  // Estas credenciales estáticas DEBEN ser eliminadas o usadas solo para roles muy específicos
  // que no necesiten autenticación de Firebase (lo cual es raro).
  // La idea es que TODO se autentique con Firebase.
  // Pero por ahora, las dejamos para la transición.
  const FAMILY_EMAIL_STATIC = "1";
  const FAMILY_PASSWORD_STATIC = "1";
  const FAMILY_ROLE_STATIC = "admin";

  // Aquí mapearás usuarios de Firebase a roles si no gestionas roles dentro de Firebase
  // En un sistema real, los roles se gestionarían en una base de datos (Firestore/Realtime DB)
  // o a través de Custom Claims en Firebase Authentication.
  // Por simplicidad para el proyecto, haremos un mapeo básico.
  const ROLE_MAPPING = {
    "admin@aetheris.com": "admin",
    "employee@aetheris.com": "employee",
    // No incluyas '1' y '1' aquí, ya que no son cuentas de Firebase
  };

  const handleSubmit = async () => { // <--- Haz la función asíncrona
    setError("");
    setIsLoading(true); // Inicia la carga

    // Primero, intenta autenticar con Firebase
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("Firebase login successful for user:", user.email);

      // Ahora, determina el rol del usuario
      // Esta es una SIMPLIFICACIÓN. En un sistema real,
      // los roles se almacenarían en Firestore junto con el usuario,
      // o como Firebase Custom Claims para mayor seguridad.
      let assignedRole = ROLE_MAPPING[user.email] || null;

      if (assignedRole) {
        if (onLoginSuccess) {
          onLoginSuccess(assignedRole);
        }
      } else {
        // Si el usuario se autenticó pero no tiene un rol mapeado (ej. es un familiar genérico)
        // Puedes asignar un rol por defecto o pedirle que complete su perfil.
        // Para este ejemplo, si no tiene un rol específico, asumimos que es "family".
        // O podrías pedirle que se registre con un email que sí tenga un rol.
        console.warn("Usuario de Firebase autenticado sin rol específico mapeado, asignando rol por defecto 'family'.");
        if (onLoginSuccess) {
          onLoginSuccess("family"); // O el rol por defecto que quieras
        }
      }

    } catch (firebaseError) {
      // Manejo de errores de Firebase
      console.error("Firebase Login Error:", firebaseError.code, firebaseError.message);
      let errorMessage = "Error de autenticación. Inténtalo de nuevo.";

      switch (firebaseError.code) {
        case 'auth/invalid-email':
          errorMessage = 'Formato de ID/correo electrónico inválido.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Tu cuenta ha sido deshabilitada.';
          break;
        case 'auth/user-not-found':
        case 'auth/wrong-password': // Firebase devuelve 'wrong-password' si el usuario existe pero la contraseña es incorrecta
          errorMessage = 'ID o contraseña incorrectos.';
          break;
        case 'auth/invalid-credential': // Nuevo error para credenciales inválidas (para mayor seguridad)
          errorMessage = 'ID o contraseña incorrectos.';
          break;
        default:
          errorMessage = 'Ocurrió un error inesperado. Por favor, inténtalo más tarde.';
          break;
      }
      setError(errorMessage);

      // Si Firebase falla, aún podemos intentar con las credenciales estáticas (TEMPORAL)
      // ESTO SOLO DEBE SER PARA TRANSICION. EVENTUALMENTE TODO DEBERÍA IR POR FIREBASE.
      if (email === FAMILY_EMAIL_STATIC && password === FAMILY_PASSWORD_STATIC) {
        console.log("Login successful with static credentials (for family only).");
        if (onLoginSuccess) {
          onLoginSuccess(FAMILY_ROLE_STATIC);
        }
      } else {
        // Si no es Firebase ni las estáticas, entonces sí es un error
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false); // Finaliza la carga
    }
  };

  return (
    <SafeAreaView style={styles.container}>
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
                <Image
                  source={require("../../assets/images/ahorasi.png")}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>

              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>ID (Correo Electrónico)</Text> {/* Sugerencia: cambiar a "Correo Electrónico" */}
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholder="ejemplo@aetheris.com"
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
                    />
                    <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
                      <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={handleSubmit}
                  activeOpacity={0.8}
                  disabled={isLoading} // Deshabilita el botón mientras carga
                >
                  {isLoading ? (
                    <Text style={styles.loginButtonText}>Iniciando sesión...</Text>
                  ) : (
                    <Text style={styles.loginButtonText}>LOG IN</Text>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.footer}>
                <TouchableOpacity>
                  <Text style={styles.forgotPassword}>Forgot your password?</Text>
                </TouchableOpacity>
                {/* Puedes añadir un botón para registrar nuevos usuarios aquí */}
                {/* <TouchableOpacity onPress={() => console.log('Navegar a registro')}>
                  <Text style={styles.registerText}>¿No tienes cuenta? Regístrate</Text>
                </TouchableOpacity> */}
              </View>
            </View>
          </LinearGradient>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
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
    width: Platform.OS === 'web' ? 450 : 350,
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
  errorText: {
    color: 'red',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
  registerText: { // Ejemplo de estilo para un botón de registro
    fontSize: 14,
    color: '#4F46E5',
    marginTop: 10,
    fontWeight: 'bold',
  }
});