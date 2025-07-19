import { View, Text, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"

const COLORS = {
  darkText: "#111827",
  lightText: "#6B7280",
  cardBackground: "#FFFFFF",
  pageBackground: "#F9FAFB",
  borderLight: "#E5E7EB",
  purpleAccent: "#8B5CF6",
}

const FamilyContactCard = ({ familiar, familiarEmail }) => {
  if (!familiar) return null

  return (
    <View style={styles.modernFamilyCard}>
      <View style={styles.modernCardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={styles.cardIconContainer}>
            <Ionicons name="people" size={18} color={COLORS.purpleAccent} />
          </View>
          <Text style={styles.modernCardTitle}>Contacto de Emergencia</Text>
        </View>
      </View>
      <View style={styles.modernFamilyInfo}>
        <Text style={styles.modernFamilyName}>
          {familiar.nombre} {familiar.apellido}
        </Text>
        <View style={styles.familyDetails}>
          <Text style={styles.modernFamilyDetail}>
            <Text style={styles.familyLabel}>Parentesco:</Text> {familiar.parentesco?.nombre}
          </Text>
          <Text style={styles.modernFamilyDetail}>
            <Text style={styles.familyLabel}>Teléfono:</Text> {familiar.telefono}
          </Text>
          {familiarEmail && (
            <Text style={styles.modernFamilyDetail}>
              <Text style={styles.familyLabel}>Correo:</Text> {familiarEmail}
            </Text>
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  modernFamilyCard: {
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
  modernFamilyInfo: {
    gap: 8,
  },
  modernFamilyName: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.darkText,
    marginBottom: 8,
  },
  familyDetails: {
    gap: 4,
  },
  modernFamilyDetail: {
    fontSize: 14,
    color: COLORS.darkText,
  },
  familyLabel: {
    fontWeight: "500",
    color: COLORS.lightText,
  },
})

export default FamilyContactCard
