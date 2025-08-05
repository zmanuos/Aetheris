"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Platform,
  TextInput,
  KeyboardAvoidingView,
  Image,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Audio } from "expo-av"
import Config from "../../config/config"
import { useNotification } from "../../src/context/NotificationContext"
import { useSession } from "../../src/context/SessionContext"
import { useUnreadMessages } from "../../src/context/UnreadMessagesContext"
import MessageReceivedSound from "../../assets/sounds/MessageReceived.mp3"
import { useRoute, useNavigation } from "@react-navigation/native"

const API_URL = Config.API_BASE_URL
const { width } = Dimensions.get("window")
const IS_LARGE_SCREEN = width > 768

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

const INITIAL_MESSAGES_COUNT = 10
const LOAD_MORE_MESSAGES_COUNT = 10
const POLLING_INTERVAL = 5000

export default function SpecificChatScreen() {
  const route = useRoute()
  const navigation = useNavigation()
  const { familiarId: selectedConversationIdFromParams, personalMap: personalMapArray } = route.params
  const personalMap = useMemo(() => new Map(personalMapArray), [personalMapArray])

  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState("")
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [newMessage, setNewMessage] = useState("")
  const [isSendingMessage, setIsSendingMessage] = useState(false)

  const [currentConversationMessagesToShowCount, setCurrentConversationMessagesToShowCount] =
    useState(INITIAL_MESSAGES_COUNT)
  const [loadingMoreOldMessages, setLoadingMoreOldMessages] = useState(false)

  const chatFlatListRef = useRef(null)
  const messageInputRef = useRef(null)
  const soundObjectRef = useRef(new Audio.Sound())
  const soundObjectReceivedRef = useRef(new Audio.Sound())

  const { showNotification } = useNotification()
  const { session } = useSession()
  const { userRole, apiUserId } = session
  const { setTotalUnreadCount } = useUnreadMessages()

  const messagesToDisplay = useMemo(() => {
    if (!selectedConversation) return []
    const totalMessages = selectedConversation.messages.length
    return selectedConversation.messages
      .slice(Math.max(0, totalMessages - currentConversationMessagesToShowCount))
      .reverse()
  }, [selectedConversation, currentConversationMessagesToShowCount])

  useEffect(() => {
    const loadSound = async () => {
      try {
        await soundObjectRef.current.loadAsync(require("../../assets/sounds/sent_message2.mp3"))
        await soundObjectRef.current.setVolumeAsync(1)

        await soundObjectReceivedRef.current.loadAsync(MessageReceivedSound)
        await soundObjectReceivedRef.current.setVolumeAsync(1)
      } catch (error) {
        console.error("Error loading sound:", error)
      }
    }

    loadSound()

    return () => {
      if (soundObjectRef.current) {
        soundObjectRef.current.unloadAsync()
      }
      if (soundObjectReceivedRef.current) {
        soundObjectReceivedRef.current.unloadAsync()
      }
    }
  }, [])

  const playSentMessageSound = useCallback(async () => {
    try {
      if (soundObjectRef.current && (await soundObjectRef.current.getStatusAsync()).isLoaded) {
        await soundObjectRef.current.replayAsync()
      }
    } catch (error) {
      console.error("Error playing sound:", error)
    }
  }, [])

  const playReceivedMessageSound = useCallback(async () => {
    try {
      if (soundObjectReceivedRef.current && (await soundObjectReceivedRef.current.getStatusAsync()).isLoaded) {
        await soundObjectReceivedRef.current.replayAsync()
      }
    } catch (error) {
      console.error("Error playing received message sound:", error)
    }
  }, [])

  const isMessageSentByCurrentUser = useCallback((message, currentUserRole, currentApiUserId) => {
    if (currentUserRole === "admin") {
      return message.id_personal === 0
    } else if (currentUserRole === "employee") {
      return message.id_personal === currentApiUserId
    } else if (currentUserRole === "family") {
      return message.id_personal === null
    }
    return false
  }, [])

  const markMessagesAsRead = useCallback(
    async (currentConvData, familiarIdToMark) => {
      if (!currentConvData) return

      const unreadMessagesForCurrentUser = currentConvData.messages.filter((message) => {
        return message.activo === true && !isMessageSentByCurrentUser(message, userRole, apiUserId)
      })

      if (unreadMessagesForCurrentUser.length === 0) return

      setSelectedConversation((prevConv) => {
        if (!prevConv) return prevConv
        const updatedMessages = prevConv.messages.map((message) => {
          const shouldMarkAsRead = unreadMessagesForCurrentUser.some((um) => um.id === message.id)
          return shouldMarkAsRead ? { ...message, activo: false } : message
        })
        let newUnreadCount = 0
        updatedMessages.forEach((message) => {
          if (message.activo === true && !isMessageSentByCurrentUser(message, userRole, apiUserId)) {
            newUnreadCount++
          }
        })
        return { ...prevConv, messages: updatedMessages, unreadCount: newUnreadCount }
      })

      try {
        for (const message of unreadMessagesForCurrentUser) {
          const formData = new FormData()
          formData.append("activo", "false")

          const response = await fetch(`${API_URL}/Nota/activo/${message.id}`, {
            method: "PUT",
            body: formData,
          })

          if (!response.ok) {
            console.error(`Failed to mark message ${message.id} as read on backend.`)
          }
        }
      } catch (error) {
        console.error("Error marking messages as read on backend:", error)
        showNotification && showNotification("Error al actualizar estado de lectura.", "error")
      }
    },
    [userRole, apiUserId, showNotification, isMessageSentByCurrentUser],
  )

  const fetchSpecificConversationData = useCallback(async () => {
    setIsLoading(true)
    setFetchError("")
    if (!selectedConversationIdFromParams) {
      setFetchError("No se ha seleccionado una conversación.")
      setIsLoading(false)
      return
    }

    try {
      const notesResponse = await fetch(`${API_URL}/Nota`)
      if (!notesResponse.ok) {
        throw new Error(`HTTP error! status: ${notesResponse.status}`)
      }
      const notesJson = await notesResponse.json()
      const notes = notesJson.notas || []

      const familiarResponse = await fetch(`${API_URL}/Familiar/${selectedConversationIdFromParams}`)
      if (!familiarResponse.ok) {
        throw new Error(`HTTP error! status: ${familiarResponse.status}`)
      }
      const familiarData = await familiarResponse.json()
      const familiar = familiarData.familiar

      if (!familiar) {
        throw new Error("Familiar not found.")
      }

      let resident = null
      if (familiar.residente && familiar.residente.id_residente) {
        const residentResponse = await fetch(`${API_URL}/Residente/${familiar.residente.id_residente}`)
        if (residentResponse.ok) {
          const residentData = await residentResponse.json()
          resident = residentData.residente
          const baseStaticUrl = API_URL.replace("/api", "")
          if (resident && resident.foto && resident.foto !== "default") {
            resident.foto_url = `${baseStaticUrl}/images/residents/${resident.foto}`
          } else {
            resident.foto_url = null
          }
        }
      }

      const conversationNotes = notes.filter((note) => note.id_familiar === selectedConversationIdFromParams)
      conversationNotes.sort((a, b) => new Date(a.fecha) - new Date(b.fecha))

      let unreadCount = 0
      conversationNotes.forEach((message) => {
        if (message.activo === true && !isMessageSentByCurrentUser(message, userRole, apiUserId)) {
          unreadCount++
        }
      })

      const currentConv = {
        familiarId: selectedConversationIdFromParams,
        familiar: familiar,
        resident: resident,
        messages: conversationNotes,
        unreadCount: unreadCount,
      }

      setSelectedConversation((prevConv) => {
        const prevMessageCount = prevConv ? prevConv.messages.length : 0
        if (currentConv.messages.length > prevMessageCount) {
          const lastNewMessage = currentConv.messages[currentConv.messages.length - 1]
          if (!isMessageSentByCurrentUser(lastNewMessage, userRole, apiUserId)) {
            playReceivedMessageSound()
          }
        }
        return currentConv
      })
      
      markMessagesAsRead(currentConv, selectedConversationIdFromParams)

      setTotalUnreadCount((prevTotal) => prevTotal - unreadCount + currentConv.unreadCount)
    } catch (error) {
      console.error("Error fetching specific chat data:", error)
      setFetchError("No se pudo cargar la conversación. Por favor, inténtalo de nuevo más o tarde.")
      showNotification && showNotification("Error al cargar la conversación.", "error")
    } finally {
      setIsLoading(false)
    }
  }, [selectedConversationIdFromParams, userRole, apiUserId, showNotification, isMessageSentByCurrentUser, playReceivedMessageSound, setTotalUnreadCount, markMessagesAsRead])

  useEffect(() => {
    fetchSpecificConversationData()
    setCurrentConversationMessagesToShowCount(INITIAL_MESSAGES_COUNT)

    const intervalId = setInterval(() => {
      fetchSpecificConversationData()
    }, POLLING_INTERVAL)

    return () => clearInterval(intervalId)
  }, [fetchSpecificConversationData, selectedConversationIdFromParams])

  useEffect(() => {
    if (loadingMoreOldMessages && chatFlatListRef.current) {
      setTimeout(() => {
        setLoadingMoreOldMessages(false)
      }, 100)
    }
  }, [loadingMoreOldMessages, messagesToDisplay.length])

  const onScroll = useCallback(
    ({ nativeEvent }) => {
      const scrollThreshold = 10

      if (
        nativeEvent.contentOffset.y >=
          nativeEvent.contentSize.height - nativeEvent.layoutMeasurement.height - scrollThreshold &&
        !loadingMoreOldMessages &&
        selectedConversation
      ) {
        const totalMessages = selectedConversation.messages.length
        if (currentConversationMessagesToShowCount < totalMessages) {
          setLoadingMoreOldMessages(true)
          setCurrentConversationMessagesToShowCount((prevCount) =>
            Math.min(prevCount + LOAD_MORE_MESSAGES_COUNT, totalMessages),
          )
        }
      }
    },
    [currentConversationMessagesToShowCount, loadingMoreOldMessages, selectedConversation],
  )

  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedConversationIdFromParams) {
      showNotification && showNotification("El mensaje no puede estar vacío.", "warning")
      return
    }

    if (!userRole || (userRole !== "family" && apiUserId === null && userRole !== "admin")) {
      showNotification && showNotification("No se pudo identificar tu rol o ID para enviar el mensaje.", "error")
      return
    }

    setIsSendingMessage(true)
    try {
      const formData = new FormData()
      formData.append("notaTexto", newMessage.trim())
      formData.append("id_familiar", selectedConversationIdFromParams.toString())

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
        id: Math.random().toString(36).substring(7),
        nota: newMessage.trim(),
        fecha: new Date().toISOString(),
        id_familiar: selectedConversationIdFromParams,
        id_personal: senderId,
        activo: true,
      }

      setNewMessage("")
      playSentMessageSound()

      setSelectedConversation((prevConv) => {
        if (!prevConv) return prevConv
        const updatedMessages = [...prevConv.messages, newNote].sort((a, b) => new Date(a.fecha) - new Date(b.fecha))

        let newUnreadCount = 0
        updatedMessages.forEach((message) => {
          if (message.activo === true && !isMessageSentByCurrentUser(message, userRole, apiUserId)) {
            newUnreadCount++
          }
        })
        return { ...prevConv, messages: updatedMessages, unreadCount: newUnreadCount }
      })
    } catch (error) {
      console.error("Error sending message:", error)
      setFetchError("Error al enviar el mensaje. Por favor, inténtalo de nuevo.")
      showNotification && showNotification("Error al enviar el mensaje.", "error")
    } finally {
      setIsSendingMessage(false)
    }
  }, [
    newMessage,
    selectedConversationIdFromParams,
    userRole,
    apiUserId,
    showNotification,
    playSentMessageSound,
    isMessageSentByCurrentUser,
  ])

  const forceScrollToBottom = useCallback(() => {
    if (chatFlatListRef.current) {
      try {
        chatFlatListRef.current.scrollToOffset({ offset: 0, animated: true })
      } catch (error) {
        console.log("Error in force scroll:", error)
      }
    }
  }, [])

  const renderMessageBubble = useCallback(
    ({ item: message }) => {
      let senderDisplayName = ""
      if (message.id_personal === apiUserId && userRole === "employee") {
        senderDisplayName = "Tú"
      } else if (message.id_personal === 0 && userRole === "admin") {
        senderDisplayName = "Tú"
      } else if (message.id_personal === null && userRole === "family") {
        senderDisplayName = "Tú"
      } else if (message.id_personal === 0) {
        senderDisplayName = "Administrador"
      } else if (message.id_personal !== null && personalMap.has(message.id_personal)) {
        const employee = personalMap.get(message.id_personal)
        senderDisplayName = `${employee.nombre} ${employee.apellido}`
      } else if (message.id_personal === null && selectedConversation && selectedConversation.familiar) {
        senderDisplayName = `${selectedConversation.familiar.nombre} ${selectedConversation.familiar.apellido}`
      }

      let alignRight = false
      if (userRole === "admin") {
        alignRight = message.id_personal !== null
      } else if (userRole === "employee") {
        alignRight = (message.id_personal !== null && message.id_personal === apiUserId) || message.id_personal === 0
      } else if (userRole === "family") {
        alignRight = message.id_personal === null
      }

      const messageDate = new Date(message.fecha)
      const today = new Date()
      const isSameDay =
        messageDate.getDate() === today.getDate() &&
        messageDate.getMonth() === today.getMonth() &&
        messageDate.getFullYear() === today.getFullYear()

      const timeOptions = { hour: "2-digit", minute: "2-digit", hour12: true }
      const dateTimeOptions = { dateStyle: "short", timeStyle: "short", hour12: true }

      const formattedDateTime = isSameDay
        ? messageDate.toLocaleTimeString("es-ES", timeOptions)
        : messageDate.toLocaleString("es-ES", dateTimeOptions)

      return (
        <View style={[styles.messageBubble, alignRight ? styles.messageBubbleSent : styles.messageBubbleReceived]}>
          {senderDisplayName && (
            <Text
              style={[
                styles.messageSenderName,
                { color: COLORS.DARK_GRAY },
                alignRight ? { textAlign: "right" } : { textAlign: "left" },
              ]}
            >
              {senderDisplayName}
            </Text>
          )}
          <Text style={[styles.messageText, alignRight && styles.messageTextSent]}>{message.nota}</Text>
          <Text style={[styles.messageDate, alignRight && styles.messageDateSent]}>{formattedDateTime}</Text>
        </View>
      )
    },
    [userRole, apiUserId, selectedConversation, personalMap],
  )

  return (
    <SafeAreaView style={styles.safeArea}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY_GREEN} />
          <Text style={styles.loadingText}>Cargando conversación...</Text>
        </View>
      ) : fetchError ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.ERROR} />
          <Text style={styles.errorText}>{fetchError}</Text>
        </View>
      ) : !selectedConversation ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color={COLORS.LIGHT_GRAY} />
          <Text style={styles.noMessagesText}>No se encontró la conversación.</Text>
        </View>
      ) : (
        <View style={styles.chatContainer}>
          <View style={styles.chatMessagesPane}>
            <View style={styles.chatHeader}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={COLORS.MEDIUM_GRAY} />
              </TouchableOpacity>
              <View style={styles.chatHeaderAvatar}>
                {selectedConversation.resident && selectedConversation.resident.foto_url ? (
                  <Image
                    source={{ uri: selectedConversation.resident.foto_url }}
                    style={styles.chatHeaderAvatarImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.chatHeaderAvatarText}>
                    {selectedConversation.familiar
                      ? `${selectedConversation.familiar.nombre.charAt(0)}${selectedConversation.familiar.apellido.charAt(0)}`
                      : "U"}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.chatHeaderContent}
                onPress={() => {
                  if (selectedConversation.resident?.id_residente) {
                    navigation.navigate("Residents", {
                      screen: "ResidentProfile",
                      params: { residentId: selectedConversation.resident.id_residente },
                    })
                  } else {
                    console.log("No hay un residente asociado o su ID no está disponible para redirigir.")
                  }
                }}
              >
                <Text style={styles.chatHeaderTitle}>
                  {selectedConversation.familiar
                    ? `${selectedConversation.familiar.nombre} ${selectedConversation.familiar.apellido}`
                    : "Familiar Desconocido"}
                </Text>
                <Text style={styles.chatHeaderSubtitle}>
                  Residente:{" "}
                  {selectedConversation.resident
                    ? `${selectedConversation.resident.nombre} ${selectedConversation.resident.apellido}`
                    : "No asignado"}
                </Text>
              </TouchableOpacity>
              {selectedConversation && selectedConversation.unreadCount > 0 && (
                <TouchableOpacity
                  style={styles.markAllReadButton}
                  onPress={() => markMessagesAsRead(selectedConversation, selectedConversation.familiarId)}
                >
                  <Ionicons name="checkmark-done" size={20} color={COLORS.PRIMARY_GREEN} />
                  <Text style={styles.markAllReadButtonText}>Marcar Leído</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.scrollToBottomButton} onPress={forceScrollToBottom}>
                <Ionicons name="chevron-down" size={20} color={COLORS.PRIMARY_GREEN} />
              </TouchableOpacity>
            </View>

            <FlatList
              ref={chatFlatListRef}
              data={messagesToDisplay}
              renderItem={renderMessageBubble}
              keyExtractor={(message) => message.id.toString()}
              contentContainerStyle={styles.messagesListContent}
              showsVerticalScrollIndicator={true}
              alwaysBounceVertical={true}
              onScroll={onScroll}
              scrollEventThrottle={16}
              inverted={true}
            />

            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
              style={styles.inputAreaContainer}
            >
              <View style={styles.inputArea}>
                <TextInput
                  ref={messageInputRef}
                  style={styles.messageInput}
                  placeholder="Escribe un mensaje..."
                  placeholderTextColor={COLORS.MEDIUM_GRAY}
                  value={newMessage}
                  onChangeText={setNewMessage}
                  editable={!isSendingMessage}
                  multiline
                  onKeyPress={({ nativeEvent }) => {
                    if (Platform.OS === "web" && nativeEvent.key === "Enter" && !nativeEvent.shiftKey) {
                      sendMessage()
                      nativeEvent.preventDefault()
                    }
                  }}
                />
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    (!newMessage.trim() || isSendingMessage) && styles.sendButtonDisabled,
                  ]}
                  onPress={sendMessage}
                  disabled={isSendingMessage || !newMessage.trim()}
                >
                  {isSendingMessage ? (
                    <ActivityIndicator size="small" color={COLORS.WHITE} />
                  ) : (
                    <Ionicons name="send" size={20} color={COLORS.WHITE} />
                  )}
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        </View>
      )}
    </SafeAreaView>
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
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.VERY_LIGHT_GRAY,
    marginTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.MEDIUM_GRAY,
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 16,
  },
  errorText: {
    color: COLORS.ERROR,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 16,
  },
  noMessagesText: {
    textAlign: "center",
    fontSize: 16,
    color: COLORS.MEDIUM_GRAY,
    fontWeight: "500",
  },
  chatContainer: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: COLORS.BACKGROUND_LIGHT,
    borderRadius: IS_LARGE_SCREEN ? 12 : 0,
    overflow: "hidden",
    margin: IS_LARGE_SCREEN ? 16 : 0,
    marginTop: IS_LARGE_SCREEN ? 16 : 60,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.DARK_GRAY,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.1)",
      },
    }),
  },
  chatMessagesPane: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_LIGHT,
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.DIVIDER,
    backgroundColor: COLORS.WHITE,
    ...commonShadow,
    zIndex: 1,
  },
  backButton: {
    marginRight: 12,
    padding: 8,
    borderRadius: 8,
  },
  chatHeaderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.PRIMARY_GREEN,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  chatHeaderAvatarImage: {
    width: "100%",
    height: "100%",
  },
  chatHeaderAvatarText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: "600",
  },
  chatHeaderContent: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    ...Platform.select({
      web: {
        cursor: "pointer",
        "&:hover": {
          backgroundColor: COLORS.HOVER_EFFECT_COLOR,
        },
      },
    }),
  },
  chatHeaderTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 2,
  },
  chatHeaderSubtitle: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: "400",
  },
  messagesListContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexGrow: 1,
    backgroundColor: "#F5F5F5",
  },
  messageBubble: {
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 10,
    maxWidth: "85%",
    ...commonShadow,
  },
  messageBubbleSent: {
    backgroundColor: COLORS.MESSAGE_SENT,
    alignSelf: "flex-end",
    borderBottomRightRadius: 6,
  },
  messageTextSent: {
    color: COLORS.WHITE,
    fontSize: 15,
    fontWeight: "400",
  },
  messageDateSent: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 10,
    fontWeight: "300",
  },
  messageBubbleReceived: {
    backgroundColor: COLORS.MESSAGE_RECEIVED,
    alignSelf: "flex-start",
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.MESSAGE_BORDER,
  },
  messageText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "400",
  },
  messageSenderName: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 4,
  },
  messageDate: {
    fontSize: 10,
    color: COLORS.TEXT_MUTED,
    textAlign: "right",
    marginTop: 6,
    fontWeight: "300",
  },
  inputAreaContainer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.DIVIDER,
    backgroundColor: COLORS.WHITE,
    ...commonShadow,
  },
  inputArea: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    gap: 8,
  },
  messageInput: {
    flex: 1,
    backgroundColor: COLORS.VERY_LIGHT_GRAY,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 44,
    maxHeight: 120,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    borderWidth: 1,
    borderColor: COLORS.DIVIDER,
    ...Platform.select({
      web: {
        outlineWidth: 0,
        resize: "none",
        transition: "border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
        "&:focus": {
          borderColor: COLORS.PRIMARY_GREEN,
          boxShadow: `0 0 0 2px ${COLORS.LIGHT_GREEN}`,
        },
      },
    }),
  },
  sendButton: {
    backgroundColor: COLORS.PRIMARY_GREEN,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      web: {
        transition: "all 0.2s ease-in-out",
        cursor: "pointer",
        "&:hover": {
          backgroundColor: COLORS.LIGHT_GREEN,
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
  noConversationSelected: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 16,
    backgroundColor: COLORS.BACKGROUND_LIGHT,
  },
  noConversationSelectedText: {
    fontSize: 18,
    color: COLORS.MEDIUM_GRAY,
    textAlign: "center",
    fontWeight: "500",
  },
  markAllReadButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.ACCENT_BACKGROUND,
    marginLeft: 10,
    ...Platform.select({
      web: {
        cursor: "pointer",
        "&:hover": {
          backgroundColor: COLORS.HOVER_EFFECT_COLOR,
        },
      },
    }),
  },
  markAllReadButtonText: {
    marginLeft: 5,
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.PRIMARY_GREEN,
  },
  scrollToBottomButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.ACCENT_BACKGROUND,
    marginLeft: 8,
    ...Platform.select({
      web: {
        cursor: "pointer",
        "&:hover": {
          backgroundColor: COLORS.HOVER_EFFECT_COLOR,
        },
      },
    }),
  },
})