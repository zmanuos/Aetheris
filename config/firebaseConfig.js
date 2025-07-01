// AETHERIS/config/firebaseConfig.js
// Importa las funciones que necesitas del SDKs
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth'; // Para autenticación
import { getFirestore } from 'firebase/firestore'; // <-- ¡NUEVO! Para Firestore

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDR5fgU2nFx7KA8pIpEb9TVZzN5KgbchKQ",
  authDomain: "aetheris-ac3f3.firebaseapp.com",
  projectId: "aetheris-ac3f3",
  storageBucket: "aetheris-ac3f3.firebasestorage.app",
  messagingSenderId: "1053969698323",
  appId: "1:1053969698323:web:37f2a6ad866dcecb9cf9e6"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Inicializa Firebase Authentication
const auth = getAuth(app);

// Inicializa Firebase Firestore y obten una referencia al servicio
const db = getFirestore(app); // <-- ¡NUEVO!

// Exporta las instancias que necesitarás en otras partes de tu app
export { app, auth, db }; // <-- ¡NUEVO! Exporta 'db' también