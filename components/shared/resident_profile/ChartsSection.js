// ChartsSection.js
"use client"
import { Platform, View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useState, useRef, useEffect } from "react" // Agregado useRef y useEffect

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
  const [chartContainerWidth, setChartContainerWidth] = useState(0)
  const [activePoint, setActivePoint] = useState(null)
  const timeoutRef = useRef(null)

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

  const paddingLeft = 40;
  const paddingRight = 20;

  const chartDrawingHeight = height - 90;

  const chartContentPaddingX = 15;
  const chartContentPaddingY = 25;

  const effectiveChartWidth = Math.max(0, chartContainerWidth - paddingLeft - paddingRight);
  const scaledEffectiveChartWidth = Math.max(0, effectiveChartWidth - chartContentPaddingX * 2);
  const scaledChartDrawingHeight = Math.max(0, chartDrawingHeight - chartContentPaddingY * 2);

  const initialChartOffsetX = paddingLeft + chartContentPaddingX;
  const initialChartOffsetY = (height - chartDrawingHeight) / 2 + chartContentPaddingY - 60;

  const pointSpacing = scaledEffectiveChartWidth / Math.max(values.length - 1, 1)

  const pathPoints = values.map((value, index) => {
    const x = index * pointSpacing + initialChartOffsetX;
    const y = scaledChartDrawingHeight - ((value - minValue) / range) * scaledChartDrawingHeight + initialChartOffsetY;
    return { x, y, value, date: dates[index] };
  });

  const currentValue = values[values.length - 1]
  const previousValue = values[values.length - 2]
  const trend = previousValue ? ((currentValue - previousValue) / previousValue) * 100 : 0

  const handlePointPress = (point, index) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setActivePoint({ ...point, index });

    timeoutRef.current = setTimeout(() => {
      setActivePoint(null);
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

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

      <View
        style={styles.modernChartArea}
        onLayout={(event) => {
          setChartContainerWidth(event.nativeEvent.layout.width)
        }}>
        {/* Grid lines */}
        {chartContainerWidth > 0 && (
          <View style={styles.chartGridContainer}>
            {[0.2, 0.4, 0.6, 0.8].map((ratio, index) => (
              <View
                key={`grid-${index}`}
                style={[
                  styles.gridLine,
                  {
                    top: ratio * scaledChartDrawingHeight + initialChartOffsetY,
                    left: initialChartOffsetX,
                    width: scaledEffectiveChartWidth,
                  },
                ]}
              />
            ))}
          </View>
        )}

        {/* Area fill */}
        {chartContainerWidth > 0 && (
          <View style={styles.chartAreaContainer}>
            {pathPoints.map((point, index) => {
              if (index === 0) return null
              const prevPoint = pathPoints[index - 1]
              const segmentWidth = point.x - prevPoint.x
              const topY = Math.min(point.y, prevPoint.y);
              const segmentHeight = (scaledChartDrawingHeight + initialChartOffsetY) - topY;

              return (
                <View
                  key={`area-${index}`}
                  style={[
                    styles.modernAreaFill,
                    {
                      position: "absolute",
                      left: prevPoint.x,
                      top: topY,
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
        )}

        {/* Trend lines */}
        {chartContainerWidth > 0 && (
          <View style={styles.modernLineContainer}>
            {pathPoints.map((point, index) => {
              if (index === 0) return null
              const prevPoint = pathPoints[index - 1]
              const distance = Math.sqrt(Math.pow(point.y - prevPoint.y, 2) + Math.pow(point.x - prevPoint.x, 2))
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
          </View>
        )}

        {/* Data points */}
        {chartContainerWidth > 0 && (
          <View>
            {pathPoints.map((point, index) => (
              <TouchableOpacity
                key={`point-${index}`}
                style={[
                  styles.touchablePoint,
                  {
                    left: point.x - 15,
                    top: point.y - 15,
                  },
                ]}
                onPress={() => handlePointPress(point, index)}
              >
                <View
                  style={[
                    styles.modernDataPoint,
                    {
                      backgroundColor: color,
                      borderColor: COLORS.cardBackground,
                    },
                  ]}
                />
                {index === pathPoints.length - 1 && (
                  <View
                    style={[
                      styles.currentValueIndicator,
                      {
                        borderColor: color,
                      },
                    ]}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Y-axis labels */}
        <View style={styles.modernYAxisLabels}>
          <Text style={[styles.modernAxisLabel, { top: initialChartOffsetY - 10 }]}>{maxValue.toFixed(0)}</Text>
          <Text style={[styles.modernAxisLabel, { top: scaledChartDrawingHeight / 2 + initialChartOffsetY - 10 }]}>
            {((maxValue + minValue) / 2).toFixed(0)}
          </Text>
          <Text style={[styles.modernAxisLabel, { top: scaledChartDrawingHeight + initialChartOffsetY - 10 }]}>{minValue.toFixed(0)}</Text>
        </View>

        {/* X-axis labels */}
        {chartContainerWidth > 0 && (
          <View style={styles.modernXAxisLabels}>
            <Text style={[styles.modernAxisLabel, { left: initialChartOffsetX - 10 }]}>{dates[0]}</Text>
            {dates.length > 2 && (
              <Text style={[styles.modernAxisLabel, { left: scaledEffectiveChartWidth / 2 + initialChartOffsetX - 20 }]}>
                {dates[Math.floor(dates.length / 2)]}
              </Text>
            )}
            {dates.length > 1 && (
              <Text style={[styles.modernAxisLabel, { right: paddingRight - 10 + chartContentPaddingX }]}>{dates[dates.length - 1]}</Text>
            )}
          </View>
        )}
      </View>

      {/* Mostrar valor al tocar el punto - Posicionado al lado del punto, más abajo */}
      {activePoint && (
        <View
          style={[
            styles.pointValueBubble,
            {
              left: activePoint.x + 10,
              top: activePoint.y + 45,
              backgroundColor: color,
              transformOrigin: 'left center',
            },
          ]}
        >
          <Text style={styles.pointValueText}>
            {activePoint.value?.toFixed(1)}{unit}
          </Text>
        </View>
      )}
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
    marginBottom: 5,
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
    justifyContent: IS_WEB ? "flex-start" : "space-between",
    marginRight: IS_WEB ? -12 : 0, // Ajuste para reducir el margen derecho
  },
  modernChartContainer: {
    backgroundColor: COLORS.pageBackground,
    borderRadius: 12,
    padding: 16,
    width: IS_WEB ? 300 : "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    minHeight: 180,
    marginRight: IS_WEB ? 16 : 0,
    position: 'relative',
    overflow: 'visible',
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
    overflow: "hidden",
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
    position: "absolute",
    left: 10,
    top: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  currentValueIndicator: {
    position: "absolute",
    left: 7,
    top: 7,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: "transparent",
  },
  touchablePoint: {
    position: "absolute",
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  pointValueBubble: {
    position: "absolute",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 50,
    height: 28,
    zIndex: 10,
  },
  pointValueText: {
    color: COLORS.cardBackground,
    fontSize: 12,
    fontWeight: "600",
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