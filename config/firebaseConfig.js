// AETHERIS/config/firebaseConfig.js
// Importa las funciones que necesitas del SDKs
import { initializeApp, getApp, getApps } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'; 
import { Platform } from 'react-native'; // <--- ¡NUEVA IMPORTACIÓN!

console.log("--- firebaseConfig.js: Iniciando carga del archivo ---"); 

// Solo importa AsyncStorage si NO estamos en la web
let ReactNativeAsyncStorage;
if (Platform.OS !== 'web') {
  ReactNativeAsyncStorage = require('@react-native-async-storage/async-storage').default;
}

// Tus credenciales de configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDR5fgU2nFx7KA8pIpEb9TVZzN5KgbchKQ",
  authDomain: "aetheris-ac3f3.firebaseapp.com",
  projectId: "aetheris-ac3f3",
  storageBucket: "aetheris-ac3f3.firebasestorage.app",
  messagingSenderId: "1053969698323",
  appId: "1:1053969698323:web:37f2a6ad866dcecb9cf9e6"
};

// Inicializa Firebase App si no ha sido inicializada
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  console.log("--- firebaseConfig.js: Firebase App inicializada ---"); 
} else {
  app = getApp(); // Obtiene la instancia existente
  console.log("--- firebaseConfig.js: Firebase App ya inicializada, obteniendo instancia existente ---"); 
}

let auth;
try {
  // <--- ¡¡¡CAMBIO CRÍTICO AQUÍ: Inicialización CONDICIONAL de Auth!!! --->
  if (Platform.OS === 'web') {
    // Para la web, no pasamos getReactNativePersistence; Firebase usa su propio mecanismo.
    auth = initializeAuth(app, {
      persistence: undefined // Esto le indica a Firebase que use la persistencia por defecto para web
    });
    console.log("--- firebaseConfig.js: Firebase Auth inicializada para WEB ---");
  } else {
    // Para iOS/Android, usamos getReactNativePersistence con AsyncStorage
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage)
    });
    console.log("--- firebaseConfig.js: Firebase Auth inicializada con persistencia NATIVA ---");
  }
} catch (e) {
  console.error("--- firebaseConfig.js: ERROR al inicializar Auth ---", e);
  auth = null; // Establecer auth a null si falla la inicialización
}

// Inicializa Firebase Firestore y obten una referencia al servicio
const db = getFirestore(app);
console.log("--- firebaseConfig.js: Firebase Firestore inicializada ---"); 

// Exporta las instancias que necesitarás en otras partes de tu app
export { app, auth, db };
console.log("--- firebaseConfig.js: Exportaciones completadas ---");