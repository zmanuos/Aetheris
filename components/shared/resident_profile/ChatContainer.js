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
import { useRef, useEffect, useState } from "react"
import Config from "../../../config/config"

const API_URL = Config.API_BASE_URL

const COLORS = {
  darkText: "#111827",
  lightText: "#6B7280",
  accentBlue: "#3B82F6",
  cardBackground: "#FFFFFF",
  pageBackground: "#F9FAFB",
  borderLight: "#E5E7EB",
  noteBackground: "#DBEAFE",
  employeeNoteBackground: "#F3F4F6",
  primaryGreen: "#10B981",
}

const IS_WEB = Platform.OS === "web"

const ChatContainer = ({ notes, newMessage, setNewMessage, isSendingMessage, sendMessage, messageInputRef, currentUserRole, currentUserId, familiar }) => {
  const scrollViewRef = useRef(null)
  const [senderNames, setSenderNames] = useState({});

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true })
    }
  }, [notes])

  useEffect(() => {
    // console.log("--- ChatContainer useEffect: fetching sender names ---"); // REMOVED LOG
    // console.log("Current notes for sender name fetch:", notes); // REMOVED LOG
    // console.log("Familiar object for sender name fetch:", familiar); // REMOVED LOG

    const fetchSenderNames = async () => {
      const newSenderNames = { ...senderNames };
      const uniqueSenderIds = new Set();

      notes.forEach(note => {
        if (note.id_personal !== null && note.id_personal !== undefined) {
          uniqueSenderIds.add(`employee-${note.id_personal}`);
        } else if (note.id_familiar !== null && note.id_familiar !== undefined) {
          uniqueSenderIds.add(`family-${note.id_familiar}`);
        }
      });

      // console.log("Unique sender IDs to fetch:", Array.from(uniqueSenderIds)); // REMOVED LOG

      for (const senderKey of Array.from(uniqueSenderIds)) {
        const [senderType, senderId] = senderKey.split('-');

        if (!newSenderNames[senderKey]) {
          try {
            let name = '';
            if (senderType === 'employee') {
              // console.log(`Fetching employee name for ID: ${senderId}`); // REMOVED LOG
              const response = await fetch(`${API_URL}/Personal/${senderId}`);
              if (response.ok) {
                const data = await response.json();
                name = data.personal ? `${data.personal.nombre} ${data.personal.apellido}` : 'Personal Desconocido';
                // console.log(`Fetched employee name for ID ${senderId}: ${name}`); // REMOVED LOG
              } else {
                // console.warn(`Failed to fetch employee name for ID ${senderId}. Status: ${response.status}`); // REMOVED LOG
                name = 'Personal Desconocido';
              }
            } else if (senderType === 'family') {
                // console.log(`Fetching family name for ID: ${senderId}`); // REMOVED LOG
                const allFamiliaresResponse = await fetch(`${API_URL}/Familiar`);
                if (allFamiliaresResponse.ok) {
                    const allFamiliaresData = await allFamiliaresResponse.json();
                    const familiaresArray = allFamiliaresData.familiares || allFamiliaresData;
                    const foundFamiliar = familiaresArray?.find(f => f.id === parseInt(senderId));
                    name = foundFamiliar ? `${foundFamiliar.nombre} ${foundFamiliar.apellido}` : 'Familiar Desconocido';
                    // console.log(`Fetched family name for ID ${senderId}: ${name}`); // REMOVED LOG
                } else {
                    // console.warn(`Failed to fetch all familiar data. Status: ${allFamiliaresResponse.status}`); // REMOVED LOG
                    name = 'Familiar Desconocido';
                }
            }
            newSenderNames[senderKey] = name;
          } catch (error) {
            console.error(`Error fetching name for ${senderType} ID ${senderId}:`, error);
            newSenderNames[senderKey] = senderType === 'employee' ? 'Personal Desconocido' : 'Familiar Desconocido';
          }
        }
      }
      setSenderNames(newSenderNames);
      // console.log("Updated senderNames state:", newSenderNames); // REMOVED LOG
    };

    fetchSenderNames();
  }, [notes, familiar]);


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
      return messageDate.toLocaleDateString("es-ES", { month: "short", day: "numeric" }) + " " + messageDate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: true })
    }
  }

  const getSenderDisplayName = (note) => {
    // console.log("--- getSenderDisplayName for note:", note.nota); // REMOVED LOG
    // console.log("  note.id_personal:", note.id_personal); // REMOVED LOG
    // console.log("  note.id_familiar:", note.id_familiar); // REMOVED LOG
    // console.log("  currentUserRole:", currentUserRole); // REMOVED LOG
    // console.log("  currentUserId:", currentUserId); // REMOVED LOG
    // console.log("  familiar object (in ChatContainer):", familiar); // REMOVED LOG


    const isFromEmployee = note.id_personal !== null && note.id_personal !== undefined;
    // console.log("  isFromEmployee (calculated):", isFromEmployee); // REMOVED LOG


    if (isFromEmployee) {
      // console.log("  -> Message is from an Employee path."); // REMOVED LOG
      // Check if the message was sent by the currently logged-in user (employee/admin)
      if ((currentUserRole === 'employee' || currentUserRole === 'admin') && currentUserId === note.id_personal) {
        // console.log("  -> Current user is Employee/Admin and matches note.id_personal."); // REMOVED LOG
        // If the current user is an admin, display "Encargado del asilo"
        if (currentUserRole === 'admin') {
          // console.log("    -> Current user role is Admin. Displaying 'Encargado del asilo'."); // REMOVED LOG
          return "Encargado del asilo";
        }
        // Otherwise, display "Tú (Personal Name)"
        const personalName = senderNames[`employee-${note.id_personal}`] || "Personal";
        // console.log(`    -> Current user role is Employee. Displaying 'Tú (${personalName})'.`); // REMOVED LOG
        return `Tú (${personalName})`;
      }
      // If it's an employee message but not from the current logged-in employee
      const otherPersonalName = senderNames[`employee-${note.id_personal}`] || "Personal";
      // console.log(`  -> Message from another Employee. Displaying '${otherPersonalName}'.`); // REMOVED LOG
      return otherPersonalName;
    } else {
      // console.log("  -> Message is from a Family path."); // REMOVED LOG
      // Message is from a family member
      // Check if the message was sent by the currently logged-in user (family)
      // Ensure familiar is not null before checking its properties
      const isFromCurrentUserFamily = currentUserRole === 'family' && familiar && currentUserId === familiar.id && familiar.id === note.id_familiar;
      // console.log("  -> isFromCurrentUserFamily (calculated):", isFromCurrentUserFamily); // REMOVED LOG


      if (isFromCurrentUserFamily) {
        const familiarName = senderNames[`family-${note.id_familiar}`] || "Familiar";
        // console.log(`    -> Current user is Family and matches note.id_familiar. Displaying 'Tú (${familiarName})'.`); // REMOVED LOG
        return `Tú (${familiarName})`;
      }
      // If it's a family message but not from the current logged-in family member
      const otherFamiliarName = senderNames[`family-${note.id_familiar}`] || "Familiar";
      // console.log(`  -> Message from another Family member. Displaying '${otherFamiliarName}'.`); // REMOVED LOG
      return otherFamiliarName;
    }
  };

  return (
    <View style={styles.modernChatCard}>
      <View style={styles.modernCardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={styles.cardIconContainer}>
            <Ionicons name="chatbubbles" size={18} color={COLORS.accentBlue} />
          </View>
          <Text style={styles.modernCardTitle}>Chat con familiar</Text>
        </View>
      </View>

      <View style={styles.chatMessagesContainer}>
        {notes.length > 0 ? (
          <ScrollView ref={scrollViewRef} style={styles.chatScrollView} showsVerticalScrollIndicator={true}>
            {notes.map((note, index) => {
              const isFromEmployee = note.id_personal !== null && note.id_personal !== undefined

              return (
                <View key={note.id || index} style={styles.modernMessageContainer}>
                  <View
                    style={[styles.modernMessageBubble, isFromEmployee ? styles.employeeMessage : styles.familyMessage]}
                  >
                    <View style={styles.messageHeader}>
                      <Text style={styles.messageSender}>{getSenderDisplayName(note)}</Text>
                      <Text style={styles.messageDate}>
                        {note.fecha && formatMessageDate(note.fecha)}
                      </Text>
                    </View>
                    <Text style={styles.modernMessageText}>{note.nota}</Text>
                  </View>
                </View>
              )
            })}
          </ScrollView>
        ) : (
          <View style={styles.noMessagesContainer}>
            <View style={styles.noDataIcon}>
              <Ionicons name="chatbubble-outline" size={24} color={COLORS.lightText} />
            </View>
            <Text style={styles.noMessagesText}>No hay mensajes</Text>
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

const styles = StyleSheet.create({
  modernChatCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
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
    backgroundColor: COLORS.pageBackground,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  modernCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.darkText,
  },
  chatMessagesContainer: {
    flex: 1,
  },
  chatScrollView: {
    flex: 1,
    maxHeight: 180,
  },
  modernMessageContainer: {
    marginBottom: 2,
  },
  modernMessageBubble: {
    padding: 8,
    borderRadius: 12,
    maxWidth: "100%",
  },
  employeeMessage: {
    backgroundColor: COLORS.employeeNoteBackground,
    alignSelf: "flex-end",
  },
  familyMessage: {
    backgroundColor: COLORS.noteBackground,
    alignSelf: "flex-start",
  },
  messageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 1,
  },
  messageSender: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.lightText,
  },
  messageDate: {
    fontSize: 9,
    color: COLORS.lightText,
  },
  modernMessageText: {
    fontSize: 12,
    color: COLORS.darkText,
    lineHeight: 16,
  },
  modernMessageInputContainer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 12,
    marginTop: 12,
  },
  modernInputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  modernMessageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.pageBackground,
    maxHeight: 60,
    fontSize: 13,
    minHeight: 40,
  },
  modernSendButton: {
    backgroundColor: COLORS.primaryGreen,
    borderRadius: 12,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.lightText,
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
    color: COLORS.lightText,
    marginTop: 8,
    textAlign: "center",
  },
})

export default ChatContainer