// ResidentCard.js
import { View, Text, StyleSheet, ScrollView, Image } from "react-native"
import { Ionicons } from "@expo/vector-icons"

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
}

const ResidentCard = ({ resident, observations, calculateAge }) => { // Changed to observations (plural)
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

      {/* Observations */}
      {observations && observations.length > 0 && (
        <View style={styles.modernObservationContainer}>
          <View style={styles.observationHeader}>
            <Ionicons name="document-text-outline" size={16} color={COLORS.warningOrange} />
            <Text style={styles.modernObservationTitle}>Observaciones</Text>
          </View>
          <ScrollView style={styles.observationScrollView} showsVerticalScrollIndicator={true}>
            {observations.map((obs, index) => (
              <Text key={index} style={styles.modernObservationText}>
                • {obs.observacion}
              </Text>
            ))}
          </ScrollView>
        </View>
      )}
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
    maxHeight: 140,
  },
  observationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  modernObservationTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.darkText,
    marginLeft: 6,
  },
  modernObservationText: {
    fontSize: 13,
    color: COLORS.darkText,
    lineHeight: 18,
  },
  observationScrollView: {
    maxHeight: 80,
    marginTop: 4,
  },
})

export default ResidentCard