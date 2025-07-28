"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Platform,
  TextInput,
  KeyboardAvoidingView,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Audio } from "expo-av"
import Config from "../../config/config"
import { useNotification } from "../../src/context/NotificationContext"

const API_URL = Config.API_BASE_URL
const { width } = Dimensions.get("window")
const IS_LARGE_SCREEN = width > 768

const COLORS = {
  PRIMARY_GREEN: '#6BB240',
  LIGHT_GREEN: '#9CD275',
  ACCENT_BACKGROUND: '#E6FAE8',
  DARK_GRAY: '#1C1C1E',
  MEDIUM_GRAY: '#8E8E93',
  LIGHT_GRAY: '#C7C7CC',
  VERY_LIGHT_GRAY: '#F2F2F7',
  BACKGROUND_LIGHT: '#FFFFFF',
  HOVER_EFFECT_COLOR: '#E5E5EA',
  DIVIDER: '#EFEFF4',
  
  MESSAGE_SENT: '#6BB240',
  MESSAGE_RECEIVED: '#FFFFFF',
  MESSAGE_BORDER: '#E0E0E0',

  ERROR: '#FF3B30', 
  WARNING: '#FFCC00',
  TEXT_PRIMARY: '#1C1C1E',
  TEXT_SECONDARY: '#8E8E93',
  TEXT_MUTED: '#AEAEB2',
  WHITE: '#FFFFFF',
}

const INITIAL_MESSAGES_COUNT = 8
const LOAD_MORE_MESSAGES_COUNT = 5

export default function ChatGeneralScreen({ navigation, currentUserRole, currentUserId }) {
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [fetchError, setFetchError] = useState("")
  const [conversations, setConversations] = useState([])
  const [selectedConversationId, setSelectedConversationId] = useState(null)
  const [newMessage, setNewMessage] = useState("")
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  
  const [currentConversationMessagesToShowCount, setCurrentConversationMessagesToShowCount] = useState(INITIAL_MESSAGES_COUNT)
  const [loadingMoreOldMessages, setLoadingMoreOldMessages] = useState(false)

  const chatFlatListRef = useRef(null)
  const messageInputRef = useRef(null) 
  const soundObjectRef = useRef(new Audio.Sound())

  // Refs para el manejo del scroll al cargar mensajes antiguos y el scroll inicial
  const contentHeightRef = useRef(0);
  const scrollOffsetRef = useRef(0);
  const initialScrollDoneRef = useRef(false); // Ref para controlar el scroll inicial

  const { showNotification } = useNotification()

  const selectedConversation = useMemo(() => {
    return conversations.find((conv) => conv.familiarId === selectedConversationId)
  }, [conversations, selectedConversationId])

  useEffect(() => {
    const loadSound = async () => {
      try {
        await soundObjectRef.current.loadAsync(require("../../assets/sounds/sent_message2.mp3"))
      } catch (error) {
        console.error("Error loading sound:", error)
      }
    }

    loadSound()

    return () => {
      if (soundObjectRef.current) {
        soundObjectRef.current.unloadAsync()
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

  const fetchNotesAndFamilyData = useCallback(
    async (initialLoad = true) => {
      if (initialLoad) setIsLoading(true)
      setFetchError("")

      try {
        const notesResponse = await fetch(`${API_URL}/Nota`)
        if (!notesResponse.ok) {
          throw new Error(`HTTP error! status: ${notesResponse.status}`)
        }
        const notesJson = await notesResponse.json()
        const notes = notesJson.notas || []

        const groupedConversations = {}
        const uniqueFamiliarIds = new Set()
        notes.forEach((note) => {
          if (note.id_familiar) {
            uniqueFamiliarIds.add(note.id_familiar)
            if (!groupedConversations[note.id_familiar]) {
              groupedConversations[note.id_familiar] = {
                familiarId: note.id_familiar,
                familiar: null,
                resident: null,
                messages: [],
              }
            }
            groupedConversations[note.id_familiar].messages.push(note)
          }
        })

        const familiarPromises = Array.from(uniqueFamiliarIds).map(async (id) => {
          const response = await fetch(`${API_URL}/Familiar/${id}`)
          if (response.ok) {
            const data = await response.json()
            return data.familiar
          }
          console.warn(`Could not get familiar for ID: ${id}`)
          return null
        })
        const allFamiliars = (await Promise.all(familiarPromises)).filter(Boolean)

        const uniqueResidentIds = new Set()
        allFamiliars.forEach((f) => {
          if (f.residente && f.residente.id_residente) {
            uniqueResidentIds.add(f.residente.id_residente)
          }
        })

        const residentPromises = Array.from(uniqueResidentIds).map(async (id) => {
          const response = await fetch(`${API_URL}/Residente/${id}`)
          if (response.ok) {
            const data = await response.json()
            return data.residente
          }
          console.warn(`Could not get resident for ID: ${id}`)
          return null
        })
        const allResidents = (await Promise.all(residentPromises)).filter(Boolean)

        const enrichedConversations = Object.values(groupedConversations).map((conv) => {
          conv.familiar = allFamiliars.find((f) => f.id === conv.familiarId)
          if (conv.familiar && conv.familiar.residente) {
            conv.resident = allResidents.find((r) => r.id_residente === conv.familiar.residente.id_residente)
          }
          conv.messages.sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
          return conv
        })

        setConversations(enrichedConversations)
        if (
          enrichedConversations.length > 0 &&
          (!selectedConversationId || !enrichedConversations.find((c) => c.familiarId === selectedConversationId))
        ) {
          setSelectedConversationId(enrichedConversations[0].familiarId)
        }
      } catch (error) {
        console.error("Error fetching chat data:", error)
        setFetchError("No se pudieron cargar los mensajes. Por favor, inténtalo de nuevo más tarde.")
        showNotification && showNotification("Error al cargar los mensajes.", "error")
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [showNotification, selectedConversationId],
  )

  useEffect(() => {
    fetchNotesAndFamilyData(true)
  }, [fetchNotesAndFamilyData])

  // Resetear el conteo de mensajes a mostrar y el ref del scroll inicial
  useEffect(() => {
    setCurrentConversationMessagesToShowCount(INITIAL_MESSAGES_COUNT)
    initialScrollDoneRef.current = false // Reiniciar el ref al cambiar de conversación
  }, [selectedConversationId])

  // useEffect para manejar el scroll al final (carga inicial y envío de nuevos mensajes)
  useEffect(() => {
    if (chatFlatListRef.current && selectedConversation && selectedConversation.messages.length > 0) {
      const totalMessagesInConversation = selectedConversation.messages.length;
      const messagesCurrentlyDisplayed = messagesToDisplay.length;

      // Desplazarse al final si:
      // 1. Es la carga inicial de la conversación o se ha cambiado de conversación
      // 2. Se ha enviado un nuevo mensaje (y estamos mostrando todos los mensajes más recientes)
      // 3. NO estamos cargando mensajes antiguos (para evitar conflictos de scroll)
      if (!initialScrollDoneRef.current || (messagesCurrentlyDisplayed === totalMessagesInConversation && !loadingMoreOldMessages)) {
        setTimeout(() => {
          if (chatFlatListRef.current) {
            const animatedScroll = initialScrollDoneRef.current; // Usar animación si no es la carga inicial
            chatFlatListRef.current.scrollToEnd({ animated: animatedScroll });
          }
        }, 100); // Pequeño retraso para asegurar que la FlatList ha renderizado

        // Marcar el scroll inicial como hecho solo si realmente se ha desplazado al final de la conversación cargada.
        // Esto previene que se marque como hecho si solo se cargaron algunos mensajes iniciales.
        if (messagesCurrentlyDisplayed === totalMessagesInConversation) {
            initialScrollDoneRef.current = true;
        }
      }
    }
  }, [selectedConversation, messagesToDisplay.length, loadingMoreOldMessages]); // Dependencias para este efecto


  const onRefresh = useCallback(() => {
    setIsRefreshing(true)
    setCurrentConversationMessagesToShowCount(INITIAL_MESSAGES_COUNT)
    initialScrollDoneRef.current = false // Reiniciar el ref al refrescar
    fetchNotesAndFamilyData(false)
  }, [fetchNotesAndFamilyData])

  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedConversationId) {
      showNotification && showNotification("El mensaje no puede estar vacío.", "warning")
      return
    }

    setIsSendingMessage(true)
    try {
      const formData = new FormData()
      formData.append("notaTexto", newMessage.trim())
      formData.append("id_familiar", selectedConversationId.toString())

      if (currentUserRole === "employee" || currentUserRole === "admin") {
        formData.append("id_personal", currentUserId.toString())
      }

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

      const newNote = {
        id: Math.random().toString(36).substring(7),
        nota: newMessage.trim(),
        fecha: new Date().toISOString(),
        id_familiar: selectedConversationId,
        id_personal: currentUserRole === "employee" || currentUserRole === "admin" ? currentUserId : null,
      }

      setNewMessage("")
      playSentMessageSound()

      setConversations((prevConversations) =>
        prevConversations.map((conv) =>
          conv.familiarId === selectedConversationId
            ? { ...conv, messages: [...conv.messages, newNote].sort((a, b) => new Date(a.fecha) - new Date(b.fecha)) }
            : conv,
        ),
      )
      // Asegurarse de que el conteo incluya el nuevo mensaje para que se muestre inmediatamente
      // Esto también ayudará a que el useEffect de scroll se active.
      setCurrentConversationMessagesToShowCount(prev => (selectedConversation?.messages?.length || 0) + 1)

      // El scroll al final se gestiona ahora por el `useEffect` dedicado.
    } catch (error) {
      console.error("Error sending message:", error)
      setFetchError("Error al enviar el mensaje. Por favor, inténtalo de nuevo.")
      showNotification && showNotification("Error al enviar el mensaje.", "error")
    } finally {
      setIsSendingMessage(false)
    }
  }, [
    newMessage,
    selectedConversationId,
    currentUserRole,
    currentUserId,
    showNotification,
    playSentMessageSound,
    selectedConversation
  ])

  const filteredConversations = useMemo(() => {
    if (!searchQuery) {
      return conversations
    }
    const lowercasedQuery = searchQuery.toLowerCase()
    return conversations.filter(conv => {
      const familiarName = conv.familiar ? `${conv.familiar.nombre} ${conv.familiar.apellido}`.toLowerCase() : ''
      const residentName = conv.resident ? `${conv.resident.nombre} ${conv.resident.apellido}`.toLowerCase() : ''
      return familiarName.includes(lowercasedQuery) || residentName.includes(lowercasedQuery)
    })
  }, [conversations, searchQuery])

  const messagesToDisplay = useMemo(() => {
    if (!selectedConversation) return []
    const totalMessages = selectedConversation.messages.length
    return selectedConversation.messages.slice(
      Math.max(0, totalMessages - currentConversationMessagesToShowCount)
    )
  }, [selectedConversation, currentConversationMessagesToShowCount])

  // Captura la altura del contenido y el offset del scroll ANTES de cargar más mensajes
  const onScroll = useCallback(({ nativeEvent }) => {
    scrollOffsetRef.current = nativeEvent.contentOffset.y;
    contentHeightRef.current = nativeEvent.contentSize.height;

    // Detectar si el usuario está cerca del principio para cargar más mensajes
    if (nativeEvent.contentOffset.y <= 10 && !loadingMoreOldMessages && selectedConversation) {
      const totalMessages = selectedConversation.messages.length;
      if (currentConversationMessagesToShowCount < totalMessages) {
        setLoadingMoreOldMessages(true);
        setCurrentConversationMessagesToShowCount(prevCount => Math.min(prevCount + LOAD_MORE_MESSAGES_COUNT, totalMessages));
      }
    }
  }, [currentConversationMessagesToShowCount, loadingMoreOldMessages, selectedConversation]);

  // useEffect para ajustar el scroll después de cargar mensajes antiguos
  useEffect(() => {
    if (loadingMoreOldMessages && chatFlatListRef.current) {
      requestAnimationFrame(() => {
        if (chatFlatListRef.current) {
          const newContentHeight = chatFlatListRef.current.getScrollResponder().getMetrics().contentLength;
          const heightDifference = newContentHeight - contentHeightRef.current; // Diferencia de altura
          chatFlatListRef.current.scrollToOffset({ offset: scrollOffsetRef.current + heightDifference, animated: false });
          setLoadingMoreOldMessages(false); // Resetear el estado de carga
        }
      });
    }
  }, [loadingMoreOldMessages]); // Se activa cuando `loadingMoreOldMessages` cambia

  const renderConversationListItem = useCallback(
    ({ item }) => {
      const lastMessage = item.messages.length > 0 ? item.messages[item.messages.length - 1].nota : "Sin mensajes"
      const isActive = item.familiarId === selectedConversationId
      return (
        <TouchableOpacity
          style={[styles.conversationListItem, isActive && styles.conversationListItemActive]}
          onPress={() => setSelectedConversationId(item.familiarId)}
        >
          <View style={styles.conversationAvatar}>
            <Text style={styles.conversationAvatarText}>
              {item.familiar ? `${item.familiar.nombre.charAt(0)}${item.familiar.apellido.charAt(0)}` : "U"}
            </Text>
          </View>
          <View style={styles.conversationContent}>
            <Text style={styles.conversationListName}>
              {item.familiar ? `${item.familiar.nombre} ${item.familiar.apellido}` : "Familiar Desconocido"}
            </Text>
            <Text style={styles.conversationListLastMessage} numberOfLines={1}>
              {lastMessage}
            </Text>
          </View>
          <View style={styles.conversationMeta}>
            <Text style={styles.conversationListDate}>
              {item.messages.length > 0
                ? new Date(item.messages[item.messages.length - 1].fecha).toLocaleDateString("es-ES")
                : ""}
            </Text>
          </View>
        </TouchableOpacity>
      )
    },
    [selectedConversationId],
  )

  const renderMessageBubble = useCallback(
    ({ item: message }) => {
      const isSentByCurrentUser =
        message.id_personal !== null && (currentUserRole === "employee" || currentUserRole === "admin")
      let senderDisplayName = ""

      if (!isSentByCurrentUser && selectedConversation && selectedConversation.familiar) {
        senderDisplayName = `${selectedConversation.familiar.nombre} ${selectedConversation.familiar.apellido}`
      }

      const messageDate = new Date(message.fecha)
      const today = new Date()
      const isSameDay =
        messageDate.getDate() === today.getDate() &&
        messageDate.getMonth() === today.getMonth() &&
        messageDate.getFullYear() === today.getFullYear()

      // Formato de 12 horas con AM/PM
      const timeOptions = { hour: "2-digit", minute: "2-digit", hour12: true }
      const dateTimeOptions = { dateStyle: "short", timeStyle: "short", hour12: true }

      const formattedDateTime = isSameDay
        ? messageDate.toLocaleTimeString("es-ES", timeOptions)
        : messageDate.toLocaleString("es-ES", dateTimeOptions)

      return (
        <View
          style={[styles.messageBubble, isSentByCurrentUser ? styles.messageBubbleSent : styles.messageBubbleReceived]}
        >
          {!isSentByCurrentUser && senderDisplayName && (
            <Text style={styles.messageSenderName}>{senderDisplayName}</Text>
          )}
          <Text style={[styles.messageText, isSentByCurrentUser && styles.messageTextSent]}>{message.nota}</Text>
          <Text style={[styles.messageDate, isSentByCurrentUser && styles.messageDateSent]}>
            {formattedDateTime}
          </Text>
        </View>
      )
    },
    [currentUserRole, selectedConversation],
  )

  return (
    <SafeAreaView style={styles.safeArea}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY_GREEN} />
          <Text style={styles.loadingText}>Cargando conversaciones...</Text>
        </View>
      ) : fetchError ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.ERROR} />
          <Text style={styles.errorText}>{fetchError}</Text>
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color={COLORS.LIGHT_GRAY} />
          <Text style={styles.noMessagesText}>No hay mensajes de familiares registrados.</Text>
        </View>
      ) : (
        <View style={styles.chatContainer}>
          <View
            style={[
              styles.conversationsListPane,
              IS_LARGE_SCREEN ? {} : selectedConversationId ? { display: "none" } : {},
            ]}
          >
            <View style={styles.searchBarContainer}>
              <Ionicons name="search" size={20} color={COLORS.MEDIUM_GRAY} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar por nombre de familiar o residente..."
                placeholderTextColor={COLORS.MEDIUM_GRAY}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <FlatList
              data={filteredConversations}
              renderItem={renderConversationListItem}
              keyExtractor={(item) => item.familiarId.toString()}
              contentContainerStyle={styles.conversationsListContent}
              refreshControl={
                <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[COLORS.PRIMARY_GREEN]} />
              }
              showsVerticalScrollIndicator={true} 
              alwaysBounceVertical={true}
            />
          </View>

          <View
            style={[styles.chatMessagesPane, IS_LARGE_SCREEN ? {} : selectedConversationId ? {} : { display: "none" }]}
          >
            {selectedConversation ? (
              <>
                <View style={styles.chatHeader}>
                  {!IS_LARGE_SCREEN && (
                    <TouchableOpacity onPress={() => setSelectedConversationId(null)} style={styles.backButton}>
                      <Ionicons name="arrow-back" size={24} color={COLORS.MEDIUM_GRAY} />
                    </TouchableOpacity>
                  )}
                  <View style={styles.chatHeaderAvatar}>
                    <Text style={styles.chatHeaderAvatarText}>
                      {selectedConversation.familiar
                        ? `${selectedConversation.familiar.nombre.charAt(0)}${selectedConversation.familiar.apellido.charAt(0)}`
                        : "U"}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.chatHeaderContent}
                    onPress={() => {
                      console.log(`Redirigir a perfil de familiar: ${selectedConversation.familiar?.nombre} ${selectedConversation.familiar?.apellido}`)
                      console.log(`Redirigir a perfil de residente: ${selectedConversation.resident?.nombre} ${selectedConversation.resident?.apellido}`)
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
                </View>

                <FlatList
                  ref={chatFlatListRef}
                  data={messagesToDisplay}
                  renderItem={renderMessageBubble}
                  keyExtractor={(message) => message.id.toString()}
                  contentContainerStyle={styles.messagesListContent}
                  showsVerticalScrollIndicator={true}
                  alwaysBounceVertical={true}
                  onScroll={onScroll} // Usamos la nueva función onScroll
                  scrollEventThrottle={16}
                  inverted={false}
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
                        (!newMessage.trim() || isSendingMessage) && styles.sendButtonDisabled
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
              </>
            ) : (
              <View style={styles.noConversationSelected}>
                <Ionicons name="chatbubble-ellipses-outline" size={64} color={COLORS.LIGHT_GRAY} />
                <Text style={styles.noConversationSelectedText}>Selecciona una conversación para ver los mensajes</Text>
              </View>
            )}
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
  conversationsListPane: {
    width: IS_LARGE_SCREEN ? "35%" : "100%",
    borderRightWidth: IS_LARGE_SCREEN ? 1 : 0,
    borderRightColor: COLORS.DIVIDER,
    backgroundColor: COLORS.WHITE,
    ...commonShadow,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.DIVIDER,
    ...commonShadow,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: COLORS.VERY_LIGHT_GRAY,
    borderRadius: 10, 
    paddingHorizontal: 12,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    borderWidth: 1,
    borderColor: COLORS.DIVIDER, 
    ...Platform.select({
      web: {
        outlineWidth: 0,
        "&:focus": {
          borderColor: COLORS.PRIMARY_GREEN, 
          boxShadow: `0 0 0 2px ${COLORS.LIGHT_GREEN}` 
        }
      },
    }),
  },
  conversationsListContent: {
    paddingVertical: 8,
  },
  conversationListItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginHorizontal: 12, 
    marginVertical: 6, 
    borderRadius: 12, 
    backgroundColor: COLORS.WHITE,
    ...commonShadow,
  },
  conversationListItemActive: {
    backgroundColor: COLORS.ACCENT_BACKGROUND, 
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
        "&:hover": {
          backgroundColor: COLORS.ACCENT_BACKGROUND, 
        },
      },
    }),
  },
  conversationAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.PRIMARY_GREEN, 
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  conversationAvatarText: {
    color: COLORS.WHITE,
    fontSize: 18, 
    fontWeight: "700", 
  },
  conversationContent: {
    flex: 1,
    marginRight: 8,
  },
  conversationListName: {
    fontSize: 17, 
    fontWeight: "600",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 2,
  },
  conversationListLastMessage: {
    fontSize: 14,
    color: COLORS.TEXT_MUTED,
    lineHeight: 20,
    fontWeight: "400", 
  },
  conversationMeta: {
    alignItems: "flex-end",
  },
  conversationListDate: {
    fontSize: 12,
    color: COLORS.TEXT_MUTED, 
    fontWeight: "400",
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
    justifyContent: "flex-end",
    backgroundColor: '#F5F5F5',
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
})