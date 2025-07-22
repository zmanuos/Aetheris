// ResidentCard.js
import { View, Text, StyleSheet, ScrollView, Image, TextInput, TouchableOpacity, Alert, ActivityIndicator, Modal, Platform } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useState } from "react"
import Config from "../../../config/config"

const API_URL = Config.API_BASE_URL

const COLORS = {
  primaryGreen: "#10B981",
  lightGreenAccent: "#ECFDF5",
  darkText: "#111827",
  lightText: "#6B7280",
  accentBlue: "#3B82F6",
  cardBackground: "#FFFFFF",
  pageBackground: "#F9FAFB",
  borderLight: "#E5E7EB",
  successGreen: "#10B981",
  warningOrange: "#F59E0B",
  dangerRed: "#EF4444",
  darkGray: "#374151",
  lightGray: "#D1D5DB",
  chartGrid: "#F9FAFB",
  infoBlue: "#3B82F6",
  purpleAccent: "#8B5CF6",
}

// Custom Confirmation Modal Component
const ConfirmationModal = ({ visible, message, onConfirm, onCancel, title }) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onCancel} // For Android back button
    >
      <View style={modalStyles.centeredView}>
        <View style={modalStyles.modalView}>
          <Text style={modalStyles.modalTitle}>{title}</Text>
          <Text style={modalStyles.modalText}>{message}</Text>
          <View style={modalStyles.buttonContainer}>
            <TouchableOpacity
              style={[modalStyles.button, modalStyles.buttonCancel]}
              onPress={onCancel}
            >
              <Text style={modalStyles.textStyle}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[modalStyles.button, modalStyles.buttonConfirm]}
              onPress={onConfirm}
            >
              <Text style={modalStyles.textStyle}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const ResidentCard = ({ resident, observations: initialObservations, calculateAge, onObservationsUpdated, showNotification }) => {
  const [isManagingObservations, setIsManagingObservations] = useState(false)
  const [newObservationText, setNewObservationText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [observationToDeleteId, setObservationToDeleteId] = useState(null);

  const handleAddObservation = async () => {
    if (!newObservationText.trim()) {
      if (showNotification) {
        showNotification("La observación no puede estar vacía.", "warning");
      } else {
        Alert.alert("Error", "La observación no puede estar vacía.");
      }
      return;
    }

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append("id_residente", resident.id_residente.toString())
      formData.append("observacion", newObservationText.trim())

      const response = await fetch(`${API_URL}/Observacion`, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "*/*",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (result.type === "Success") {
        setNewObservationText("")
        if (showNotification) {
          showNotification("Observación añadida exitosamente.", "success");
        } else {
          Alert.alert("Éxito", "Observación añadida exitosamente.");
        }
        if (onObservationsUpdated) {
          onObservationsUpdated()
        }
      } else {
        throw new Error(result.message || "Error al añadir la observación.")
      }
    } catch (error) {
      console.error("Error adding observation:", error)
      if (showNotification) {
        showNotification(`Error al añadir observación: ${error.message}`, "error");
      } else {
        Alert.alert("Error", `Error al añadir observación: ${error.message}`);
      }
    } finally {
      setIsLoading(false)
    }
  }

  const confirmDeleteObservation = (observationId) => {
    setObservationToDeleteId(observationId);
    setShowDeleteConfirmModal(true);
  };

  const executeDeleteObservation = async () => {
    setShowDeleteConfirmModal(false);
    if (observationToDeleteId === null) return;

    setIsLoading(true)
    try {
      const response = await fetch(`${API_URL}/Observacion/${observationToDeleteId}`, {
        method: "DELETE",
        headers: {
          Accept: "*/*",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (result.type === "Success") {
        if (showNotification) {
          showNotification("Observación eliminada exitosamente.", "success");
        } else {
          Alert.alert("Éxito", "Observación eliminada exitosamente.");
        }
        if (onObservationsUpdated) {
          onObservationsUpdated()
        }
      } else {
        throw new Error(result.message || "Error al eliminar la observación.")
      }
    } catch (error) {
      console.error("Error deleting observation:", error)
      if (showNotification) {
        showNotification(`Error al eliminar observación: ${error.message}`, "error");
      } else {
        Alert.alert("Error", `Error al eliminar observación: ${error.message}`);
      }
    } finally {
      setIsLoading(false)
      setObservationToDeleteId(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirmModal(false);
    setObservationToDeleteId(null);
  };

  return (
    <View style={styles.modernResidentCard}>
      <View style={styles.modernResidentHeader}>
        <View style={styles.modernAvatarContainer}>
          {resident.foto_url ? (
            <Image source={{ uri: resident.foto_url }} style={styles.modernAvatar} resizeMode="cover" />
          ) : (
            <View style={styles.modernAvatarPlaceholder}>
              <Ionicons name="person" size={32} color={COLORS.lightText} />
            </View>
          )}
        </View>
        <View style={styles.modernResidentInfo}>
          <Text style={styles.modernResidentName}>
            {resident.nombre} {resident.apellido}
          </Text>
          <Text style={styles.modernResidentDetails}>
            {calculateAge(resident.fecha_nacimiento)} años • {resident.genero}
          </Text>
          {resident.dispositivo && (
            <View style={styles.modernDeviceContainer}>
              <Ionicons name="watch" size={14} color={COLORS.accentBlue} />
              <Text style={styles.modernDeviceText}>{resident.dispositivo.nombre}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.modernObservationContainer}>
        <View style={styles.observationHeader}>
          <Ionicons name="document-text-outline" size={16} color={COLORS.warningOrange} />
          <Text style={styles.modernObservationTitle}>Observaciones</Text>
          <TouchableOpacity onPress={() => setIsManagingObservations(!isManagingObservations)} style={styles.editButton}>
            <Ionicons name={isManagingObservations ? "close-circle-outline" : "add-circle-outline"} size={20} color={COLORS.accentBlue} />
          </TouchableOpacity>
        </View>

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={COLORS.primaryGreen} />
          </View>
        )}

        {/* Conditional rendering for observations list (scrollable) */}
        {isManagingObservations ? (
          <ScrollView style={styles.observationScrollView} showsVerticalScrollIndicator={true}>
            {initialObservations && initialObservations.length > 0 ? (
              initialObservations.map((obs) => (
                <View key={obs.id} style={styles.observationManageItem}>
                  <Text style={styles.observationItemText}>{obs.observacion}</Text>
                  <TouchableOpacity
                    onPress={() => confirmDeleteObservation(obs.id)}
                    style={styles.deleteObservationButton}
                  >
                    <Ionicons name="trash-outline" size={20} color={COLORS.cardBackground} />
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={styles.noObservationsText}>No hay observaciones para gestionar.</Text>
            )}
          </ScrollView>
        ) : (
          <ScrollView style={styles.observationScrollView} showsVerticalScrollIndicator={true}>
            {initialObservations && initialObservations.length > 0 ? (
              initialObservations.map((obs, index) => (
                <Text key={index} style={styles.modernObservationText}>
                  • {obs.observacion}
                </Text>
              ))
            ) : (
              <Text style={styles.noObservationsText}>No hay observaciones registradas.</Text>
            )}
          </ScrollView>
        )}

        {/* New Observation Input and Send Button (STATIC - always visible) */}
        {isManagingObservations && ( // Only show input when managing observations
          <View style={styles.newObservationContainer}>
            <TextInput
              style={styles.newObservationInput}
              placeholder="Añadir nueva observación..."
              placeholderTextColor={COLORS.lightText}
              value={newObservationText}
              onChangeText={setNewObservationText}
              multiline={Platform.OS === 'web' ? false : true}
              onSubmitEditing={handleAddObservation}
              returnKeyType="done"
            />
            <TouchableOpacity onPress={handleAddObservation} style={styles.sendObservationButton}>
              <Ionicons name="send" size={20} color={COLORS.cardBackground} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ConfirmationModal
        visible={showDeleteConfirmModal}
        title="Confirmar Eliminación"
        message="¿Estás seguro de que quieres eliminar esta observación?"
        onConfirm={executeDeleteObservation}
        onCancel={cancelDelete}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  modernResidentCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  modernResidentHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  modernAvatarContainer: {
    marginRight: 16,
  },
  modernAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: COLORS.primaryGreen,
  },
  modernAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.borderLight,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: COLORS.borderLight,
  },
  modernResidentInfo: {
    flex: 1,
  },
  modernResidentName: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.darkText,
    marginBottom: 4,
  },
  modernResidentDetails: {
    fontSize: 16,
    color: COLORS.lightText,
    marginBottom: 8,
  },
  modernDeviceContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.lightGreenAccent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  modernDeviceText: {
    fontSize: 12,
    color: COLORS.accentBlue,
    marginLeft: 4,
    fontWeight: "600",
  },
  modernObservationContainer: {
    backgroundColor: COLORS.lightGreenAccent,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.primaryGreen,
    minHeight: 100,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    paddingBottom: 16, // Adjusted to make space for the input
  },
  observationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    justifyContent: "space-between",
  },
  modernObservationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.darkText,
    marginLeft: 6,
  },
  modernObservationText: {
    fontSize: 14,
    color: COLORS.darkText,
    lineHeight: 20,
    marginBottom: 6,
  },
  noObservationsText: {
    fontSize: 14,
    color: COLORS.lightText,
    textAlign: "center",
    marginTop: 10,
  },
  observationScrollView: {
    maxHeight: 150, // Set max height to create scroll after a certain point
    paddingBottom: 10, // Add some padding at the bottom of the scrollable content
  },
  editButton: {
    padding: 5,
  },
  observationManageItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  observationItemText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.darkText,
    marginRight: 10,
    lineHeight: 18,
  },
  deleteObservationButton: {
    backgroundColor: COLORS.dangerRed,
    padding: 6,
    borderRadius: 8,
    marginLeft: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  newObservationContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  newObservationInput: {
    backgroundColor: COLORS.pageBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    minHeight: 38,
    flex: 1,
    color: COLORS.darkText,
  },
  sendObservationButton: {
    backgroundColor: COLORS.accentBlue,
    borderRadius: 12,
    width: 40,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.accentBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.7)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    zIndex: 1,
  },
})

const modalStyles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%',
    maxWidth: 350,
  },
  modalTitle: {
    marginBottom: 15,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.darkText,
  },
  modalText: {
    marginBottom: 20,
    textAlign: "center",
    fontSize: 15,
    color: COLORS.lightText,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  button: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    elevation: 2,
    minWidth: 100,
    alignItems: 'center',
  },
  buttonCancel: {
    backgroundColor: COLORS.borderLight,
    marginRight: 10,
  },
  buttonConfirm: {
    backgroundColor: COLORS.dangerRed,
    marginLeft: 10,
  },
  textStyle: {
    color: COLORS.cardBackground,
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default ResidentCard
