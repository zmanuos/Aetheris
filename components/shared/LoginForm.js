// LoginForm.js
"use client"
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebaseConfig';
import Config from '../../config/config';
import { useSession } from '../../src/context/SessionContext';

const API_URL = Config.API_BASE_URL;

export default function LoginForm({ navigation, onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login, session } = useSession();

  const fetchUserDetails = async (role, firebaseUid) => {
    try {
      let endpoint = '';
      let userKey = '';

      console.log(`[LoginForm] fetchUserDetails: Intentando obtener detalles para rol: ${role}, UID: ${firebaseUid}`);

      if (role === 'admin') {
        console.log("[LoginForm] Rol 'admin' detectado. No se buscarán detalles en el backend (id_personal será null).");
        return { userDetails: { nombre: "Administrador", apellido: "" }, userId: null, role: role, residentId: null };
      }
      else if (role === 'employee') {
        endpoint = `${API_URL}/Personal`;
        userKey = 'personal';
        console.log(`[LoginForm] Rol 'employee'. Endpoint: ${endpoint}`);
      }
      else if (role === 'family') {
        endpoint = `${API_URL}/Familiar/firebase/${firebaseUid}`;
        userKey = 'familiar';
        console.log(`[LoginForm] Rol 'family'. Endpoint: ${endpoint}`);
      } else {
        console.warn("[LoginForm] Rol no reconocido para obtener detalles del usuario:", role);
        return null;
      }

      console.log(`[LoginForm] Realizando fetch a: ${endpoint}`);
      const response = await fetch(endpoint);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[LoginForm] HTTP error! status: ${response.status}, response: ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`[LoginForm] Respuesta completa del endpoint para ${role}:`, data);

      let currentUser = null;

      if (role === 'employee') {
        const users = data[userKey];
        if (!Array.isArray(users)) {
          console.error(`[LoginForm] La respuesta no contiene un array en ${userKey}:`, data);
          return null;
        }
        currentUser = users.find(user =>
          user.firebase_uid === firebaseUid ||
          user.firebaseUid === firebaseUid
        );
      } else if (role === 'family') {
        // --- INICIO DE LA CORRECCIÓN ---
        // Acceder a la propiedad 'familiar' dentro de la respuesta
        currentUser = data.familiar;
        // --- FIN DE LA CORRECCIÓN ---

        if (!currentUser) {
          console.warn(`[LoginForm] Familiar con firebase_uid ${firebaseUid} no encontrado en el endpoint. Datos recibidos:`, data);
          return null;
        }
      }


      if (currentUser) {
        console.log("=== [LoginForm] DETALLES DEL USUARIO ENCONTRADO ===");
        console.log("[LoginForm] Datos completos del usuario de la API:", currentUser);

        const apiUserId = currentUser.id;
        let associatedResidentId = null;

        if (role === 'family') {
          console.log("[LoginForm] ID Familiar (desde API):", apiUserId);
          console.log("[LoginForm] Nombre completo:", `${currentUser.nombre} ${currentUser.apellido}`);
          console.log("[LoginForm] Teléfono:", currentUser.telefono);
          // --- INICIO DE LA CORRECCIÓN ADICIONAL para residentId ---
          if (currentUser.residente && currentUser.residente.id_residente) {
            console.log("[LoginForm] Residente asociado (objeto):", `${currentUser.residente.nombre} ${currentUser.residente.apellido}`);
            console.log("[LoginForm] ID Residente asociado (desde objeto residente):", currentUser.residente.id_residente);
            associatedResidentId = currentUser.residente.id_residente;
          } else if (currentUser.id_residente) { // Fallback por si id_residente está directamente en familiar (menos probable por tu curl)
            console.log("[LoginForm] ID Residente asociado (directo en familiar):", currentUser.id_residente);
            associatedResidentId = currentUser.id_residente;
          }
          // --- FIN DE LA CORRECCIÓN ADICIONAL ---
          if (currentUser.parentesco) {
            console.log("[LoginForm] Parentesco:", currentUser.parentesco.nombre);
          }
        } else if (role === 'employee') {
          console.log("[LoginForm] ID Personal (desde API):", apiUserId);
          console.log("[LoginForm] Nombre completo:", `${currentUser.nombre} ${currentUser.apellido}`);
          console.log("[LoginForm] Teléfono:", currentUser.telefono);
          console.log("[LoginForm] Activo:", currentUser.activo);
        }

        console.log("======================================");

        return {
          userDetails: currentUser,
          userId: apiUserId,
          role: role,
          residentId: associatedResidentId
        };
      } else {
        console.warn(`[LoginForm] Usuario con firebase_uid ${firebaseUid} no encontrado en el endpoint ${userKey}.`);
        return null;
      }

    } catch (error) {
      console.error(`[LoginForm] Error al obtener detalles del ${role}:`, error);
      return null;
    }
  };

  const handleSubmit = async () => {
    setError("");
    setIsLoading(true);

    if (!auth) {
      setError("Un error interno impide la autenticación. Contacta al soporte.");
      setIsLoading(false);
      return;
    }

    try {
      console.log(`[LoginForm] Intentando iniciar sesión con: ${email}`);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      console.log("=== [LoginForm] USUARIO LOGUEADO EN FIREBASE ===");
      console.log("[LoginForm] UID:", user.uid);
      console.log("[LoginForm] Email:", user.email);
      console.log("[LoginForm] Fecha de login:", new Date().toLocaleString());
      console.log("========================");

      const userLoginInfo = {
        uid: user.uid,
        email: user.email,
        loginTime: new Date().toISOString(),
        timestamp: Date.now()
      };

      console.log("[LoginForm] Objeto de información del usuario:", userLoginInfo);

      const userDocRef = doc(db, "users", user.uid);
      console.log(`[LoginForm] Buscando rol en Firestore para UID: ${user.uid}`);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const assignedRole = userData.role;

        console.log("[LoginForm] Rol asignado desde Firestore:", assignedRole);
        console.log("[LoginForm] Datos completos del usuario desde Firestore:", userData);

        if (assignedRole) {
          console.log("[LoginForm] Llamando a fetchUserDetails para obtener datos específicos del rol...");
          const userDetails = await fetchUserDetails(assignedRole, user.uid);

          if (userDetails) {
            console.log("=== [LoginForm] RESUMEN FINAL DEL LOGIN ===");
            console.log("[LoginForm] Firebase UID:", user.uid);
            console.log("[LoginForm] Email:", user.email);
            console.log("[LoginForm] Rol:", assignedRole);
            console.log("[LoginForm] ID de usuario (API, personal/familiar):", userDetails.userId);
            if (assignedRole === 'family') {
              console.log("[LoginForm] ID Residente Asociado:", userDetails.residentId);
            } else if (assignedRole === 'admin') {
              console.log("[LoginForm] ID Personal (para API - Admin):", userDetails.userId);
            }
            console.log("===============================");

            login(user.uid, assignedRole, userDetails.userId, userDetails.residentId);

            console.log(">>> Objeto de sesión DESPUÉS de iniciar sesión:", session);

            if (onLoginSuccess) {
              onLoginSuccess(assignedRole, user.uid, userDetails.userId, userDetails.residentId);
            }

          } else {
            let customErrorMessage = `Tu cuenta de ${assignedRole} no tiene un perfil asociado en la base de datos de la aplicación. `;
            customErrorMessage += "Por favor, contacta al administrador.";
            setError(customErrorMessage);
            console.error("[LoginForm] Mensaje de error: userDetails es null después de fetchUserDetails. Rol:", assignedRole);
          }
        } else {
          setError("Tu cuenta no tiene un rol asignado. Contacta al administrador.");
          console.warn("[LoginForm] La cuenta no tiene un rol asignado en Firestore.");
        }
      } else {
        setError("Tu cuenta no está completamente configurada. Contacta al administrador.");
        console.warn("[LoginForm] Documento de usuario no encontrado en Firestore.");
      }
    } catch (firebaseError) {
      console.log("=== [LoginForm] ERROR DE LOGIN ===");
      console.log("[LoginForm] Email intentado:", email);
      console.log("[LoginForm] Código de error Firebase:", firebaseError.code);
      console.log("[LoginForm] Mensaje de error Firebase:", firebaseError.message);
      console.log("======================");

      let errorMessage = "Error de autenticación. Inténtalo de nuevo.";
      if (firebaseError && firebaseError.message) {
        if (firebaseError.message.includes("can't access property \"userId\", userDetails is null")) {
          errorMessage = "No se pudieron cargar los detalles del usuario. Revisa tu rol o contacta al soporte.";
        } else {
          switch (firebaseError.code) {
            case 'auth/invalid-email':
              errorMessage = 'Formato de ID/correo electrónico inválido.';
              break;
            case 'auth/user-disabled':
              errorMessage = 'Tu cuenta ha sido deshabilitada.';
              break;
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
              errorMessage = 'ID o contraseña incorrectos.';
              break;
            default:
              errorMessage = 'Ocurrió un error inesperado. Por favor, inténtalo más tarde.';
              break;
          }
        }
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      console.log("[LoginForm] Finalizando proceso de login.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
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
                  <Text style={styles.label}>ID (Correo Electrónico)</Text>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
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
                      returnKeyType="done"
                      onSubmitEditing={handleSubmit}
                      blurOnSubmit={true}
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off" : "eye"}
                        size={20}
                        color="#9CA3AF"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={handleSubmit}
                  activeOpacity={0.8}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Text style={styles.loginButtonText}>Iniciando sesión...</Text>
                  ) : (
                    <Text style={styles.loginButtonText}>LOG IN</Text>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.footer}>
                <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
                  <Text style={styles.forgotPassword}>Forgot your password?</Text>
                </TouchableOpacity>
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
  registerText: {
    fontSize: 14,
    color: '#4F46E5',
    marginTop: 10,
    fontWeight: 'bold',
  }
});