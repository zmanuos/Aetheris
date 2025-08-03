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
  Image,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Audio } from "expo-av"
import Config from "../../config/config"
import { useNotification } from "../../src/context/NotificationContext"
import { useSession } from "../../src/context/SessionContext"
import { useUnreadMessages } from "../../src/context/UnreadMessagesContext" // Importar el nuevo contexto
import MessageReceivedSound from "../../assets/sounds/MessageReceived.mp3"

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
const POLLING_INTERVAL = 5000 // 5 segundos

export default function ChatGeneralScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [fetchError, setFetchError] = useState("")
  const [conversations, setConversations] = useState([])
  const [selectedConversationId, setSelectedConversationId] = useState(null)
  const [newMessage, setNewMessage] = useState("")
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [personalMap, setPersonalMap] = useState(new Map())

  const [currentConversationMessagesToShowCount, setCurrentConversationMessagesToShowCount] =
    useState(INITIAL_MESSAGES_COUNT)
  const [loadingMoreOldMessages, setLoadingMoreOldMessages] = useState(false)

  const chatFlatListRef = useRef(null)
  const messageInputRef = useRef(null)
  const soundObjectRef = useRef(new Audio.Sound())
  const soundObjectReceivedRef = useRef(new Audio.Sound())
  const conversationsRef = useRef([]) // Ref para almacenar el estado actual de conversations

  const { showNotification } = useNotification()
  const { session } = useSession()
  const { userRole, apiUserId } = session
  const { setTotalUnreadCount } = useUnreadMessages() // Usar el contexto de mensajes no leídos

  // Actualiza el ref cada vez que 'conversations' cambia
  useEffect(() => {
    conversationsRef.current = conversations
  }, [conversations])

  const selectedConversation = useMemo(() => {
    return conversations.find((conv) => conv.familiarId === selectedConversationId)
  }, [conversations, selectedConversationId])

  // messagesToDisplay ahora corta los últimos N mensajes y los invierte
  const messagesToDisplay = useMemo(() => {
    if (!selectedConversation) return []
    const totalMessages = selectedConversation.messages.length
    // Corta los últimos 'currentConversationMessagesToShowCount' mensajes y los invierte
    return selectedConversation.messages
      .slice(Math.max(0, totalMessages - currentConversationMessagesToShowCount))
      .reverse()
  }, [selectedConversation, currentConversationMessagesToShowCount])

  useEffect(() => {
    const loadSound = async () => {
      try {
        await soundObjectRef.current.loadAsync(require("../../assets/sounds/sent_message2.mp3"))
        await soundObjectRef.current.setVolumeAsync(1)

        // Cargar el sonido de mensaje recibido
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

  // Helper para determinar si un mensaje fue enviado por el usuario actual
  const isMessageSentByCurrentUser = useCallback((message, currentUserRole, currentApiUserId) => {
    if (currentUserRole === "admin") {
      return message.id_personal === 0 // Admin's own messages have id_personal = 0
    } else if (currentUserRole === "employee") {
      return message.id_personal === currentApiUserId // Employee's own messages have their apiUserId
    } else if (currentUserRole === "family") {
      return message.id_personal === null // Family's own messages have id_personal = null
    }
    return false
  }, [])

  const markMessagesAsRead = useCallback(
    async (familiarIdToMark) => {
      const conversationToMark = conversations.find((conv) => conv.familiarId === familiarIdToMark)
      if (!conversationToMark) return

      // Filtrar los mensajes no leídos que NO fueron enviados por el usuario actual
      const unreadMessagesForCurrentUser = conversationToMark.messages.filter((message) => {
        return message.activo === true && !isMessageSentByCurrentUser(message, userRole, apiUserId)
      })

      if (unreadMessagesForCurrentUser.length === 0) return

      // Optimistically update frontend
      setConversations((prevConversations) => {
        const updatedConversations = prevConversations.map((conv) => {
          if (conv.familiarId === familiarIdToMark) {
            const updatedMessages = conv.messages.map((message) => {
              const shouldMarkAsRead = unreadMessagesForCurrentUser.some((um) => um.id === message.id)
              return shouldMarkAsRead ? { ...message, activo: false } : message // Set activo to false (read)
            })
            // Recalcular unreadCount con la nueva lógica
            let newUnreadCount = 0
            updatedMessages.forEach((message) => {
              if (message.activo === true && !isMessageSentByCurrentUser(message, userRole, apiUserId)) {
                newUnreadCount++
              }
            })
            return { ...conv, messages: updatedMessages, unreadCount: newUnreadCount }
          }
          return conv
        })

        // Calcular el total de mensajes no leídos para el SideMenu
        const totalUnread = updatedConversations.reduce((sum, conv) => sum + conv.unreadCount, 0)
        setTotalUnreadCount(totalUnread)

        return updatedConversations
      })

      // Send updates to backend
      try {
        for (const message of unreadMessagesForCurrentUser) {
          const formData = new FormData()
          formData.append("activo", "false") // Send 'false' as string for [FromForm] bool in backend

          const response = await fetch(`${API_URL}/Nota/activo/${message.id}`, {
            method: "PUT",
            body: formData, // Send as FormData because backend expects [FromForm]
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
    [conversations, userRole, apiUserId, showNotification, isMessageSentByCurrentUser, setTotalUnreadCount],
  )

  const fetchNotesAndFamilyData = useCallback(
    async (initialLoad = true) => {
      // ***** LOGS DE DEPURACIÓN - INICIO *****
      console.log("Current userRole:", userRole)
      console.log("Current apiUserId:", apiUserId)
      // ***** LOGS DE DEPURACIÓN - FIN *****

      if (initialLoad) setIsLoading(true)
      setFetchError("")

      try {
        const notesResponse = await fetch(`${API_URL}/Nota`)
        if (!notesResponse.ok) {
          throw new Error(`HTTP error! status: ${notesResponse.status}`)
        }
        const notesJson = await notesResponse.json()
        const notes = notesJson.notas || []

        const groupedConversationsFromNotes = {}
        const uniquePersonalIds = new Set()

        notes.forEach((note) => {
          if (note.id_familiar) {
            if (!groupedConversationsFromNotes[note.id_familiar]) {
              groupedConversationsFromNotes[note.id_familiar] = {
                familiarId: note.id_familiar,
                familiar: null,
                resident: null,
                messages: [],
              }
            }
            groupedConversationsFromNotes[note.id_familiar].messages.push(note)
          }
          if (note.id_personal !== null && note.id_personal !== 0) {
            uniquePersonalIds.add(note.id_personal)
          }
        })

        const allFamiliarsResponse = await fetch(`${API_URL}/Familiar`)
        if (!allFamiliarsResponse.ok) {
          throw new Error(`HTTP error! status: ${allFamiliarsResponse.status}`)
        }
        const allFamiliarsData = await allFamiliarsResponse.json()
        const allFamiliars = allFamiliarsData.familiares || []

        const finalConversations = {}

        allFamiliars.forEach((familiar) => {
          const existingConv = groupedConversationsFromNotes[familiar.id]
          if (existingConv) {
            finalConversations[familiar.id] = {
              ...existingConv,
              familiar: familiar,
            }
          } else {
            finalConversations[familiar.id] = {
              familiarId: familiar.id,
              familiar: familiar,
              resident: familiar.residente || null,
              messages: [],
            }
          }
        })

        const uniqueResidentIds = new Set()
        Object.values(finalConversations).forEach((conv) => {
          if (conv.familiar && conv.familiar.residente && conv.familiar.residente.id_residente) {
            uniqueResidentIds.add(conv.familiar.residente.id_residente)
          }
        })

        const baseStaticUrl = API_URL.replace("/api", "")

        const residentPromises = Array.from(uniqueResidentIds).map(async (id) => {
          const response = await fetch(`${API_URL}/Residente/${id}`)
          if (response.ok) {
            const data = await response.json()
            const resident = data.residente
            if (resident && resident.foto && resident.foto !== "default") {
              resident.foto_url = `${baseStaticUrl}/images/residents/${resident.foto}`
            } else {
              resident.foto_url = null
            }
            return resident
          }
          console.warn(`Could not get resident for ID: ${id}`)
          return null
        })
        const allResidents = (await Promise.all(residentPromises)).filter(Boolean)
        const residentMap = new Map(allResidents.map((r) => [r.id_residente, r]))

        const personalPromises = Array.from(uniquePersonalIds).map(async (id) => {
          const response = await fetch(`${API_URL}/Personal/${id}`)
          if (response.ok) {
            const data = await response.json()
            return data.personal
          }
          console.warn(`Could not get personal for ID: ${id}`)
          return null
        })
        const allPersonal = (await Promise.all(personalPromises)).filter(Boolean)
        setPersonalMap(new Map(allPersonal.map((p) => [p.id, p])))

        const enrichedConversations = Object.values(finalConversations).map((conv) => {
          if (conv.familiar && conv.familiar.residente && conv.familiar.residente.id_residente) {
            conv.resident = residentMap.get(conv.familiar.residente.id_residente) || conv.resident
          }
          if (conv.messages.length > 0) {
            conv.messages.sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
          }

          let unreadCount = 0
          conv.messages.forEach((message) => {
            // Un mensaje se cuenta como no leído si está activo Y NO fue enviado por el usuario actual
            if (message.activo === true && !isMessageSentByCurrentUser(message, userRole, apiUserId)) {
              unreadCount++
            }
          })
          return { ...conv, unreadCount }
        })

        // Lógica para reproducir sonido de notificación en la pantalla general
        if (!initialLoad) {
          const prevConversationsMap = new Map(
            conversationsRef.current.map((conv) => [conv.familiarId, conv.messages.length]),
          )

          enrichedConversations.forEach((newConv) => {
            const prevMessageCount = prevConversationsMap.get(newConv.familiarId) || 0
            if (newConv.messages.length > prevMessageCount) {
              const lastNewMessage = newConv.messages[newConv.messages.length - 1]
              // Reproducir sonido si es un mensaje nuevo Y NO fue enviado por el usuario actual
              if (!isMessageSentByCurrentUser(lastNewMessage, userRole, apiUserId)) {
                playReceivedMessageSound()
              }
            }
          })
        }

        enrichedConversations.sort((a, b) => {
          const dateA = a.messages.length > 0 ? new Date(a.messages[a.messages.length - 1].fecha) : new Date(0)
          const dateB = b.messages.length > 0 ? new Date(b.messages[b.messages.length - 1].fecha) : new Date(0)
          return dateB - dateA
        })

        setConversations(enrichedConversations)
        if (
          enrichedConversations.length > 0 &&
          (!selectedConversationId || !enrichedConversations.find((c) => c.familiarId === selectedConversationId))
        ) {
          setSelectedConversationId(enrichedConversations[0].familiarId)
        }

        // Calcular el total de mensajes no leídos para el SideMenu
        const totalUnread = enrichedConversations.reduce((sum, conv) => sum + conv.unreadCount, 0)
        setTotalUnreadCount(totalUnread)
      } catch (error) {
        console.error("Error fetching chat data:", error)
        setFetchError("No se pudieron cargar los mensajes. Por favor, inténtalo de nuevo más tarde.")
        showNotification && showNotification("Error al cargar los mensajes.", "error")
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [
      showNotification,
      selectedConversationId,
      userRole,
      apiUserId,
      setPersonalMap,
      playReceivedMessageSound,
      isMessageSentByCurrentUser,
      setTotalUnreadCount, // Añadir al array de dependencias
    ],
  )

  useEffect(() => {
    fetchNotesAndFamilyData(true) // Initial fetch on component mount

    const intervalId = setInterval(() => {
      fetchNotesAndFamilyData(false) // Fetch periodically without showing full loading
    }, POLLING_INTERVAL)

    return () => clearInterval(intervalId) // Cleanup interval on unmount
  }, [fetchNotesAndFamilyData]) // Dependency array ensures effect runs only when fetchNotesAndFamilyData changes

  // Cuando se selecciona una nueva conversación, reiniciamos el contador de mensajes a mostrar
  useEffect(() => {
    setCurrentConversationMessagesToShowCount(INITIAL_MESSAGES_COUNT)
  }, [selectedConversationId])

  // useEffect para mantener la posición de scroll al cargar más mensajes antiguos
  useEffect(() => {
    if (loadingMoreOldMessages && chatFlatListRef.current) {
      // Pequeña demora para asegurar que FlatList haya renderizado los nuevos elementos
      setTimeout(() => {
        setLoadingMoreOldMessages(false)
      }, 100)
    }
  }, [loadingMoreOldMessages, messagesToDisplay.length]) // Depende de la cantidad de mensajes para reaccionar a la carga

  const handleSelectConversation = useCallback(
    (familiarId) => {
      setSelectedConversationId(familiarId)
      setCurrentConversationMessagesToShowCount(INITIAL_MESSAGES_COUNT) // Reiniciar para la nueva conversación
      markMessagesAsRead(familiarId)
    },
    [markMessagesAsRead],
  )

  // onScroll handler para cargar más mensajes antiguos
  const onScroll = useCallback(
    ({ nativeEvent }) => {
      const scrollThreshold = 10 // Distancia desde el "final" de la lista invertida para cargar más

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

  const onRefresh = useCallback(() => {
    setIsRefreshing(true)
    setCurrentConversationMessagesToShowCount(INITIAL_MESSAGES_COUNT) // Reiniciar en refresh
    fetchNotesAndFamilyData(false)
  }, [fetchNotesAndFamilyData])

  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedConversationId) {
      showNotification && showNotification("El mensaje no puede estar vacío.", "warning")
      return
    }

    if (!userRole || (userRole !== "family" && apiUserId === null && userRole !== "admin")) {
      // Verificación mejorada
      showNotification && showNotification("No se pudo identificar tu rol o ID para enviar el mensaje.", "error")
      return
    }

    setIsSendingMessage(true)
    try {
      const formData = new FormData()
      formData.append("notaTexto", newMessage.trim())
      formData.append("id_familiar", selectedConversationId.toString())

      const senderId = userRole === "employee" ? apiUserId : userRole === "admin" ? 0 : null
      formData.append("id_personal", senderId !== null ? senderId.toString() : "")
      formData.append("activo", "true") // Default to 'true' (unread for the recipient) for boolean

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
        id_familiar: selectedConversationId,
        id_personal: senderId,
        activo: true, // Asegurar que sea booleano aquí
      }

      setNewMessage("")
      playSentMessageSound()

      setConversations((prevConversations) => {
        const updatedConversations = prevConversations.map((conv) => {
          if (conv.familiarId === selectedConversationId) {
            const updatedMessages = [...conv.messages, newNote].sort((a, b) => new Date(a.fecha) - new Date(b.fecha))

            let newUnreadCount = 0
            updatedMessages.forEach((message) => {
              // Recalcular unreadCount con la nueva lógica
              if (message.activo === true && !isMessageSentByCurrentUser(message, userRole, apiUserId)) {
                newUnreadCount++
              }
            })
            return { ...conv, messages: updatedMessages, unreadCount: newUnreadCount }
          }
          return conv
        })
        updatedConversations.sort((a, b) => {
          const dateA = a.messages.length > 0 ? new Date(a.messages[a.messages.length - 1].fecha) : new Date(0)
          const dateB = b.messages.length > 0 ? new Date(b.messages[b.messages.length - 1].fecha) : new Date(0)
          return dateB - dateA
        })

        // Calcular el total de mensajes no leídos para el SideMenu
        const totalUnread = updatedConversations.reduce((sum, conv) => sum + conv.unreadCount, 0)
        setTotalUnreadCount(totalUnread)

        return updatedConversations
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
    selectedConversationId,
    userRole,
    apiUserId,
    showNotification,
    playSentMessageSound,
    selectedConversation,
    isMessageSentByCurrentUser,
    setTotalUnreadCount, // Añadir al array de dependencias
  ])

  // forceScrollToBottom ahora desplaza al inicio de la lista invertida (mensaje más reciente)
  const forceScrollToBottom = useCallback(() => {
    if (chatFlatListRef.current) {
      try {
        chatFlatListRef.current.scrollToOffset({ offset: 0, animated: true })
      } catch (error) {
        console.log("Error in force scroll:", error)
      }
    }
  }, [])

  const filteredConversations = useMemo(() => {
    if (!searchQuery) {
      return conversations
    }
    const lowercasedQuery = searchQuery.toLowerCase()
    return conversations.filter((conv) => {
      const familiarName = conv.familiar ? `${conv.familiar.nombre} ${conv.familiar.apellido}`.toLowerCase() : ""
      const residentName = conv.resident ? `${conv.resident.nombre} ${conv.resident.apellido}`.toLowerCase() : ""
      return familiarName.includes(lowercasedQuery) || residentName.includes(lowercasedQuery)
    })
  }, [conversations, searchQuery])

  const renderConversationListItem = useCallback(
    ({ item }) => {
      const lastMessage = item.messages.length > 0 ? item.messages[item.messages.length - 1].nota : "Sin mensajes"
      const isActive = item.familiarId === selectedConversationId

      const lastMessageDate = item.messages.length > 0 ? new Date(item.messages[item.messages.length - 1].fecha) : null
      const today = new Date()
      let formattedDate = ""

      if (lastMessageDate) {
        const isSameDay =
          lastMessageDate.getDate() === today.getDate() &&
          lastMessageDate.getMonth() === today.getMonth() &&
          lastMessageDate.getFullYear() === today.getFullYear()

        if (isSameDay) {
          formattedDate = lastMessageDate.toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
        } else {
          formattedDate = lastMessageDate.toLocaleDateString("es-ES")
        }
      }

      return (
        <TouchableOpacity
          style={[styles.conversationListItem, isActive && styles.conversationListItemActive]}
          onPress={() => handleSelectConversation(item.familiarId)}
        >
          <View style={styles.conversationAvatar}>
            {item.resident && item.resident.foto_url ? (
              <Image
                source={{ uri: item.resident.foto_url }}
                style={styles.conversationAvatarImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.conversationAvatarText}>
                {item.resident ? `${item.resident.nombre.charAt(0)}${item.resident.apellido.charAt(0)}` : "U"}
              </Text>
            )}
          </View>
          <View style={styles.conversationContent}>
            <Text style={styles.conversationListName}>
              {item.familiar ? `${item.familiar.nombre} ${item.familiar.apellido}` : "Familiar Desconocido"}
            </Text>
            {item.resident && (
              <Text style={styles.residentNameInList}>
                Residente: {`${item.resident.nombre} ${item.resident.apellido}`}
              </Text>
            )}
            <Text style={styles.conversationListLastMessage} numberOfLines={1}>
              {lastMessage}
            </Text>
          </View>
          {/* Se movió la fecha y la insignia de no leídos al final del contenedor para alineación derecha */}
          <View style={styles.conversationMeta}>
            <Text style={styles.conversationListDate}>{formattedDate}</Text>
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{item.unreadCount > 99 ? "99+" : item.unreadCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      )
    },
    [selectedConversationId, handleSelectConversation],
  )

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
        // Admin ve sus propios mensajes (id_personal !== null, es decir, admin o empleado) a la derecha.
        // Mensajes de familiar (id_personal === null) a la izquierda.
        alignRight = message.id_personal !== null
      } else if (userRole === "employee") {
        // Empleado ve sus propios mensajes (id_personal === apiUserId) a la derecha.
        // Empleado también ve los mensajes del Administrador (id_personal === 0) a la derecha.
        alignRight = (message.id_personal !== null && message.id_personal === apiUserId) || message.id_personal === 0
      } else if (userRole === "family") {
        // Familiar ve sus propios mensajes (id_personal === null) a la derecha.
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
                  {/* Botón para "Marcar todo como leído" - OPCIONAL */}
                  {selectedConversation && selectedConversation.unreadCount > 0 && (
                    <TouchableOpacity
                      style={styles.markAllReadButton}
                      onPress={() => markMessagesAsRead(selectedConversation.familiarId)}
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
                  onScroll={onScroll} // Reintroducimos onScroll para la carga de mensajes antiguos
                  scrollEventThrottle={16}
                  inverted={true} // ¡Importante! Esto invierte la lista para que los mensajes más recientes estén abajo
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
                      style={[styles.sendButton, (!newMessage.trim() || isSendingMessage) && styles.sendButtonDisabled]}
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
    flexDirection: "row",
    alignItems: "center",
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
          boxShadow: `0 0 0 2px ${COLORS.LIGHT_GREEN}`,
        },
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
    overflow: "hidden",
  },
  conversationAvatarImage: {
    width: "100%",
    height: "100%",
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
  residentNameInList: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginTop: -2,
    marginBottom: 2,
  },
  conversationListLastMessage: {
    fontSize: 14,
    color: COLORS.TEXT_MUTED,
    lineHeight: 20,
    fontWeight: "400",
  },
  conversationMeta: {
    alignItems: "flex-end", // Alinea el contenido a la derecha
    justifyContent: "center", // Centra verticalmente el contenido
    // Eliminamos 'position: relative' si no hay elementos hijos con 'position: absolute'
    // para evitar comportamientos inesperados de z-index
  },
  conversationListDate: {
    fontSize: 12,
    color: COLORS.TEXT_MUTED,
    fontWeight: "400",
  },
  unreadBadge: {
    backgroundColor: COLORS.PRIMARY_GREEN, // CAMBIO: Color verde
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    // Eliminamos 'position: absolute', 'top', 'right'
    marginTop: 4, // Añade un margen para que esté debajo de la fecha
  },
  unreadBadgeText: {
    color: COLORS.WHITE,
    fontSize: 12,
    fontWeight: "bold",
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
    // No necesitamos justifyContent: 'flex-end' con inverted FlatList
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