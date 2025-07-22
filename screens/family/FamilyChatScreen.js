// AETHERIS/screens/family/FamilyChatScreen.js
"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Dimensions, Platform, Alert } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import Config from "../../config/config"
import { useNotification } from "../../src/context/NotificationContext"
import { Audio } from 'expo-av';

// Importar el componente ChatContainer
import ChatContainer from "../../components/shared/resident_profile/ChatContainer"

const API_URL = Config.API_BASE_URL
const { width, height } = Dimensions.get("window")
const IS_WEB = Platform.OS === "web"

const COLORS = {
  primaryGreen: "#10B981",
  pageBackground: "#F9FAFB",
  errorRed: "#EF4444",
  accentBlue: "#3B82F6",
  lightText: "#6B7280",
  darkText: "#1F2937",
  cardBackground: "#FFFFFF",
  borderColor: "#E5E7EB",
  shadowColor: "rgba(0,0,0,0.05)",
}

// Esta pantalla recibirá el residentId del familiar, el ID del propio familiar (currentUserId)
// y el rol, que siempre será 'family' aquí.
export default function FamilyChatScreen({ navigation, currentUserRole, currentUserId, residentId }) {
  const [familiar, setFamiliar] = useState(null)
  const [familiarEmail, setFamiliarEmail] = useState(null) // Puede ser útil para mostrar
  const [notes, setNotes] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState("")
  const { showNotification } = useNotification()
  const messageInputRef = useRef(null)

  const [messageSentSound, setMessageSentSound] = useState(null);

  useEffect(() => {
    const loadSound = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/sounds/sent_message.mp3') // Asegúrate de que esta ruta sea correcta
        );
        setMessageSentSound(sound);
      } catch (error) {
        console.error("[FamilyChatScreen] Error loading sound:", error);
      }
    };

    loadSound();

    return () => {
      if (messageSentSound) {
        messageSentSound.unloadAsync();
      }
    };
  }, []);

  const playMessageSentSound = async () => {
    if (messageSentSound) {
      try {
        await messageSentSound.replayAsync();
      } catch (error) {
        console.error("[FamilyChatScreen] Error playing sound:", error);
      }
    }
  };

  // Función para obtener los datos del familiar asociado al residente
  const fetchFamiliarAndNotes = useCallback(async () => {
    console.log("------------------------------------------");
    console.log("[FamilyChatScreen] Iniciando fetchFamiliarAndNotes...");
    console.log("[FamilyChatScreen] Resident ID para buscar familiar:", residentId);

    if (!residentId) {
      console.error("[FamilyChatScreen] No se ha proporcionado un ID de residente para cargar el chat.");
      setFetchError("No se ha proporcionado un ID de residente para el chat.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setFetchError("");

    try {
      // 1. Obtener datos del Familiar asociado al residente
      console.log(`[FamilyChatScreen] Intentando obtener familiar asociado al residente: ${API_URL}/Familiar/${residentId}`);
      const familiarResponse = await fetch(`${API_URL}/Familiar/${residentId}`);
      if (!familiarResponse.ok) {
        throw new Error(`HTTP error! status: ${familiarResponse.status}`);
      }
      const apiFamiliarData = await familiarResponse.json();
      const fetchedFamiliarData = apiFamiliarData.familiar;
      console.log("[FamilyChatScreen] Datos del familiar obtenidos:", fetchedFamiliarData);

      if (fetchedFamiliarData && fetchedFamiliarData.id) {
        setFamiliar(fetchedFamiliarData);

        if (fetchedFamiliarData.firebase_uid) {
          console.log(`[FamilyChatScreen] Intentando obtener correo del familiar de Firebase UID: ${fetchedFamiliarData.firebase_uid}`);
          try {
            const emailResponse = await fetch(
              `${API_URL}/Personal/manage/get-correo/${fetchedFamiliarData.firebase_uid}`,
            );
            if (emailResponse.ok) {
              const emailData = await emailResponse.json();
              if (emailData && emailData.email) {
                setFamiliarEmail(emailData.email);
                console.log("[FamilyChatScreen] Correo del familiar obtenido:", emailData.email);
              } else {
                console.warn("[FamilyChatScreen] No se obtuvo un correo válido del familiar.");
              }
            } else {
              console.warn("[FamilyChatScreen] Respuesta no OK al obtener correo del familiar:", emailResponse.status);
            }
          } catch (emailError) {
            console.error(`[FamilyChatScreen] Error al obtener el correo del familiar:`, emailError);
            setFamiliarEmail(null);
          }
        }

        // 2. Obtener las notas (mensajes de chat) para este familiar
        console.log(`[FamilyChatScreen] Intentando obtener notas del familiar con ID: ${fetchedFamiliarData.id}`);
        try {
          const noteResponse = await fetch(`${API_URL}/Nota/${fetchedFamiliarData.id}`);
          if (noteResponse.ok) {
            const apiNoteData = await noteResponse.json();
            if (apiNoteData.notas && Array.isArray(apiNoteData.notas) && apiNoteData.notas.length > 0) {
              const activeNotes = apiNoteData.notas.filter((note) => note.activo);
              const sortedNotes = activeNotes.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
              setNotes(sortedNotes);
              console.log("[FamilyChatScreen] Notas del familiar obtenidas:", sortedNotes.length);
            } else {
              setNotes([]);
              console.log("[FamilyChatScreen] No se encontraron notas activas para este familiar.");
            }
          } else {
            console.warn("[FamilyChatScreen] Respuesta no OK al obtener notas del familiar:", noteResponse.status);
            setNotes([]);
          }
        } catch (noteError) {
          console.error(`[FamilyChatScreen] Error al obtener las notas:`, noteError);
          setNotes([]);
        }
      } else {
        console.warn("[FamilyChatScreen] No se encontró familiar asociado a este residente con un ID válido.");
        setFamiliar(null);
        setFamiliarEmail(null);
        setNotes([]);
        setFetchError("No se encontró información del familiar asociado para el chat.");
      }
    } catch (error) {
      console.error("[FamilyChatScreen] Error general al cargar datos del familiar y notas:", error);
      setFetchError(`Error al cargar el chat: ${error.message}`);
      showNotification(`Error al cargar el chat: ${error.message}`, "error");
    } finally {
      setIsLoading(false);
      console.log("[FamilyChatScreen] Finalizando fetchFamiliarAndNotes.");
      console.log("------------------------------------------");
    }
  }, [residentId, showNotification]);

  // Función para enviar un nuevo mensaje (nota)
  const sendMessage = async () => {
    console.log("------------------------------------------");
    console.log("[FamilyChatScreen] Iniciando sendMessage...");
    if (!newMessage.trim()) {
      console.warn("[FamilyChatScreen] Mensaje vacío, no se envía.");
      Alert.alert("Error", "Por favor escribe un mensaje");
      return;
    }

    if (!familiar || !familiar.id) {
      console.error("[FamilyChatScreen] No se encontró información del familiar o su ID para enviar el mensaje.");
      Alert.alert("Error", "No se pudo identificar al destinatario del mensaje.");
      return;
    }

    setIsSendingMessage(true);
    console.log("[FamilyChatScreen] Estado de envío: TRUE");

    try {
      const formData = new FormData();
      formData.append("notaTexto", newMessage.trim());
      formData.append("id_familiar", familiar.id.toString()); // El familiar es el destinatario de la nota
      formData.append("id_personal", "null"); // Los mensajes de familiar no son de personal

      // currentUserId es el id_familiar de la persona que envía el mensaje (si es el rol familiar)
      // Opcionalmente, puedes añadir un campo que indique quién es el emisor de la nota si es necesario en el backend
      // Si tu API necesita identificar al EMISOR de la nota (y no solo al RECEPTOR), lo harías aquí.
      // Por ahora, solo usamos el ID del familiar como destinatario.

      console.log(`[FamilyChatScreen] Enviando mensaje a: ${API_URL}/Nota`);
      const response = await fetch(`${API_URL}/Nota`, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "*/*",
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("[FamilyChatScreen] API response not OK:", response.status, errorBody);
        throw new Error(`HTTP error! status: ${response.status} - ${errorBody}`);
      }

      const result = await response.json();
      console.log("[FamilyChatScreen] Respuesta de la API al enviar mensaje:", result);

      if (result.type === "Success") {
        const newNote = {
          id: Date.now(), // ID temporal para la UI
          nota: newMessage.trim(),
          fecha: new Date().toISOString(),
          activo: true,
          // Propiedades adicionales para el frontend para mostrar quién envió el mensaje
          // Aquí asumimos que si no hay id_personal, fue enviado por el familiar
          id_familiar: familiar.id,
          id_personal: null, // Confirmar que el backend lo guarda así para mensajes de familiar
        };

        setNotes((prevNotes) => [...prevNotes, newNote].sort((a, b) => new Date(a.fecha) - new Date(b.fecha)));
        setNewMessage("");
        playMessageSentSound();
        console.log("[FamilyChatScreen] Mensaje enviado con éxito y notas actualizadas.");
      } else {
        throw new Error(result.message || "Error al enviar el mensaje");
      }
    } catch (error) {
      console.error("[FamilyChatScreen] Error al enviar mensaje:", error);
      showNotification(`Error al enviar mensaje: ${error.message}`, "error");
    } finally {
      setIsSendingMessage(false);
      console.log("[FamilyChatScreen] Estado de envío: FALSE");
      console.log("[FamilyChatScreen] Finalizando sendMessage.");
      console.log("------------------------------------------");
    }
  };

  // Cargar datos del familiar y notas cuando el componente se monta o el residentId cambia
  useEffect(() => {
    fetchFamiliarAndNotes();
  }, [fetchFamiliarAndNotes]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryGreen} />
        <Text style={styles.loadingText}>Cargando su chat...</Text>
      </View>
    );
  }

  if (fetchError) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.errorRed} />
        <Text style={styles.errorText}>{fetchError}</Text>
      </View>
    );
  }

  if (!familiar) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="information-circle-outline" size={48} color={COLORS.accentBlue} />
        <Text style={styles.errorText}>No se pudo encontrar al familiar asociado para el chat.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent} keyboardShouldPersistTaps="handled">
        <ChatContainer
          notes={notes}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          isSendingMessage={isSendingMessage}
          sendMessage={sendMessage}
          messageInputRef={messageInputRef}
          currentUserRole={currentUserRole} // Pasamos el rol 'family'
          currentUserId={currentUserId} // El ID API del familiar
          familiar={familiar} // El objeto completo del familiar
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.pageBackground,
  },
  scrollViewContent: {
    flexGrow: 1, // Permite que el contenido crezca
    justifyContent: 'flex-end', // Empuja el contenido hacia abajo
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.pageBackground,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.lightText,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: COLORS.pageBackground,
  },
  errorText: {
    color: COLORS.errorRed,
    textAlign: "center",
    marginTop: 16,
    fontSize: 16,
  },
});