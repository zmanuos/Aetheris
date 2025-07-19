import { View, Text, StyleSheet, Pressable } from "react-native"
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
  infoBlue: "#3B82F6",
  chartGrid: "#F9FAFB",
}

const AlertsSummaryChart = ({ alerts, timeFilter, setAlertTimeFilter }) => {
  const getAlertTypeColor = (alertType) => {
    switch (alertType?.toLowerCase()) {
      case "crítica":
        return COLORS.criticalRed
      case "alta":
        return COLORS.warningOrange
      case "media":
        return COLORS.infoBlue
      case "baja":
        return COLORS.successGreen
      default:
        return COLORS.lightText
    }
  }

  const filterAlertsByTime = (alerts, filter) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    switch (filter) {
      case "24h":
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        return alerts.filter((alert) => new Date(alert.fecha) >= yesterday)
      case "7days":
        const weekAgo = new Date(today)
        weekAgo.setDate(weekAgo.getDate() - 7)
        return alerts.filter((alert) => new Date(alert.fecha) >= weekAgo)
      case "30days":
        const monthAgo = new Date(today)
        monthAgo.setDate(monthAgo.getDate() - 30)
        return alerts.filter((alert) => new Date(alert.fecha) >= monthAgo)
      default:
        return alerts
    }
  }

  const getAlertsSummary = (alerts, timeFilter) => {
    const filteredAlerts = filterAlertsByTime(alerts, timeFilter)
    const summary = {}

    filteredAlerts.forEach((alert) => {
      const message = alert.mensaje || "Sin descripción"
      if (summary[message]) {
        summary[message].count++
      } else {
        summary[message] = {
          count: 1,
          type: alert.alerta_tipo?.nombre || "N/A",
          color: getAlertTypeColor(alert.alerta_tipo?.nombre),
        }
      }
    })

    return Object.entries(summary)
      .map(([message, data]) => ({ message, ...data }))
      .sort((a, b) => b.count - a.count)
  }

  const getTimeFilterLabel = (filter) => {
    switch (filter) {
      case "24h":
        return "Últimas 24h"
      case "7days":
        return "Últimos 7 días"
      case "30days":
        return "Últimos 30 días"
      default:
        return "Últimos 7 días"
    }
  }

  const alertsSummary = getAlertsSummary(alerts, timeFilter)
  const maxCount = Math.max(...alertsSummary.map((item) => item.count), 1)

  return (
    <View style={styles.alertsSummaryCard}>
      <View style={styles.alertsSummaryHeader}>
        <View style={styles.alertsHeaderLeft}>
          <View style={styles.alertsIconContainer}>
            <Ionicons name="bar-chart" size={18} color={COLORS.warningOrange} />
          </View>
          <Text style={styles.alertsSummaryTitle}>Frecuencia de Alertas</Text>
        </View>
        <Text style={styles.alertsTimeLabel}>{getTimeFilterLabel(timeFilter)}</Text>
      </View>

      <View style={styles.alertsTimeFilter}>
        <View style={styles.alertsTimeButtons}>
          {[
            { key: "24h", label: "24h" },
            { key: "7days", label: "7d" },
            { key: "30days", label: "30d" },
          ].map((filter) => (
            <Pressable
              key={filter.key}
              style={[styles.alertsTimeButton, timeFilter === filter.key && styles.alertsTimeButtonActive]}
              onPress={() => setAlertTimeFilter(filter.key)}
            >
              <Text
                style={[styles.alertsTimeButtonText, timeFilter === filter.key && styles.alertsTimeButtonTextActive]}
              >
                {filter.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.alertsChart}>
        {alertsSummary.length > 0 ? (
          <View style={styles.alertsChartContainer}>
            <View style={styles.modernAlertsGrid}>
              {alertsSummary.slice(0, 5).map((alert, index) => (
                <View key={index} style={styles.modernAlertItem}>
                  <View style={styles.modernAlertBar}>
                    <View
                      style={[
                        styles.modernAlertBarFill,
                        {
                          height: `${Math.max((alert.count / maxCount) * 100, 15)}%`,
                          backgroundColor: alert.color,
                          borderRadius: 4,
                          shadowColor: alert.color,
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.2,
                          shadowRadius: 3,
                          elevation: 2,
                        },
                      ]}
                    />
                    <View style={[styles.modernAlertCount, { backgroundColor: alert.color }]}>
                      <Text style={styles.modernAlertCountText}>{alert.count}</Text>
                    </View>
                  </View>
                  <Text style={styles.modernAlertLabel} numberOfLines={2}>
                    {alert.message.length > 12 ? `${alert.message.substring(0, 12)}...` : alert.message}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.noAlertsChart}>
            <View style={styles.noAlertsIcon}>
              <Ionicons name="checkmark-circle" size={36} color={COLORS.successGreen} />
            </View>
            <Text style={styles.noAlertsChartText}>Sin alertas en este período</Text>
            <Text style={styles.noAlertsChartSubtext}>¡Excelente estado de salud!</Text>
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  alertsSummaryCard: {
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
    minHeight: 320,
  },
  alertsSummaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  alertsHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  alertsIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${COLORS.warningOrange}15`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  alertsSummaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.darkText,
  },
  alertsTimeLabel: {
    fontSize: 12,
    color: COLORS.lightText,
    fontWeight: "500",
  },
  alertsTimeFilter: {
    marginBottom: 20,
  },
  alertsTimeButtons: {
    flexDirection: "row",
    gap: 8,
  },
  alertsTimeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.pageBackground,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  alertsTimeButtonActive: {
    backgroundColor: COLORS.warningOrange,
    borderColor: COLORS.warningOrange,
  },
  alertsTimeButtonText: {
    fontSize: 12,
    color: COLORS.lightText,
    fontWeight: "500",
  },
  alertsTimeButtonTextActive: {
    color: "#fff",
  },
  alertsChart: {
    flex: 1,
  },
  alertsChartContainer: {
    flex: 1,
  },
  modernAlertsGrid: {
    flexDirection: "row",
    height: 200,
    alignItems: "flex-end",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    paddingBottom: 20,
    backgroundColor: COLORS.chartGrid,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  modernAlertItem: {
    alignItems: "center",
    flex: 1,
    marginHorizontal: 4,
    maxWidth: 70,
  },
  modernAlertBar: {
    height: 140,
    width: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
    position: "relative",
  },
  modernAlertBarFill: {
    width: "85%",
    borderRadius: 6,
    minHeight: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  modernAlertCount: {
    position: "absolute",
    top: -8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 20,
    alignItems: "center",
  },
  modernAlertCountText: {
    fontSize: 11,
    color: "#fff",
    fontWeight: "700",
  },
  modernAlertLabel: {
    fontSize: 11,
    color: COLORS.darkText,
    textAlign: "center",
    marginTop: 12,
    height: 32,
    lineHeight: 14,
    fontWeight: "500",
    paddingHorizontal: 2,
  },
  noAlertsChart: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  noAlertsIcon: {
    marginBottom: 16,
  },
  noAlertsChartText: {
    fontSize: 16,
    color: COLORS.lightText,
    marginBottom: 6,
    textAlign: "center",
    fontWeight: "500",
  },
  noAlertsChartSubtext: {
    fontSize: 14,
    color: COLORS.successGreen,
    textAlign: "center",
    fontWeight: "600",
  },
})

export default AlertsSummaryChart
