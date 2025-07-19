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

const ChatContainer = ({ notes, newMessage, setNewMessage, isSendingMessage, sendMessage, messageInputRef }) => {
  return (
    <View style={styles.modernChatCard}>
      <View style={styles.modernCardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={styles.cardIconContainer}>
            <Ionicons name="chatbubbles" size={18} color={COLORS.accentBlue} />
          </View>
          <Text style={styles.modernCardTitle}>Comunicación</Text>
        </View>
      </View>

      <View style={styles.chatMessagesContainer}>
        {notes.length > 0 ? (
          <ScrollView style={styles.chatScrollView} showsVerticalScrollIndicator={false}>
            {notes.slice(0, 4).map((note, index) => {
              const isFromEmployee = note.id_personal !== null && note.id_personal !== undefined

              return (
                <View key={note.id || index} style={styles.modernMessageContainer}>
                  <View
                    style={[styles.modernMessageBubble, isFromEmployee ? styles.employeeMessage : styles.familyMessage]}
                  >
                    <View style={styles.messageHeader}>
                      <Text style={styles.messageSender}>{isFromEmployee ? "Personal" : "Familiar"}</Text>
                      <Text style={styles.messageDate}>
                        {note.fecha &&
                          new Date(note.fecha).toLocaleDateString("es-ES", { month: "short", day: "numeric" })}
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
    marginBottom: 8,
  },
  modernMessageBubble: {
    padding: 12,
    borderRadius: 12,
    maxWidth: "90%",
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
    marginBottom: 4,
  },
  messageSender: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.lightText,
  },
  messageDate: {
    fontSize: 10,
    color: COLORS.lightText,
  },
  modernMessageText: {
    fontSize: 13,
    color: COLORS.darkText,
    lineHeight: 18,
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
