"use client"

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useRef, useEffect, useState, useCallback } from "react"
import Config from "../../../config/config"
import { useSession } from "../../../src/context/SessionContext"
import { useNotification } from "../../../src/context/NotificationContext"
import { Audio } from 'expo-av';

const API_URL = Config.API_BASE_URL

const COLORS = {
  PRIMARY_GREEN: "#6BB240",
  LIGHT_GREEN: "#9CD275",
  ACCENT_BACKGROUND: "#E6FAE8",
  DARK_GRAY: "#1C1C1E",
  MEDIUM_GRAY: "#8E8E93",
  LIGHT_GRAY: "#C7C7CC",
  VERY_LIGHT_GRAY: "#F2F2F7",
  BACKGROUND_LIGHT: "#FFFFFF",
  HOVER_EFFECT_COLOR: "#E5E5EA",
  DIVIDER: "#EFEFF4",

  MESSAGE_SENT: "#6BB240",
  MESSAGE_RECEIVED: "#FFFFFF",
  MESSAGE_BORDER: "#E0E0E0",

  ERROR: "#FF3B30",
  WARNING: "#FFCC00",
  TEXT_PRIMARY: "#1C1C1E",
  TEXT_SECONDARY: "#8E8E93",
  TEXT_MUTED: "#AEAEB2",
  WHITE: "#FFFFFF",
}

const IS_WEB = Platform.OS === "web"
const MESSAGES_PER_LOAD = 10; // Number of messages to load at once

const ChatContainer = ({ familiar, onNewMessage }) => {
  const scrollViewRef = useRef(null)
  const messageInputRef = useRef(null)
  const [allFetchedNotes, setAllFetchedNotes] = useState([]) // Stores all notes for the familiar
  const [visibleNotesCount, setVisibleNotesCount] = useState(MESSAGES_PER_LOAD) // How many notes are currently visible
  const [senderNames, setSenderNames] = useState({})
  const [isLoadingNotes, setIsLoadingNotes] = useState(false)
  const senderNamesRef = useRef(senderNames)
  const pollingIntervalRef = useRef(null)
  const { session } = useSession()
  const { showNotification } = useNotification()

  const [newMessage, setNewMessage] = useState("")
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [messageSentSound, setMessageSentSound] = useState(null);

  // Derived state: `notes` will be the subset of `allFetchedNotes` that are currently visible
  const notes = allFetchedNotes.slice(-visibleNotesCount);


  // Effect to load and unload the sound
  useEffect(() => {
    const loadSound = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../../../assets/sounds/sent_message.mp3')
        );
        setMessageSentSound(sound);
      } catch (error) {
        console.error("Error loading sound:", error);
      }
    };

    loadSound();

    return () => {
      if (messageSentSound) {
        messageSentSound.unloadAsync();
      }
    };
  }, []);

  // Function to play the sound
  const playMessageSentSound = useCallback(async () => {
    if (messageSentSound) {
      try {
        await messageSentSound.replayAsync();
      } catch (error) {
        console.error("Error playing sound:", error);
      }
    }
  }, [messageSentSound]);

  useEffect(() => {
    senderNamesRef.current = senderNames
  }, [senderNames])

  // Scroll to end when a new message is sent (i.e., when `isSendingMessage` becomes false and `newMessage` is cleared)
  useEffect(() => {
    // Only scroll to end if we are at the bottom or very close to it, or if a new message was just added.
    if (!isSendingMessage && newMessage === "" && scrollViewRef.current) {
        setTimeout(() => {
            scrollViewRef.current.scrollToEnd({ animated: true })
        }, 100);
    }
  }, [notes.length, isSendingMessage, newMessage]); // Depend on notes.length for new messages

  // Función para obtener las notas del familiar
  const fetchNotes = useCallback(async (showLoading = true) => {
    if (!familiar?.id) return

    if (showLoading) setIsLoadingNotes(true)
    try {
      const response = await fetch(`${API_URL}/Nota`)
      if (!response.ok) {
        throw new Error(`HTTP Error! status: ${response.status}`)
      }

      const data = await response.json()
      // Filtrar las notas por el familiar actual y que estén activas o inactivas
      const familiarNotes = (data.notas || data || [])
        .filter(note => 
          (note.activo === true || note.activo === false || note.activo === undefined) && 
          note.id_familiar === familiar.id
        )
        .sort((a, b) => new Date(a.fecha) - new Date(b.fecha)) // Ordenar por fecha

      setAllFetchedNotes(familiarNotes)
      
      // On initial fetch, set visible notes count to the limit or total available if less
      setVisibleNotesCount(prevCount => 
        Math.min(familiarNotes.length, Math.max(prevCount, MESSAGES_PER_LOAD))
      );

    } catch (error) {
      console.error("Error fetching notes:", error)
      if (showLoading) {
        showNotification && showNotification("Error al cargar los mensajes.", "error")
      }
    } finally {
      if (showLoading) setIsLoadingNotes(false)
    }
  }, [familiar?.id, showNotification])

  // Iniciar polling para actualización en tiempo real
  const startPolling = useCallback(() => {
    // Limpiar intervalo anterior si existe
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }

    // Fetch inicial
    fetchNotes(true)

    // Configurar polling cada 2 segundos
    pollingIntervalRef.current = setInterval(() => {
      fetchNotes(false) // Sin mostrar loading para no interrumpir la UI
    }, 2000)
  }, [fetchNotes])

  // Detener polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }, [])

  // Cargar notas cuando cambie el familiar o se monte el componente
  useEffect(() => {
    if (familiar?.id) {
      setAllFetchedNotes([]); // Clear notes when familiar changes
      setVisibleNotesCount(MESSAGES_PER_LOAD); // Reset visible count
      startPolling();
    } else {
      stopPolling();
      setAllFetchedNotes([]);
      setVisibleNotesCount(MESSAGES_PER_LOAD);
    }

    // Cleanup al desmontar
    return () => {
      stopPolling();
    }
  }, [familiar?.id, startPolling, stopPolling])

  // Cleanup al desmontar el componente
  useEffect(() => {
    return () => {
      stopPolling()
    }
  }, [stopPolling])

  // Visibilidad de la página para pausar/reanudar polling
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling()
      } else if (familiar?.id) {
        startPolling()
      }
    }

    if (IS_WEB) {
      document.addEventListener('visibilitychange', handleVisibilityChange)
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }
  }, [familiar?.id, startPolling, stopPolling])

  useEffect(() => {
    const fetchSenderNames = async () => {
      const newSenderNames = {}
      const uniqueSenderKeys = new Set()

      // Use all fetched notes to gather sender IDs, not just visible ones
      allFetchedNotes.forEach((note) => {
        if (note.id_personal === null || note.id_personal === 0) { // Assuming id_personal 0 or null is admin
          uniqueSenderKeys.add("admin-0")
        } else if (note.id_personal !== null && note.id_personal !== undefined) {
          uniqueSenderKeys.add(`employee-${note.id_personal}`)
        }
        if (note.id_familiar !== null && note.id_familiar !== undefined) {
            uniqueSenderKeys.add(`family-${note.id_familiar}`)
        }
      })

      const currentSenderNames = senderNamesRef.current
      for (const senderKey of Array.from(uniqueSenderKeys)) {
        if (!currentSenderNames[senderKey]) {
          try {
            let name = ""
            const [senderType, senderId] = senderKey.split("-")
            if (senderType === "admin") {
              name = "Administrador"
            } else if (senderType === "employee") {
              const response = await fetch(`${API_URL}/Personal/${senderId}`)
              if (response.ok) {
                const data = await response.json()
                name = data.personal ? `${data.personal.nombre} ${data.personal.apellido}` : "Personal Desconocido"
              } else {
                name = "Personal Desconocido"
              }
            } else if (senderType === "family") {
              const allFamiliaresResponse = await fetch(`${API_URL}/Familiar`)
              if (allFamiliaresResponse.ok) {
                const allFamiliaresData = await allFamiliaresResponse.json()
                const familiaresArray = allFamiliaresData.familiares || allFamiliaresData
                const foundFamiliar = familiaresArray?.find((f) => f.id === Number.parseInt(senderId))
                name = foundFamiliar ? `${foundFamiliar.nombre} ${foundFamiliar.apellido}` : "Familiar Desconocido"
              } else {
                name = "Familiar Desconocido"
              }
            }
            newSenderNames[senderKey] = name
          } catch (error) {
            console.error(`Error fetching name for ${senderKey}:`, error)
            newSenderNames[senderKey] = senderKey.startsWith("employee")
              ? "Personal Desconocido"
              : "Familiar Desconocido"
          }
        } else {
          newSenderNames[senderKey] = currentSenderNames[senderKey]
        }
      }
      setSenderNames((prev) => ({ ...prev, ...newSenderNames }))
    }

    if (allFetchedNotes.length > 0) {
      fetchSenderNames()
    }
  }, [allFetchedNotes, familiar, API_URL])

  const formatMessageDate = (dateString) => {
    const messageDate = new Date(dateString)
    const today = new Date()

    const isToday =
      messageDate.getDate() === today.getDate() &&
      messageDate.getMonth() === today.getMonth() &&
      messageDate.getFullYear() === today.getFullYear()

    if (isToday) {
      return messageDate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: true })
    } else {
      return (
        messageDate.toLocaleDateString("es-ES", { month: "short", day: "numeric" }) +
        " " +
        messageDate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: true })
      )
    }
  }

  const isMessageSentByCurrentUser = (message) => {
    const { userRole, apiUserId } = session

    if (userRole === "admin") {
      return message.id_personal === 0 // Admin messages have id_personal = 0
    } else if (userRole === "employee") {
      return message.id_personal === apiUserId
    } else if (userRole === "family" && familiar) {
      // Message is sent by current family if it has no id_personal and its id_familiar matches the current familiar's id
      return message.id_personal === null && message.id_familiar === familiar.id
    }
    return false
  }

  const getSenderDisplayName = (note) => {
    if (isMessageSentByCurrentUser(note)) {
      return "Tú"
    }

    if (note.id_personal === 0) { // Admin messages
      return "Administrador"
    } else if (note.id_personal !== null && note.id_personal !== undefined) { // Employee messages
      const senderKey = `employee-${note.id_personal}`
      return senderNames[senderKey] || "Personal Desconocido"
    } else if (note.id_familiar !== null && note.id_familiar !== undefined) { // Family messages
      const senderKey = `family-${note.id_familiar}`
      return senderNames[senderKey] || "Familiar Desconocido"
    }
    return "Desconocido"
  }

  // Función para manejar Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !familiar?.id) {
      showNotification && showNotification("El mensaje no puede estar vacío o no hay familiar seleccionado.", "warning")
      return
    }

    const { userRole, apiUserId } = session

    if (!userRole || (userRole !== "family" && apiUserId === null && userRole !== "admin")) {
      showNotification && showNotification("No se pudo identificar tu rol o ID para enviar el mensaje.", "error")
      return
    }

    setIsSendingMessage(true)
    
    try {
      const formData = new FormData()
      formData.append("notaTexto", newMessage.trim())
      formData.append("id_familiar", familiar.id.toString())

      const senderId = userRole === "employee" ? apiUserId : userRole === "admin" ? 0 : null
      formData.append("id_personal", senderId !== null ? senderId.toString() : "")
      formData.append("activo", "true")

      const response = await fetch(`${API_URL}/Nota`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        let errorBody = "Unknown error"
        try {
          errorBody = await response.text()
          console.error("Server error response:", errorBody)
        } catch (parseError) {
          console.error("Error parsing server error response:", parseError)
        }
        throw new Error(`HTTP Error! status: ${response.status}. Details: ${errorBody}`)
      }

      const responseData = await response.json()
      const newNote = responseData.nota || {
        id: Math.random().toString(36).substring(7), // Fallback ID
        nota: newMessage.trim(),
        fecha: new Date().toISOString(),
        id_familiar: familiar.id,
        id_personal: senderId,
        activo: true,
      }

      setNewMessage("")
      
      // Update allFetchedNotes immediately to show new message
      setAllFetchedNotes(prevNotes => {
        const updatedNotes = [...prevNotes, newNote].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
        return updatedNotes;
      });

      // Ensure the new message is visible and scroll to it
      setVisibleNotesCount(prevCount => prevCount + 1);

      // Play sound after successful message send
      playMessageSentSound();

      // Notificar al componente padre si existe el callback
      if (onNewMessage) {
        onNewMessage(newNote)
      }
    } catch (error) {
      console.error("Error sending message:", error)
      showNotification && showNotification("Error al enviar el mensaje. Por favor, inténtalo de nuevo.", "error")
    } finally {
      setIsSendingMessage(false)
    }
  }, [newMessage, familiar, session, showNotification, onNewMessage, fetchNotes, playMessageSentSound])

  const loadOlderMessages = useCallback(() => {
    setVisibleNotesCount(prevCount => 
      Math.min(prevCount + MESSAGES_PER_LOAD, allFetchedNotes.length)
    );
  }, [allFetchedNotes.length]);


  const hasMoreNotes = visibleNotesCount < allFetchedNotes.length;

  return (
    <View style={styles.modernChatCard}>
      <View style={styles.modernCardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={styles.cardIconContainer}>
            <Ionicons name="chatbubbles" size={18} color={COLORS.PRIMARY_GREEN} />
          </View>
          <Text style={styles.modernCardTitle}>Chat con el personal del asilo</Text>
        </View>
        {isLoadingNotes && (
          <ActivityIndicator size="small" color={COLORS.PRIMARY_GREEN} />
        )}
      </View>

      <View style={styles.chatMessagesContainer}>
        {notes.length > 0 ? (
          <ScrollView ref={scrollViewRef} style={styles.chatScrollView} showsVerticalScrollIndicator={true}>
            {hasMoreNotes && (
                <TouchableOpacity onPress={loadOlderMessages} style={styles.loadMoreButton}>
                    <Text style={styles.loadMoreButtonText}>Cargar mensajes antiguos</Text>
                </TouchableOpacity>
            )}
            {notes.map((note, index) => {
              // Determine if the message should be aligned to the right
              const messageAlignRight =
                (note.id_personal !== null && note.id_personal !== undefined) || // If it's an employee/admin message, align right
                (session.userRole === "family" && note.id_familiar === familiar.id && note.id_personal === null); // Or if it's the current family member's message

              return (
                <View key={note.id || index} style={styles.messageContainer}>
                  <View
                    style={[
                      styles.messageBubble,
                      messageAlignRight ? styles.messageBubbleSent : styles.messageBubbleReceived,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageSenderName,
                        { color: messageAlignRight ? COLORS.WHITE : COLORS.DARK_GRAY }, // Adjust color for contrast
                        messageAlignRight ? { textAlign: "right" } : { textAlign: "left" },
                      ]}
                    >
                      {getSenderDisplayName(note)}
                    </Text>
                    <Text style={[styles.messageText, messageAlignRight && styles.messageTextSent]}>{note.nota}</Text>
                    <Text style={[styles.messageDate, messageAlignRight && styles.messageDateSent]}>
                      {note.fecha && formatMessageDate(note.fecha)}
                    </Text>
                  </View>
                </View>
              )
            })}
          </ScrollView>
        ) : (
          <View style={styles.noMessagesContainer}>
            <View style={styles.noDataIcon}>
              <Ionicons name="chatbubble-outline" size={24} color={COLORS.TEXT_MUTED} />
            </View>
            <Text style={styles.noMessagesText}>
              {isLoadingNotes ? "Cargando mensajes..." : "No hay mensajes"}
            </Text>
          </View>
        )}

        <View style={styles.modernMessageInputContainer}>
          <View style={styles.modernInputRow}>
            <TextInput
              ref={messageInputRef}
              style={styles.modernMessageInput}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Escribe un mensaje..."
              multiline
              maxLength={500}
              editable={!isSendingMessage}
              textAlignVertical="top"
              onKeyPress={IS_WEB ? handleKeyPress : undefined}
            />
            <TouchableOpacity
              style={[styles.modernSendButton, isSendingMessage && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={isSendingMessage}
            >
              {isSendingMessage ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={14} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  )
}

const commonShadow = {
  ...Platform.select({
    ios: {
      shadowColor: COLORS.DARK_GRAY,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
    },
    android: {
      elevation: 3,
    },
    web: {
      boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
    },
  }),
}

const styles = StyleSheet.create({
  modernChatCard: {
    backgroundColor: COLORS.BACKGROUND_LIGHT,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.DIVIDER,
    height: IS_WEB ? 300 : 320,
  },
  modernCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.VERY_LIGHT_GRAY,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  modernCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.TEXT_PRIMARY,
  },
  chatMessagesContainer: {
    flex: 1,
  },
  chatScrollView: {
    flex: 1,
    maxHeight: 180,
    backgroundColor: COLORS.VERY_LIGHT_GRAY,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  messageContainer: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  messageBubble: {
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 18,
    maxWidth: "85%",
    marginVertical: 2,
    position: 'relative',
    ...commonShadow,
  },
  messageBubbleSent: {
    backgroundColor: COLORS.PRIMARY_GREEN,
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
    marginLeft: 40,
    ...Platform.select({
      web: {
        background: `linear-gradient(135deg, ${COLORS.PRIMARY_GREEN} 0%, ${COLORS.LIGHT_GREEN} 100%)`,
      },
    }),
  },
  messageTextSent: {
    color: COLORS.WHITE,
    fontSize: 15,
    fontWeight: "400",
    lineHeight: 20,
  },
  messageDateSent: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 10,
    fontWeight: "300",
    marginTop: 6,
    textAlign: "right",
  },
  messageBubbleReceived: {
    backgroundColor: COLORS.WHITE,
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.DIVIDER,
    marginRight: 40,
    ...Platform.select({
      web: {
        boxShadow: "0 2px 8px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
      },
    }),
  },
  messageText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "400",
  },
  messageSenderName: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.TEXT_SECONDARY, // Default to secondary for received
    marginBottom: 6,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  messageDate: {
    fontSize: 10,
    color: COLORS.TEXT_MUTED,
    textAlign: "right",
    marginTop: 6,
    fontWeight: "300",
  },
  modernMessageInputContainer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.DIVIDER,
    paddingTop: 12,
    marginTop: 12,
    backgroundColor: COLORS.WHITE,
  },
  modernInputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  modernMessageInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: COLORS.DIVIDER,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 12,
    minHeight: 44,
    maxHeight: 120,
    fontSize: 16,
    backgroundColor: COLORS.VERY_LIGHT_GRAY,
    color: COLORS.TEXT_PRIMARY,
    ...Platform.select({
      web: {
        outlineWidth: 0,
        resize: "none",
        transition: "all 0.2s ease-in-out",
        "&:focus": {
          borderColor: COLORS.PRIMARY_GREEN,
          backgroundColor: COLORS.WHITE,
          boxShadow: `0 0 0 3px rgba(107, 178, 64, 0.1)`,
        },
      },
    }),
  },
  modernSendButton: {
    backgroundColor: COLORS.PRIMARY_GREEN,
    borderRadius: 22,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      web: {
        transition: "all 0.2s ease-in-out",
        cursor: "pointer",
        "&:hover": {
          backgroundColor: COLORS.LIGHT_GREEN,
          transform: "scale(1.05)",
        },
        "&:active": {
          transform: "scale(0.95)",
        },
      },
    }),
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.LIGHT_GREEN,
    ...Platform.select({
      web: {
        cursor: "not-allowed",
        "&:hover": {
          backgroundColor: COLORS.LIGHT_GREEN,
        },
      },
    }),
  },
  noMessagesContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  noDataIcon: {
    marginBottom: 12,
  },
  noMessagesText: {
    fontSize: 12,
    color: COLORS.TEXT_MUTED,
    marginTop: 8,
    textAlign: "center",
  },
  loadMoreButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.LIGHT_GRAY,
    borderRadius: 10,
    alignSelf: 'center',
    marginBottom: 10,
  },
  loadMoreButtonText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 12,
    fontWeight: '500',
  },
})

export default ChatContainer