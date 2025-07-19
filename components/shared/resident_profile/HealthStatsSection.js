import { View, Text, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"

const COLORS = {
  darkText: "#111827",
  lightText: "#6B7280",
  cardBackground: "#FFFFFF",
  pageBackground: "#F9FAFB",
  borderLight: "#E5E7EB",
  criticalRed: "#DC2626",
  warningOrange: "#F59E0B",
  successGreen: "#10B981",
  accentBlue: "#3B82F6",
}

const HealthStatCard = ({ title, value, unit, type, icon }) => {
  const getHealthStatus = (value, type) => {
    if (!value) return { color: COLORS.lightText, status: "N/A", icon: "help-outline" }

    switch (type) {
      case "heartRate":
        if (value < 60) return { color: COLORS.warningOrange, status: "Bajo", icon: "arrow-down-circle" }
        if (value > 100) return { color: COLORS.criticalRed, status: "Alto", icon: "arrow-up-circle" }
        return { color: COLORS.successGreen, status: "Normal", icon: "checkmark-circle" }
      case "spo2":
        if (value < 95) return { color: COLORS.criticalRed, status: "Crítico", icon: "warning" }
        if (value < 98) return { color: COLORS.warningOrange, status: "Bajo", icon: "alert-circle" }
        return { color: COLORS.successGreen, status: "Normal", icon: "checkmark-circle" }
      case "temperature":
        if (value < 36 || value > 37.5) return { color: COLORS.warningOrange, status: "Anormal", icon: "alert-circle" }
        return { color: COLORS.successGreen, status: "Normal", icon: "checkmark-circle" }
      case "imc":
        if (value < 18.5) return { color: COLORS.warningOrange, status: "Bajo peso", icon: "arrow-down-circle" }
        if (value > 25) return { color: COLORS.warningOrange, status: "Sobrepeso", icon: "arrow-up-circle" }
        return { color: COLORS.successGreen, status: "Normal", icon: "checkmark-circle" }
      default:
        return { color: COLORS.accentBlue, status: "OK", icon: "checkmark-circle" }
    }
  }

  const healthStatus = getHealthStatus(value, type)

  return (
    <View style={styles.healthStatCard}>
      <View style={styles.healthStatHeader}>
        <View style={[styles.healthStatIcon, { backgroundColor: `${healthStatus.color}15` }]}>
          <Ionicons name={icon} size={16} color={healthStatus.color} />
        </View>
        <View style={styles.healthStatInfo}>
          <Text style={styles.healthStatTitle}>{title}</Text>
          <Text style={[styles.healthStatValue, { color: healthStatus.color }]}>
            {value ? `${value}${unit}` : "Sin datos"}
          </Text>
        </View>
      </View>
      <View style={[styles.healthStatusBadge, { backgroundColor: `${healthStatus.color}10` }]}>
        <Ionicons name={healthStatus.icon} size={12} color={healthStatus.color} />
        <Text style={[styles.healthStatusText, { color: healthStatus.color }]}>
          {value ? healthStatus.status : "N/A"}
        </Text>
      </View>
    </View>
  )
}

const HealthStatsSection = ({ latestCheckup, getTimeSinceCheckup, isCheckupOverdue }) => {
  return (
    <View style={styles.modernHealthStatsRow}>
      <View
        style={[
          styles.modernHealthStatsSection,
          latestCheckup && isCheckupOverdue(latestCheckup?.fechaChequeo) && styles.healthStatsSectionOverdue,
        ]}
      >
        <View style={styles.modernCardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.cardIconContainer}>
              <Ionicons name="heart" size={18} color={COLORS.criticalRed} />
            </View>
            <Text style={styles.modernCardTitle}>
              {latestCheckup
                ? `Último chequeo - ${getTimeSinceCheckup(latestCheckup.fechaChequeo)}`
                : "Último chequeo - Sin datos"}
            </Text>
          </View>
        </View>
        {latestCheckup && isCheckupOverdue(latestCheckup?.fechaChequeo) && (
          <View style={styles.modernOverdueWarning}>
            <Ionicons name="warning" size={16} color={COLORS.criticalRed} />
            <Text style={styles.modernOverdueWarningText}>Se requiere realizar un nuevo chequeo</Text>
          </View>
        )}
        <View style={styles.modernHealthStatsGrid}>
          <HealthStatCard title="SpO2" value={latestCheckup?.spo2} unit="%" type="spo2" icon="water" />
          <HealthStatCard title="Pulso" value={latestCheckup?.pulso} unit=" bpm" type="heartRate" icon="heart" />
          <HealthStatCard
            title="Temperatura"
            value={latestCheckup?.temperaturaCorporal}
            unit="°C"
            type="temperature"
            icon="thermometer"
          />
          <HealthStatCard title="IMC" value={latestCheckup?.imc} unit="" type="imc" icon="body" />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  modernHealthStatsRow: {
    flexDirection: "column",
    gap: 20,
  },
  modernHealthStatsSection: {
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
    width: "100%",
  },
  healthStatsSectionOverdue: {
    borderWidth: 2,
    borderColor: COLORS.criticalRed,
    backgroundColor: "#FEF2F2",
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
  modernOverdueWarning: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.criticalRed,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  modernOverdueWarningText: {
    fontSize: 12,
    color: "#fff",
    marginLeft: 6,
    fontWeight: "600",
  },
  modernHealthStatsGrid: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  healthStatCard: {
    backgroundColor: COLORS.pageBackground,
    borderRadius: 12,
    padding: 16,
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  healthStatHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  healthStatIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  healthStatInfo: {
    flex: 1,
  },
  healthStatTitle: {
    fontSize: 12,
    color: COLORS.lightText,
    marginBottom: 2,
    fontWeight: "500",
  },
  healthStatValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  healthStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  healthStatusText: {
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 4,
  },
})

export default HealthStatsSection
