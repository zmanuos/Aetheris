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

const API_URL = Config.API_BASE_URL;

export default function LoginForm({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchUserDetails = async (role, firebaseUid) => {
    try {
      let endpoint = '';
      let userKey = '';
      
      // MODIFICADO: Si el rol es 'admin', no se busca en el backend.
      // Se asume que el admin no necesita un id_personal numérico en la API de notas.
      if (role === 'admin') {
        console.log("Rol 'admin' detectado. No se buscarán detalles en el backend (id_personal será null).");
        return { userDetails: { nombre: "Administrador", apellido: "" }, userId: null, role: role };
      } 
      // Para 'employee', se busca en el endpoint /Personal
      else if (role === 'employee') {
        endpoint = `${API_URL}/Personal`;
        userKey = 'personal';
      } 
      // Para 'family', se busca en el endpoint /Familiar
      else if (role === 'family') {
        endpoint = `${API_URL}/Familiar`;
        userKey = 'familiares';
      } else {
        console.log("Rol no reconocido para obtener detalles del usuario:", role);
        return null;
      }

      console.log(`Obteniendo detalles del ${role}...`);
      console.log("Endpoint:", endpoint);

      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`Respuesta completa del endpoint ${userKey}:`, data);

      const users = data[userKey];
      
      if (!Array.isArray(users)) {
        console.error(`La respuesta no contiene un array en ${userKey}:`, data);
        return null;
      }

      const currentUser = users.find(user => 
        user.firebase_uid === firebaseUid || 
        user.firebaseUid === firebaseUid
      );

      if (currentUser) {
        console.log("=== DETALLES DEL USUARIO ENCONTRADO ===");
        console.log("Datos completos:", currentUser);
        
        const apiUserId = currentUser.id; // Asumimos que 'id' es el ID numérico en tu API

        if (role === 'employee') { 
          console.log("ID Personal:", apiUserId);
          console.log("Nombre completo:", `${currentUser.nombre} ${currentUser.apellido}`);
          console.log("Teléfono:", currentUser.telefono);
          console.log("Activo:", currentUser.activo);
        } else if (role === 'family') {
          console.log("ID Familiar:", apiUserId);
          console.log("Nombre completo:", `${currentUser.nombre} ${currentUser.apellido}`);
          console.log("Teléfono:", currentUser.telefono);
          if (currentUser.residente) {
            console.log("Residente asociado:", `${currentUser.residente.nombre} ${currentUser.residente.apellido}`);
            console.log("ID Residente:", currentUser.residente.id_residente);
          }
          if (currentUser.parentesco) {
            console.log("Parentesco:", currentUser.parentesco.nombre);
          }
        }
        
        console.log("======================================");
        
        return {
          userDetails: currentUser,
          userId: apiUserId, // Este será el id_personal numérico para empleado, o id_familiar para familiar
          role: role
        };
      } else {
        console.warn(`Usuario con firebase_uid ${firebaseUid} no encontrado en el endpoint ${userKey}.`);
        // Si el usuario (empleado o familiar) no se encuentra en su tabla correspondiente,
        // retornamos null para que el login falle.
        return null;
      }

    } catch (error) {
      console.error(`Error al obtener detalles del ${role}:`, error);
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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      console.log("=== USUARIO LOGUEADO ===");
      console.log("UID:", user.uid);
      console.log("Email:", user.email);
      console.log("Fecha de login:", new Date().toLocaleString());
      console.log("========================");

      const userLoginInfo = {
        uid: user.uid,
        email: user.email,
        loginTime: new Date().toISOString(),
        timestamp: Date.now()
      };
      
      console.log("Objeto de información del usuario:", userLoginInfo);

      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const assignedRole = userData.role;

        console.log("Rol asignado:", assignedRole);
        console.log("Datos completos del usuario:", userData);

        if (assignedRole) {
          const userDetails = await fetchUserDetails(assignedRole, user.uid);
          
          if (userDetails) {
            console.log("=== RESUMEN FINAL DEL LOGIN ===");
            console.log("Firebase UID:", user.uid);
            console.log("Email:", user.email);
            console.log("Rol:", assignedRole);
            
            if (assignedRole === 'employee') {
              console.log("ID Personal (para API):", userDetails.userId);
            } else if (assignedRole === 'family') {
              console.log("ID Familiar (para API):", userDetails.userId);
            } else if (assignedRole === 'admin') { // El admin userId ahora será null
              console.log("ID Personal (para API - Admin):", userDetails.userId); 
            }
            
            console.log("===============================");
            
            if (onLoginSuccess) {
              // userDetails.userId ahora contendrá el ID numérico del backend para 'employee'/'family',
              // o 'null' para 'admin'.
              onLoginSuccess(assignedRole, user.uid, userDetails);
            }
          } else {
            // Este es el caso cuando userDetails es null porque no se encontró en la API
            // (Solo aplica para 'employee' y 'family' con esta nueva lógica de admin)
            let customErrorMessage = `Tu cuenta de ${assignedRole} no tiene un perfil asociado en la base de datos de la aplicación. `;
            customErrorMessage += "Por favor, contacta al administrador.";
            setError(customErrorMessage);
            console.error("Mensaje de error: userDetails es null después de fetchUserDetails. Rol:", assignedRole);
          }
        } else {
          setError("Tu cuenta no tiene un rol asignado. Contacta al administrador.");
        }
      } else {
        setError("Tu cuenta no está completamente configurada. Contacta al administrador.");
      }
    } catch (firebaseError) {
      console.log("=== ERROR DE LOGIN ===");
      console.log("Email intentado:", email);
      console.log("Código de error:", firebaseError.code);
      console.log("Mensaje de error:", firebaseError.message);
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
                <TouchableOpacity>
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