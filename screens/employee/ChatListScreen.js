// screens/ChatListScreen.js
"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
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
  Image,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import Config from "../../config/config"
import { useNotification } from "../../src/context/NotificationContext"
import { useSession } from "../../src/context/SessionContext"
import { useUnreadMessages } from "../../src/context/UnreadMessagesContext"
import { useNavigation } from "@react-navigation/native"

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

const POLLING_INTERVAL = 5000

export default function ChatListScreen() {
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [fetchError, setFetchError] = useState("")
  const [conversations, setConversations] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [personalMap, setPersonalMap] = useState(new Map())

  const conversationsRef = useRef([])
  const navigation = useNavigation()

  const { showNotification } = useNotification()
  const { session } = useSession()
  const { userRole, apiUserId } = session
  const { setTotalUnreadCount } = useUnreadMessages()

  useEffect(() => {
    conversationsRef.current = conversations
  }, [conversations])

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
            if (message.activo === true && !isMessageSentByCurrentUser(message, userRole, apiUserId)) {
              unreadCount++
            }
          })
          return { ...conv, unreadCount }
        })

        enrichedConversations.sort((a, b) => {
          const dateA = a.messages.length > 0 ? new Date(a.messages[a.messages.length - 1].fecha) : new Date(0)
          const dateB = b.messages.length > 0 ? new Date(b.messages[b.messages.length - 1].fecha) : new Date(0)
          return dateB - dateA
        })

        setConversations(enrichedConversations)

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
    [showNotification, userRole, apiUserId, setPersonalMap, isMessageSentByCurrentUser, setTotalUnreadCount],
  )

  useEffect(() => {
    fetchNotesAndFamilyData(true)

    const intervalId = setInterval(() => {
      fetchNotesAndFamilyData(false)
    }, POLLING_INTERVAL)

    return () => clearInterval(intervalId)
  }, [fetchNotesAndFamilyData])

  const handleSelectConversation = useCallback(
    (familiarId) => {
      navigation.navigate("SpecificChat", { familiarId: familiarId, personalMap: Array.from(personalMap.entries()) })
    },
    [navigation, personalMap],
  )

  const onRefresh = useCallback(() => {
    setIsRefreshing(true)
    fetchNotesAndFamilyData(false)
  }, [fetchNotesAndFamilyData])

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
      const isActive = false

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
    [handleSelectConversation],
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
          <View style={styles.conversationsListPane}>
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
    marginTop: IS_LARGE_SCREEN ? 16 : 65,
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
    width: "100%",
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
    alignItems: "flex-end",
    justifyContent: "center",
  },
  conversationListDate: {
    fontSize: 12,
    color: COLORS.TEXT_MUTED,
    fontWeight: "400",
  },
  unreadBadge: {
    backgroundColor: COLORS.PRIMARY_GREEN,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    marginTop: 4,
  },
  unreadBadgeText: {
    color: COLORS.WHITE,
    fontSize: 12,
    fontWeight: "bold",
  },
})