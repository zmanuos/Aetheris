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
    const fetchSenderNames = async () => {
      const newSenderNames = { ...senderNames };
      const uniqueSenderKeys = new Set();

      notes.forEach(note => {
        // Si id_personal es null, asumimos que es un administrador
        if (note.id_personal === null || note.id_personal === undefined) {
          uniqueSenderKeys.add('admin-null'); // Clave única para administradores con id_personal null
        } else {
          uniqueSenderKeys.add(`employee-${note.id_personal}`); // Para empleados con id_personal numérico
        }
        if (note.id_familiar !== null && note.id_familiar !== undefined) {
          uniqueSenderKeys.add(`family-${note.id_familiar}`);
        }
      });

      for (const senderKey of Array.from(uniqueSenderKeys)) {
        const [senderType, senderId] = senderKey.split('-'); // senderId podría ser 'null' o un número

        if (!newSenderNames[senderKey]) {
          try {
            let name = '';
            if (senderType === 'admin' && senderId === 'null') {
              name = 'Administrador'; // Asumimos que id_personal null es de un administrador
            } else if (senderType === 'employee') {
              // Si es un empleado con id_personal numérico
              const response = await fetch(`${API_URL}/Personal/${senderId}`);
              if (response.ok) {
                const data = await response.json();
                name = data.personal ? `${data.personal.nombre} ${data.personal.apellido}` : 'Personal Desconocido';
              } else {
                name = 'Personal Desconocido';
              }
            } else if (senderType === 'family') {
                const allFamiliaresResponse = await fetch(`${API_URL}/Familiar`);
                if (allFamiliaresResponse.ok) {
                    const allFamiliaresData = await allFamiliaresResponse.json();
                    const familiaresArray = allFamiliaresData.familiares || allFamiliaresData;
                    const foundFamiliar = familiaresArray?.find(f => f.id === parseInt(senderId));
                    name = foundFamiliar ? `${foundFamiliar.nombre} ${foundFamiliar.apellido}` : 'Familiar Desconocido';
                } else {
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
    const isFromEmployee = note.id_personal !== null && note.id_personal !== undefined;
    const isFromAdmin = note.id_personal === null || note.id_personal === undefined; // Nueva condición para administradores

    if (isFromAdmin) {
        // Si el mensaje es de un administrador (id_personal es null)
        // Y si el usuario actual es un administrador, mostrar "Tú (Administrador)"
        if (currentUserRole === 'admin') {
            return "Tú (Administrador)";
        }
        // Si el mensaje es de un administrador histórico, mostrar "Administrador"
        return "Administrador";
    } else if (isFromEmployee) {
      // Un mensaje es de un empleado (id_personal no es null)
      const senderKey = `employee-${note.id_personal}`;

      // Verifica si el mensaje fue enviado por el usuario actualmente logueado (empleado)
      if (currentUserRole === 'employee' && currentUserId === note.id_personal) {
        const personalName = senderNames[senderKey] || "Personal";
        return `Tú (${personalName})`;
      }

      // Si el mensaje es de otro empleado
      return senderNames[senderKey] || "Personal Desconocido";

    } else {
      // El mensaje es de un miembro de la familia
      const senderKey = `family-${note.id_familiar}`;
      const isFromCurrentUserFamily = currentUserRole === 'family' && familiar && currentUserId === familiar.id && familiar.id === note.id_familiar;

      if (isFromCurrentUserFamily) {
        const familiarName = senderNames[senderKey] || "Familiar";
        return `Tú (${familiarName})`;
      }
      // Si es un mensaje de un familiar pero no del familiar logueado actual
      return senderNames[senderKey] || "Familiar Desconocido";
    }
  };

  return (
    <View style={styles.modernChatCard}>
      <View style={styles.modernCardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={styles.cardIconContainer}>
            <Ionicons name="chatbubbles" size={18} color={COLORS.accentBlue} />
          </View>
          <Text style={styles.modernCardTitle}>Chat con el personal del asilo</Text>
        </View>
      </View>

      <View style={styles.chatMessagesContainer}>
        {notes.length > 0 ? (
          <ScrollView ref={scrollViewRef} style={styles.chatScrollView} showsVerticalScrollIndicator={true}>
            {notes.map((note, index) => {
              // Determina si el mensaje es de un empleado, familiar o, ahora, un administrador
              const isFromEmployee = note.id_personal !== null && note.id_personal !== undefined;
              const isFromAdminMessage = note.id_personal === null || note.id_personal === undefined; // Nueva lógica para identificar mensajes de admin

              return (
                <View key={note.id || index} style={styles.modernMessageContainer}>
                  <View
                    style={[
                      styles.modernMessageBubble,
                      isFromAdminMessage ? styles.employeeMessage : // Los mensajes de admin se alinean como los de empleado (derecha)
                      isFromEmployee ? styles.employeeMessage : styles.familyMessage
                    ]}
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