// AETHERIS/screens/family/FamilyChatScreen.js
"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { View, Text, StyleSheet, ActivityIndicator, Dimensions, Platform, Alert } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import Config from "../../config/config"
import { useNotification } from "../../src/context/NotificationContext"
import { Audio } from 'expo-av';

// Importar el nuevo componente FamilyChatContainer
import FamilyChatContainer from "../../components/shared/resident_profile/FamilyChatContainer" // <--- CAMBIAR RUTA E IMPORTACIÓN

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

export default function FamilyChatScreen({ navigation, currentUserRole, currentUserId, residentId }) {
  const [familiar, setFamiliar] = useState(null)
  const [familiarEmail, setFamiliarEmail] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState("")
  const { showNotification } = useNotification()

  // No longer needed here as ChatContainer handles its own state
  // const [notes, setNotes] = useState([])
  // const [newMessage, setNewMessage] = useState("")
  // const [isSendingMessage, setIsSendingMessage] = useState(false)
  // const messageInputRef = useRef(null)
  // const [messageSentSound, setMessageSentSound] = useState(null);

  // The sound loading and playing logic can actually stay in ChatContainer or be managed by context
  // For now, I'm removing it from here as FamilyChatContainer already has it.
  // If you want FamilyChatScreen to *control* the sound, you'd re-add it here and pass playMessageSentSound
  // as a prop to FamilyChatContainer. For simplicity, I'm letting FamilyChatContainer manage it.


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
        // Notes fetching logic is now primarily within FamilyChatContainer,
        // so no need to setNotes here directly anymore from this fetch.
        // FamilyChatContainer will manage its own internal notes state.

      } else {
        console.warn("[FamilyChatScreen] No se encontró familiar asociado a este residente con un ID válido.");
        setFamiliar(null);
        setFamiliarEmail(null);
        setFetchError("No se encontró información del familiar asociado para el chat.");
      }
    } catch (error) {
      console.error("[FamilyChatScreen] Error general al cargar datos del familiar:", error);
      setFetchError(`Error al cargar el chat: ${error.message}`);
      showNotification(`Error al cargar el chat: ${error.message}`, "error");
    } finally {
      setIsLoading(false);
      console.log("[FamilyChatScreen] Finalizando fetchFamiliarAndNotes.");
      console.log("------------------------------------------");
    }
  }, [residentId, showNotification]);

  // The sendMessage function is now managed within FamilyChatContainer.
  // We don't need it here unless FamilyChatScreen needs to do something *after*
  // a message is sent (e.g., update a global unread count, which is already done via context).
  // The `onNewMessage` prop to FamilyChatContainer can handle such post-send actions.

  useEffect(() => {
    fetchFamiliarAndNotes();
  }, [fetchFamiliarAndNotes]);

  // Callback for when a new message is successfully sent from FamilyChatContainer
  const handleNewMessageSent = useCallback((newNote) => {
    // Optionally, you can add logic here if FamilyChatScreen needs to react to a new message
    // For instance, if you were managing notes in FamilyChatScreen, you'd update them here.
    // Since FamilyChatContainer now manages `allFetchedNotes` internally, this is less critical.
    console.log("[FamilyChatScreen] New message sent from FamilyChatContainer:", newNote);
  }, []);

  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={styles.overlayLoadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primaryGreen} />
          <Text style={styles.loadingText}>Cargando su chat...</Text>
        </View>
      )}

      {fetchError && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.errorRed} />
          <Text style={styles.errorText}>{fetchError}</Text>
        </View>
      )}

      {!isLoading && !fetchError && !familiar && (
        <View style={styles.errorContainer}>
          <Ionicons name="information-circle-outline" size={48} color={COLORS.accentBlue} />
          <Text style={styles.errorText}>No se pudo encontrar al familiar asociado para el chat.</Text>
        </View>
      )}

      {!isLoading && !fetchError && familiar && (
        <FamilyChatContainer // <--- Usar el nuevo componente
          familiar={familiar}
          residentId={residentId} // Pass residentId to FamilyChatContainer if it needs it directly for fetching
          onNewMessage={handleNewMessageSent}
          // The following props are now managed internally by FamilyChatContainer
          // notes={notes}
          // newMessage={newMessage}
          // setNewMessage={setNewMessage}
          // isSendingMessage={isSendingMessage}
          // sendMessage={sendMessage}
          // messageInputRef={messageInputRef}
          // currentUserRole={currentUserRole} // FamilyChatContainer assumes family role
          // currentUserId={currentUserId} // Not strictly needed if familiar.id is passed
          style={styles.chatContainerStyle}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.pageBackground,
  },
  chatContainerStyle: {
    flex: 1,
  },
  overlayLoadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.pageBackground,
    zIndex: 100,
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