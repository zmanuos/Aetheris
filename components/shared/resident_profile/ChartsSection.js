// ChartsSection.js
"use client" // Añadido por si acaso, aunque no estaba en tu original
import { Platform, View, Text, StyleSheet } from "react-native" // MODIFICADO: Platform importado de react-native
import { Ionicons } from "@expo/vector-icons"

const COLORS = {
  darkText: "#111827",
  lightText: "#6B7280",
  cardBackground: "#FFFFFF",
  pageBackground: "#F9FAFB",
  borderLight: "#E5E7EB",
  criticalRed: "#DC2626",
  successGreen: "#10B981",
}

const IS_WEB = Platform.OS === "web"

const ModernChart = ({ data, title, color, unit, height = 160 }) => {
  if (!data || data.length === 0) {
    return (
      <View style={[styles.modernChartContainer, { height }]}>
        <View style={styles.chartHeader}>
          <View style={styles.chartTitleRow}>
            <Text style={styles.chartTitle}>{title}</Text>
            <View style={[styles.chartIndicator, { backgroundColor: color }]} />
          </View>
        </View>
        <View style={styles.noDataContainer}>
          <View style={styles.noDataIcon}>
            <Ionicons name="analytics-outline" size={28} color={COLORS.lightText} />
          </View>
          <Text style={styles.noDataText}>Sin datos disponibles</Text>
          <Text style={styles.noDataSubtext}>Los datos aparecerán aquí cuando estén disponibles</Text>
        </View>
      </View>
    )
  }

  const values = data.map((item) => item.value).filter((val) => val != null)
  const dates = data.map((item) => item.date)

  if (values.length === 0) {
    return (
      <View style={[styles.modernChartContainer, { height }]}>
        <View style={styles.chartHeader}>
          <View style={styles.chartTitleRow}>
            <Text style={styles.chartTitle}>{title}</Text>
            <View style={[styles.chartIndicator, { backgroundColor: color }]} />
          </View>
        </View>
        <View style={styles.noDataContainer}>
          <View style={styles.noDataIcon}>
            <Ionicons name="analytics-outline" size={28} color={COLORS.lightText} />
          </View>
          <Text style={styles.noDataText}>Sin datos válidos</Text>
          <Text style={styles.noDataSubtext}>Verifique la información de los chequeos</Text>
        </View>
      </View>
    )
  }

  const maxValue = Math.max(...values)
  const minValue = Math.min(...values)
  const range = maxValue - minValue || 1
  const chartHeight = height - 100
  const chartWidth = IS_WEB ? 300 : 260
  const pointSpacing = chartWidth / Math.max(values.length - 1, 1)

  const pathPoints = values.map((value, index) => {
    const x = index * pointSpacing + 50
    const y = chartHeight - ((value - minValue) / range) * (chartHeight - 40) + 30
    return { x, y, value }
  })

  const currentValue = values[values.length - 1]
  const previousValue = values[values.length - 2]
  const trend = previousValue ? ((currentValue - previousValue) / previousValue) * 100 : 0

  return (
    <View style={[styles.modernChartContainer, { height }]}>
      <View style={styles.chartHeader}>
        <View style={styles.chartTitleRow}>
          <Text style={styles.chartTitle}>{title}</Text>
          <View style={[styles.chartIndicator, { backgroundColor: color }]} />
        </View>
        <View style={styles.chartStats}>
          <Text style={[styles.chartCurrentValue, { color }]}>
            {currentValue?.toFixed(1)}
            {unit}
          </Text>
          {trend !== 0 && (
            <View style={[styles.trendIndicator, { backgroundColor: trend > 0 ? "#10B98115" : "#EF444415" }]}>
              <Ionicons
                name={trend > 0 ? "trending-up" : "trending-down"}
                size={12}
                color={trend > 0 ? COLORS.successGreen : COLORS.criticalRed}
              />
              <Text style={[styles.trendText, { color: trend > 0 ? COLORS.successGreen : COLORS.criticalRed }]}>
                {Math.abs(trend).toFixed(1)}%
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.modernChartArea}>
        {/* Grid lines */}
        <View style={styles.chartGridContainer}>
          {[0.2, 0.4, 0.6, 0.8].map((ratio, index) => (
            <View
              key={`grid-${index}`}
              style={[
                styles.gridLine,
                {
                  top: ratio * (chartHeight - 40) + 30,
                  left: 50,
                  right: 30,
                },
              ]}
            />
          ))}
        </View>

        {/* Area fill */}
        <View style={styles.chartAreaContainer}>
          {pathPoints.map((point, index) => {
            if (index === 0) return null
            const prevPoint = pathPoints[index - 1]
            const segmentWidth = point.x - prevPoint.x
            const avgHeight = Math.min(point.y, prevPoint.y)
            const segmentHeight = chartHeight - avgHeight + 30

            return (
              <View
                key={`area-${index}`}
                style={[
                  styles.modernAreaFill,
                  {
                    position: "absolute",
                    left: prevPoint.x,
                    top: avgHeight,
                    width: segmentWidth,
                    height: segmentHeight,
                    backgroundColor: color,
                    opacity: 0.12,
                  },
                ]}
              />
            )
          })}
        </View>

        {/* Trend lines and points */}
        <View style={styles.modernLineContainer}>
          {pathPoints.map((point, index) => {
            if (index === 0) return null
            const prevPoint = pathPoints[index - 1]
            const distance = Math.sqrt(Math.pow(point.y - prevPoint.y, 2) + Math.pow(point.x - prevPoint.x, 2)) // Corregido el cálculo de distancia
            const angle = (Math.atan2(point.y - prevPoint.y, point.x - prevPoint.x) * 180) / Math.PI

            return (
              <View
                key={`line-${index}`}
                style={[
                  styles.modernTrendLine,
                  {
                    position: "absolute",
                    left: prevPoint.x,
                    top: prevPoint.y,
                    width: distance,
                    height: 3,
                    backgroundColor: color,
                    transform: [{ rotate: `${angle}deg` }],
                    transformOrigin: "0 50%",
                    borderRadius: 1.5,
                  },
                ]}
              />
            )
          })}

          {/* Data points */}
          {pathPoints.map((point, index) => (
            <View key={`point-${index}`}>
              <View
                style={[
                  styles.modernDataPoint,
                  {
                    position: "absolute",
                    left: point.x - 5,
                    top: point.y - 5,
                    backgroundColor: color,
                    borderColor: COLORS.cardBackground,
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    borderWidth: 2,
                    shadowColor: color,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 3,
                  },
                ]}
              />
              {index === pathPoints.length - 1 && (
                <View
                  style={[
                    styles.currentValueIndicator,
                    {
                      position: "absolute",
                      left: point.x - 8,
                      top: point.y - 8,
                      width: 16,
                      height: 16,
                      borderRadius: 8,
                      borderWidth: 2,
                      borderColor: color,
                      backgroundColor: "transparent",
                    },
                  ]}
                />
              )}
            </View>
          ))}
        </View>

        {/* Y-axis labels */}
        <View style={styles.modernYAxisLabels}>
          <Text style={[styles.modernAxisLabel, { top: 25 }]}>{maxValue.toFixed(0)}</Text>
          <Text style={[styles.modernAxisLabel, { top: chartHeight / 2 + 15 }]}>
            {((maxValue + minValue) / 2).toFixed(0)}
          </Text>
          <Text style={[styles.modernAxisLabel, { top: chartHeight - 15 }]}>{minValue.toFixed(0)}</Text>
        </View>

        {/* X-axis labels */}
        <View style={styles.modernXAxisLabels}>
          <Text style={[styles.modernAxisLabel, { left: 50 }]}>{dates[0]}</Text>
          {dates.length > 2 && (
            <Text style={[styles.modernAxisLabel, { left: chartWidth / 2 + 25 }]}>
              {dates[Math.floor(dates.length / 2)]}
            </Text>
          )}
          {dates.length > 1 && <Text style={[styles.modernAxisLabel, { right: 30 }]}>{dates[dates.length - 1]}</Text>}
        </View>
      </View>
    </View>
  )
}

const ChartsSection = ({ spo2TrendData, pulseTrendData, temperatureTrendData, weightTrendData }) => {
  return (
    <View style={styles.modernChartsSection}>
      <View style={styles.modernSectionHeader}>
        <Text style={styles.modernSectionTitle}>Tendencias de Salud</Text>
      </View>
      <View style={styles.modernChartsGrid}>
        <ModernChart data={spo2TrendData} title="Oxigenación (SpO2)" color="#3B82F6" unit="%" height={160} />
        <ModernChart data={pulseTrendData} title="Pulso (Ritmo Cardíaco)" color="#DC2626" unit=" bpm" height={160} />
        <ModernChart data={temperatureTrendData} title="Temperatura Corporal" color="#F59E0B" unit="°C" height={160} />
        <ModernChart data={weightTrendData} title="Peso" color="#10B981" unit=" kg" height={160} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  modernChartsSection: {
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
    minHeight: 380,
  },
  modernSectionHeader: {
    marginBottom: 24,
  },
  modernSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.darkText,
    marginBottom: 12,
  },
  modernChartsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "space-between",
  },
  modernChartContainer: {
    backgroundColor: COLORS.pageBackground,
    borderRadius: 12,
    padding: 16,
    width: IS_WEB ? "48%" : "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    minHeight: 180,
  },
  chartHeader: {
    marginBottom: 16,
  },
  chartTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.darkText,
  },
  chartIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  chartStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chartCurrentValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  trendIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2,
  },
  trendText: {
    fontSize: 11,
    fontWeight: "600",
  },
  modernChartArea: {
    flex: 1,
    position: "relative",
  },
  chartGridContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridLine: {
    position: "absolute",
    height: 1,
    backgroundColor: COLORS.borderLight,
    opacity: 0.5,
  },
  chartAreaContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modernAreaFill: {
    borderRadius: 2,
  },
  modernLineContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modernTrendLine: {
    borderRadius: 1.5,
  },
  modernDataPoint: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  currentValueIndicator: {
    borderWidth: 2,
    backgroundColor: "transparent",
  },
  modernYAxisLabels: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 40,
    justifyContent: "space-between",
  },
  modernXAxisLabels: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modernAxisLabel: {
    fontSize: 10,
    color: COLORS.lightText,
    fontWeight: "500",
    position: "absolute",
  },
  noDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 30,
  },
  noDataIcon: {
    marginBottom: 12,
  },
  noDataText: {
    fontSize: 14,
    color: COLORS.lightText,
    textAlign: "center",
    fontWeight: "500",
    marginBottom: 4,
  },
  noDataSubtext: {
    fontSize: 12,
    color: COLORS.lightText,
    textAlign: "center",
    opacity: 0.8,
  },
})

export default ChartsSection