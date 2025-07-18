"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
  Dimensions,
  Platform,
  Pressable,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import Config from "../../config/config"
import { useNotification } from "../../src/context/NotificationContext"
import BackButton from "../../components/shared/BackButton"

const API_URL = Config.API_BASE_URL
const { width, height } = Dimensions.get("window")
const IS_WEB = Platform.OS === "web"
const IS_LARGE_SCREEN = width > 1200

const COLORS = {
  primaryGreen: "#10B981",
  lightGreenAccent: "#ECFDF5",
  darkText: "#111827",
  lightText: "#6B7280",
  accentBlue: "#3B82F6",
  cardBackground: "#FFFFFF",
  pageBackground: "#F9FAFB",
  borderLight: "#E5E7EB",
  errorRed: "#EF4444",
  noteBackground: "#DBEAFE",
  employeeNoteBackground: "#F3F4F6",
  noNoteText: "#9CA3AF",
  criticalRed: "#DC2626",
  warningOrange: "#F59E0B",
  successGreen: "#10B981",
  infoBlue: "#3B82F6",
  purpleAccent: "#8B5CF6",
  chartGrid: "#F9FAFB",
  chartBorder: "#F3F4F6",
  gradientStart: "#F8FAFC",
  gradientEnd: "#F1F5F9",
}

export default function ResidentProfileScreen({ route, navigation }) {
  const { residentId, currentUserRole, currentUserId } = route.params
  const [resident, setResident] = useState(null)
  const [familiar, setFamiliar] = useState(null)
  const [familiarEmail, setFamiliarEmail] = useState(null)
  const [observation, setObservation] = useState(null)
  const [notes, setNotes] = useState([])
  const [weeklyCheckups, setWeeklyCheckups] = useState([])
  const [alerts, setAlerts] = useState([])
  const [selectedCheckupId, setSelectedCheckupId] = useState(null)
  const [checkupDateFilter, setCheckupDateFilter] = useState("all")
  const [alertTimeFilter, setAlertTimeFilter] = useState("7days")
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState("")
  const [newMessage, setNewMessage] = useState("")
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const { showNotification } = useNotification()
  const messageInputRef = useRef(null)

  const calculateAge = (birthDate) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }

    return age
  }

  const getTimeSinceCheckup = (checkupDate) => {
    if (!checkupDate) return null

    const now = new Date()
    const checkup = new Date(checkupDate)
    const diffTime = Math.abs(now - checkup)
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60))

    if (diffDays === 0) {
      if (diffHours === 0) return "Hace menos de 1 hora"
      return `Hace ${diffHours} hora${diffHours > 1 ? "s" : ""}`
    } else if (diffDays === 1) {
      return "Hace 1 día"
    } else {
      return `Hace ${diffDays} días`
    }
  }

  const isCheckupOverdue = (checkupDate) => {
    if (!checkupDate) return true

    const now = new Date()
    const checkup = new Date(checkupDate)
    const diffTime = Math.abs(now - checkup)
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    return diffDays > 7
  }

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

  const filterCheckupsByDate = (checkups, filter) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    switch (filter) {
      case "week":
        const weekAgo = new Date(today)
        weekAgo.setDate(weekAgo.getDate() - 7)
        return checkups.filter((checkup) => new Date(checkup.fechaChequeo) >= weekAgo)
      case "month":
        const monthAgo = new Date(today)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        return checkups.filter((checkup) => new Date(checkup.fechaChequeo) >= monthAgo)
      case "3months":
        const threeMonthsAgo = new Date(today)
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
        return checkups.filter((checkup) => new Date(checkup.fechaChequeo) >= threeMonthsAgo)
      default:
        return checkups
    }
  }

  const fetchResidentDetails = useCallback(async () => {
    setIsLoading(true)
    setFetchError("")
    try {
      const residentResponse = await fetch(`${API_URL}/Residente/${residentId}`)
      if (!residentResponse.ok) {
        throw new Error(`HTTP error! status: ${residentResponse.status}`)
      }
      const apiResidentData = await residentResponse.json()
      const residentData = apiResidentData.residente

      if (!residentData) {
        setFetchError("No se encontró información para este residente.")
        showNotification("No se encontró información para este residente.", "error")
        return
      }

      const baseStaticUrl = API_URL.replace("/api", "")

      setResident({
        ...residentData,
        foto_url:
          residentData.foto && residentData.foto !== "default"
            ? `${baseStaticUrl}/images/residents/${residentData.foto}`
            : null,
      })

      // Fetch familiar data
      try {
        const familiarResponse = await fetch(`${API_URL}/Familiar/${residentData.id_residente}`)
        if (familiarResponse.ok) {
          const apiFamiliarData = await familiarResponse.json()
          const fetchedFamiliarData = apiFamiliarData.familiar

          if (fetchedFamiliarData) {
            setFamiliar(fetchedFamiliarData)

            if (fetchedFamiliarData.firebase_uid) {
              try {
                const emailResponse = await fetch(
                  `${API_URL}/Personal/manage/get-correo/${fetchedFamiliarData.firebase_uid}`,
                )
                if (emailResponse.ok) {
                  const emailData = await emailResponse.json()
                  if (emailData && emailData.email) {
                    setFamiliarEmail(emailData.email)
                  }
                }
              } catch (emailError) {
                console.error(`Error al obtener el correo del familiar:`, emailError)
                setFamiliarEmail(null)
              }
            }

            if (fetchedFamiliarData.id) {
              try {
                const noteResponse = await fetch(`${API_URL}/Nota/${fetchedFamiliarData.id}`)
                if (noteResponse.ok) {
                  const apiNoteData = await noteResponse.json()
                  if (apiNoteData.notas && Array.isArray(apiNoteData.notas) && apiNoteData.notas.length > 0) {
                    const activeNotes = apiNoteData.notas.filter((note) => note.activo)
                    const sortedNotes = activeNotes.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                    setNotes(sortedNotes)
                  } else {
                    setNotes([])
                  }
                }
              } catch (noteError) {
                console.error(`Error al obtener las notas:`, noteError)
                setNotes([])
              }
            }
          }
        }
      } catch (familiarError) {
        console.error(`Error al obtener datos del familiar:`, familiarError)
        setFamiliar(null)
        setFamiliarEmail(null)
        setNotes([])
      }

      // Fetch observations
      try {
        const observationResponse = await fetch(`${API_URL}/Observacion/${residentData.id_residente}`)
        if (observationResponse.ok) {
          const apiObservationData = await observationResponse.json()
          const fetchedObservationData = apiObservationData.observacion
          if (Array.isArray(fetchedObservationData) && fetchedObservationData.length > 0) {
            setObservation(fetchedObservationData[0])
          } else if (fetchedObservationData && !Array.isArray(fetchedObservationData)) {
            setObservation(fetchedObservationData)
          } else {
            setObservation(null)
          }
        }
      } catch (observationError) {
        console.error(`Error al obtener la observación:`, observationError)
        setObservation(null)
      }

      // Fetch weekly checkups
      try {
        const checkupsResponse = await fetch(`${API_URL}/ChequeoSemanal/residente/${residentId}`)
        if (checkupsResponse.ok) {
          const checkupsData = await checkupsResponse.json()
          if (Array.isArray(checkupsData) && checkupsData.length > 0) {
            const sortedCheckups = checkupsData.sort((a, b) => new Date(a.fechaChequeo) - new Date(b.fechaChequeo))
            setWeeklyCheckups(sortedCheckups)
            setSelectedCheckupId(sortedCheckups[sortedCheckups.length - 1]?.id)
          } else {
            setWeeklyCheckups([])
            setSelectedCheckupId(null)
          }
        }
      } catch (checkupError) {
        console.error(`Error al obtener los chequeos semanales:`, checkupError)
        setWeeklyCheckups([])
        setSelectedCheckupId(null)
      }

      // Fetch alerts
      try {
        const alertsResponse = await fetch(`${API_URL}/Alerta/residente/${residentId}`)
        if (alertsResponse.ok) {
          const alertsData = await alertsResponse.json()
          if (alertsData.alertas && Array.isArray(alertsData.alertas)) {
            const sortedAlerts = alertsData.alertas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
            setAlerts(sortedAlerts)
          } else {
            setAlerts([])
          }
        }
      } catch (alertError) {
        console.error(`Error al obtener las alertas:`, alertError)
        setAlerts([])
      }
    } catch (error) {
      console.error("Error general al cargar el perfil:", error)
      setFetchError(`Error general al cargar el perfil: ${error.message}`)
      showNotification(`Error general al cargar el perfil: ${error.message}`, "error")
    } finally {
      setIsLoading(false)
    }
  }, [residentId, showNotification])

  const sendMessage = async () => {
    if (!newMessage.trim()) {
      Alert.alert("Error", "Por favor escribe un mensaje")
      return
    }

    if (!familiar) {
      Alert.alert("Error", "No se encontró información del familiar")
      return
    }

    setIsSendingMessage(true)

    try {
      const formData = new FormData()
      formData.append("id_familiar", familiar.id.toString())

      if (currentUserRole === "employee" && currentUserId) {
        formData.append("id_personal", currentUserId.toString())
      } else {
        formData.append("id_personal", "")
      }

      formData.append("notaTexto", newMessage.trim())

      const response = await fetch(`${API_URL}/Nota`, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "*/*",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.type === "Success") {
        setNewMessage("")
        showNotification("Mensaje enviado exitosamente", "success")

        setTimeout(() => {
          fetchResidentDetails()
        }, 500)
      } else {
        throw new Error(result.message || "Error al enviar el mensaje")
      }
    } catch (error) {
      console.error("Error al enviar mensaje:", error)
      showNotification(`Error al enviar mensaje: ${error.message}`, "error")
    } finally {
      setIsSendingMessage(false)
    }
  }

  const handleMessageChange = (text) => {
    setNewMessage(text)
  }

  useEffect(() => {
    fetchResidentDetails()
  }, [fetchResidentDetails])

  const HealthStatCard = ({ title, value, unit, type, icon }) => {
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

  const ModernChart = ({ data, title, color, unit, height = 140 }) => {
    if (!data || data.length === 0) {
      return (
        <View style={[styles.modernChartContainer, { height }]}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>{title}</Text>
            <View style={[styles.chartIndicator, { backgroundColor: color }]} />
          </View>
          <View style={styles.noDataContainer}>
            <View style={styles.noDataIcon}>
              <Ionicons name="analytics-outline" size={24} color={COLORS.lightText} />
            </View>
            <Text style={styles.noDataText}>Sin datos disponibles</Text>
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
            <Text style={styles.chartTitle}>{title}</Text>
            <View style={[styles.chartIndicator, { backgroundColor: color }]} />
          </View>
          <View style={styles.noDataContainer}>
            <View style={styles.noDataIcon}>
              <Ionicons name="analytics-outline" size={24} color={COLORS.lightText} />
            </View>
            <Text style={styles.noDataText}>Sin datos válidos</Text>
          </View>
        </View>
      )
    }

    const maxValue = Math.max(...values)
    const minValue = Math.min(...values)
    const range = maxValue - minValue || 1
    const chartHeight = height - 80
    const chartWidth = IS_WEB ? 280 : 240
    const pointSpacing = chartWidth / Math.max(values.length - 1, 1)

    const pathPoints = values.map((value, index) => {
      const x = index * pointSpacing + 40
      const y = chartHeight - ((value - minValue) / range) * chartHeight + 20
      return { x, y, value }
    })

    const currentValue = values[values.length - 1]
    const previousValue = values[values.length - 2]
    const trend = previousValue ? ((currentValue - previousValue) / previousValue) * 100 : 0

    return (
      <View style={[styles.modernChartContainer, { height }]}>
        <View style={styles.chartHeader}>
          <View style={styles.chartTitleContainer}>
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
            {[0.25, 0.5, 0.75].map((ratio, index) => (
              <View
                key={`grid-${index}`}
                style={[
                  styles.gridLine,
                  {
                    top: ratio * chartHeight + 20,
                    left: 40,
                    right: 20,
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
              const avgHeight = (point.y + prevPoint.y) / 2

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
                      height: chartHeight - avgHeight + 20,
                      backgroundColor: color,
                      opacity: 0.08,
                    },
                  ]}
                />
              )
            })}
          </View>

          {/* Main line */}
          <View style={styles.modernLineContainer}>
            {pathPoints.map((point, index) => {
              if (index === 0) return null
              const prevPoint = pathPoints[index - 1]
              const distance = Math.sqrt(Math.pow(point.x - prevPoint.x, 2) + Math.pow(point.y - prevPoint.y, 2))
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
                      backgroundColor: color,
                      transform: [{ rotate: `${angle}deg` }],
                      transformOrigin: "0 50%",
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
                      left: point.x - 4,
                      top: point.y - 4,
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
                        position: "absolute",
                        left: point.x - 6,
                        top: point.y - 6,
                        borderColor: color,
                      },
                    ]}
                  />
                )}
              </View>
            ))}
          </View>

          {/* Y-axis labels */}
          <View style={styles.modernYAxisLabels}>
            <Text style={styles.modernAxisLabel}>{maxValue.toFixed(0)}</Text>
            <Text style={styles.modernAxisLabel}>{((maxValue + minValue) / 2).toFixed(0)}</Text>
            <Text style={styles.modernAxisLabel}>{minValue.toFixed(0)}</Text>
          </View>

          {/* X-axis labels */}
          <View style={styles.modernXAxisLabels}>
            <Text style={styles.modernAxisLabel}>{dates[0]}</Text>
            {dates.length > 2 && <Text style={styles.modernAxisLabel}>{dates[Math.floor(dates.length / 2)]}</Text>}
            {dates.length > 1 && <Text style={styles.modernAxisLabel}>{dates[dates.length - 1]}</Text>}
          </View>
        </View>
      </View>
    )
  }

  const AlertsSummaryChart = ({ alerts, timeFilter }) => {
    const alertsSummary = getAlertsSummary(alerts, timeFilter)
    const maxCount = Math.max(...alertsSummary.map((item) => item.count), 1)

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
                            height: `${Math.max((alert.count / maxCount) * 100, 20)}%`,
                            backgroundColor: alert.color,
                          },
                        ]}
                      />
                      <View style={[styles.modernAlertCount, { backgroundColor: alert.color }]}>
                        <Text style={styles.modernAlertCountText}>{alert.count}</Text>
                      </View>
                    </View>
                    <Text style={styles.modernAlertLabel} numberOfLines={2}>
                      {alert.message.length > 15 ? `${alert.message.substring(0, 15)}...` : alert.message}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.noAlertsChart}>
              <View style={styles.noAlertsIcon}>
                <Ionicons name="checkmark-circle" size={32} color={COLORS.successGreen} />
              </View>
              <Text style={styles.noAlertsChartText}>Sin alertas en este período</Text>
              <Text style={styles.noAlertsChartSubtext}>¡Excelente estado de salud!</Text>
            </View>
          )}
        </View>
      </View>
    )
  }

  const CheckupsHistoryContainer = () => (
    <View style={styles.checkupsHistoryCard}>
      <View style={styles.modernCardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={styles.cardIconContainer}>
            <Ionicons name="calendar" size={18} color={COLORS.primaryGreen} />
          </View>
          <Text style={styles.modernCardTitle}>Historial de Consultas</Text>
        </View>
      </View>

      {weeklyCheckups.length > 0 ? (
        <>
          <View style={styles.checkupDropdownContainer}>
            <Text style={styles.dropdownLabel}>Seleccionar consulta:</Text>
            <View style={styles.modernDropdownWrapper}>
              <select
                value={selectedCheckupId || ""}
                onChange={(e) => setSelectedCheckupId(e.target.value)}
                style={styles.modernCheckupDropdown}
              >
                <option value="">Seleccionar fecha de consulta</option>
                {weeklyCheckups.map((checkup) => (
                  <option key={checkup.id} value={checkup.id}>
                    {new Date(checkup.fechaChequeo).toLocaleDateString("es-ES", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </option>
                ))}
              </select>
              <Ionicons name="chevron-down" size={16} color={COLORS.lightText} style={styles.dropdownIcon} />
            </View>
          </View>

          <Pressable
            style={[styles.modernViewButton, { alignSelf: "center", marginTop: 16 }]}
            onPress={() => {
              if (selectedCheckupId) {
                navigation.navigate("WeeklyCheckupDetail", {
                  checkupId: selectedCheckupId,
                  residentName: `${resident.nombre} ${resident.apellido}`,
                })
              }
            }}
            disabled={!selectedCheckupId}
          >
            <Text style={styles.modernViewButtonText}>Ver Consulta</Text>
            <Ionicons name="arrow-forward" size={12} color="#fff" />
          </Pressable>
        </>
      ) : (
        <View style={styles.noCheckupsContainer}>
          <View style={styles.noDataIcon}>
            <Ionicons name="calendar-outline" size={24} color={COLORS.lightText} />
          </View>
          <Text style={styles.noCheckupsText}>No hay chequeos registrados</Text>
        </View>
      )}
    </View>
  )

  const MiniStatCard = ({ title, value, icon, color }) => (
    <View style={styles.modernMiniStatCard}>
      <View style={[styles.miniStatIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={14} color={color} />
      </View>
      <Text style={styles.miniStatValue}>{value}</Text>
      <Text style={styles.miniStatTitle}>{title}</Text>
    </View>
  )

  const ChatContainer = () => (
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
              onChangeText={handleMessageChange}
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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryGreen} />
        <Text style={styles.loadingText}>Cargando perfil del residente...</Text>
      </View>
    )
  }

  if (fetchError) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.errorRed} />
        <Text style={styles.errorText}>{fetchError}</Text>
      </View>
    )
  }

  if (!resident) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="information-circle-outline" size={48} color={COLORS.accentBlue} />
        <Text style={styles.errorText}>No se pudo cargar el perfil del residente.</Text>
      </View>
    )
  }

  // Preparar datos para gráficas
  const spo2TrendData = weeklyCheckups
    .filter((checkup) => checkup.spo2 != null)
    .map((checkup) => ({
      value: checkup.spo2,
      date: new Date(checkup.fechaChequeo).toLocaleDateString("es-ES", { month: "short", day: "numeric" }),
    }))

  const pulseTrendData = weeklyCheckups
    .filter((checkup) => checkup.pulso != null)
    .map((checkup) => ({
      value: checkup.pulso,
      date: new Date(checkup.fechaChequeo).toLocaleDateString("es-ES", { month: "short", day: "numeric" }),
    }))

  const temperatureTrendData = weeklyCheckups
    .filter((checkup) => checkup.temperaturaCorporal != null)
    .map((checkup) => ({
      value: checkup.temperaturaCorporal,
      date: new Date(checkup.fechaChequeo).toLocaleDateString("es-ES", { month: "short", day: "numeric" }),
    }))

  const weightTrendData = weeklyCheckups
    .filter((checkup) => checkup.peso != null)
    .map((checkup) => ({
      value: checkup.peso,
      date: new Date(checkup.fechaChequeo).toLocaleDateString("es-ES", { month: "short", day: "numeric" }),
    }))

  const latestCheckup = weeklyCheckups[weeklyCheckups.length - 1]

  return (
    <View style={styles.modernContainer}>
      <View style={styles.modernBackButton}>
        <BackButton onPress={() => navigation.goBack()} title="Volver" />
      </View>

      <ScrollView style={styles.modernScrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.modernMainContainer}>
          <View style={styles.modernMainGrid}>
            {/* Sidebar */}
            <View style={styles.modernSidebar}>
              {/* Resident Profile */}
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

                {/* Heart Rate Averages */}
                <View style={styles.modernHeartRateSection}>
                  <Text style={styles.modernSectionTitle}>Promedios de Ritmo Cardíaco</Text>
                  <View style={styles.modernMiniStatsRow}>
                    <MiniStatCard
                      title="Reposo"
                      value={resident.promedioReposo || "N/A"}
                      icon="moon-outline"
                      color={COLORS.accentBlue}
                    />
                    <MiniStatCard
                      title="Activo"
                      value={resident.promedioActivo || "N/A"}
                      icon="walk-outline"
                      color={COLORS.successGreen}
                    />
                    <MiniStatCard
                      title="Agitado"
                      value={resident.promedioAgitado || "N/A"}
                      icon="flash-outline"
                      color={COLORS.warningOrange}
                    />
                  </View>
                </View>

                {/* Observations */}
                {observation && (
                  <View style={styles.modernObservationContainer}>
                    <View style={styles.observationHeader}>
                      <Ionicons name="document-text-outline" size={16} color={COLORS.warningOrange} />
                      <Text style={styles.modernObservationTitle}>Observaciones</Text>
                    </View>
                    <Text style={styles.modernObservationText}>{observation.observacion}</Text>
                  </View>
                )}
              </View>

              {/* Family Contact */}
              {familiar && (
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
              )}

              {/* Chat */}
              <ChatContainer />

              {/* Checkups History */}
              <CheckupsHistoryContainer />
            </View>

            {/* Main Content */}
            <View style={styles.modernMainContent}>
              {/* Health Stats Row */}
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
                    <HealthStatCard
                      title="Pulso"
                      value={latestCheckup?.pulso}
                      unit=" bpm"
                      type="heartRate"
                      icon="heart"
                    />
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

              {/* Charts Section */}
              <View style={styles.modernChartsSection}>
                <View style={styles.modernSectionHeader}>
                  <Text style={styles.modernSectionTitle}>Tendencias de Salud</Text>
                  <Text style={styles.modernSectionSubtitle}>Evolución de los indicadores vitales</Text>
                </View>
                <View style={styles.modernChartsGrid}>
                  <ModernChart
                    data={spo2TrendData}
                    title="Oxigenación (SpO2)"
                    color={COLORS.accentBlue}
                    unit="%"
                    height={140}
                  />
                  <ModernChart
                    data={pulseTrendData}
                    title="Pulso (Ritmo Cardíaco)"
                    color={COLORS.criticalRed}
                    unit=" bpm"
                    height={140}
                  />
                  <ModernChart
                    data={temperatureTrendData}
                    title="Temperatura Corporal"
                    color={COLORS.warningOrange}
                    unit="°C"
                    height={140}
                  />
                  <ModernChart
                    data={weightTrendData}
                    title="Peso"
                    color={COLORS.successGreen}
                    unit=" kg"
                    height={140}
                  />
                </View>
              </View>

              {/* Alerts Summary */}
              <AlertsSummaryChart alerts={alerts} timeFilter={alertTimeFilter} />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  modernContainer: {
    flex: 1,
    backgroundColor: COLORS.pageBackground,
  },
  modernBackButton: {
    position: "absolute",
    top: IS_WEB ? 20 : Platform.OS === "ios" ? 50 : 30,
    left: 20,
    zIndex: 10,
  },
  modernScrollView: {
    flex: 1,
    paddingTop: IS_WEB ? 60 : 80,
  },
  modernMainContainer: {
    maxWidth: IS_WEB ? 1600 : "100%",
    alignSelf: "center",
    width: "100%",
    paddingHorizontal: IS_WEB ? 24 : 16,
    paddingBottom: 40, // Aumentar padding bottom
    minHeight: IS_WEB ? "calc(100vh - 60px)" : "auto", // Ajustar altura mínima
  },
  modernMainGrid: {
    flexDirection: IS_WEB ? "row" : "column",
    gap: 24,
    height: IS_WEB ? "100%" : "auto",
  },
  modernSidebar: {
    flex: IS_WEB ? 0.35 : 1,
    gap: 16,
    maxWidth: IS_WEB ? 400 : "100%",
  },
  modernMainContent: {
    flex: IS_WEB ? 0.65 : 1,
    gap: 20,
  },
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
  modernHeartRateSection: {
    marginBottom: 20,
  },
  modernSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.darkText,
    marginBottom: 12,
  },
  modernMiniStatsRow: {
    flexDirection: "row",
    gap: 8,
  },
  modernMiniStatCard: {
    flex: 1,
    backgroundColor: COLORS.pageBackground,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  miniStatIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  miniStatValue: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.darkText,
    marginBottom: 4,
  },
  miniStatTitle: {
    fontSize: 11,
    color: COLORS.lightText,
    textAlign: "center",
    fontWeight: "500",
  },
  modernObservationContainer: {
    backgroundColor: COLORS.lightGreenAccent,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.primaryGreen,
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
    width: "100%", // Ocupar todo el ancho
  },
  healthStatsSectionOverdue: {
    borderWidth: 2,
    borderColor: COLORS.criticalRed,
    backgroundColor: "#FEF2F2",
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
    justifyContent: "space-between", // Distribuir uniformemente
  },
  healthStatCard: {
    backgroundColor: COLORS.pageBackground,
    borderRadius: 12,
    padding: 16,
    flex: 1, // Cada card ocupa el mismo espacio
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  checkupsHistoryCard: {
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
    height: IS_WEB ? 280 : 300, // Altura similar al chat
  },
  checkupDropdownContainer: {
    marginBottom: 16,
  },
  modernDropdownWrapper: {
    position: "relative",
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 12,
    backgroundColor: COLORS.pageBackground,
  },
  modernCheckupDropdown: {
    fontSize: 13,
    color: COLORS.darkText,
    backgroundColor: COLORS.pageBackground,
    paddingHorizontal: 12,
    paddingVertical: 10,
    appearance: "none",
    border: "none",
    outline: "none",
    width: "100%",
  },
  dropdownIcon: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: [{ translateY: -8 }],
    pointerEvents: "none",
  },
  recentCheckupsList: {
    gap: 8,
  },
  modernCheckupItem: {
    backgroundColor: COLORS.pageBackground,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  checkupItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkupDateIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${COLORS.accentBlue}15`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  modernCheckupDateText: {
    fontSize: 13,
    color: COLORS.darkText,
    fontWeight: "500",
  },
  modernViewButton: {
    backgroundColor: COLORS.accentBlue,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  modernViewButtonText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },
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
    minHeight: 320, // Aumentar altura mínima
  },
  modernSectionHeader: {
    marginBottom: 20,
  },
  modernSectionSubtitle: {
    fontSize: 14,
    color: COLORS.lightText,
    marginTop: 4,
  },
  modernChartsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  modernChartContainer: {
    backgroundColor: COLORS.cardBackground,
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
    minHeight: 180, // Altura mínima para mejor visualización
  },
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
    minHeight: 300, // Aumentar altura mínima del contenedor
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
    height: 180,
    alignItems: "flex-end",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: COLORS.chartGrid,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  modernAlertItem: {
    alignItems: "center",
    flex: 1,
    marginHorizontal: 4,
    maxWidth: 60,
  },
  modernAlertBar: {
    height: 120,
    width: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
    position: "relative",
  },
  modernAlertBarFill: {
    width: "80%",
    borderRadius: 4,
    minHeight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  modernAlertLabel: {
    fontSize: 11, // Aumentar tamaño de fuente
    color: COLORS.lightText,
    textAlign: "center",
    marginTop: 8,
    height: 32, // Aumentar altura para mejor legibilidad
    lineHeight: 14,
    fontWeight: "500",
  },
  noAlertsChart: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  noAlertsIcon: {
    marginBottom: 12,
  },
  noAlertsChartText: {
    fontSize: 14,
    color: COLORS.lightText,
    marginBottom: 4,
    textAlign: "center",
  },
  noAlertsChartSubtext: {
    fontSize: 12,
    color: COLORS.successGreen,
    textAlign: "center",
    fontWeight: "500",
  },
  noDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  noDataIcon: {
    marginBottom: 8,
  },
  noDataText: {
    fontSize: 12,
    color: COLORS.lightText,
    textAlign: "center",
  },
  noMessagesContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  noMessagesText: {
    fontSize: 12,
    color: COLORS.lightText,
    marginTop: 8,
    textAlign: "center",
  },
  noCheckupsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  noCheckupsText: {
    fontSize: 12,
    color: COLORS.lightText,
    marginTop: 8,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.pageBackground,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.lightText,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: COLORS.pageBackground,
  },
  errorText: {
    color: COLORS.errorRed,
    textAlign: "center",
    marginTop: 16,
    fontSize: 16,
  },
  dropdownLabel: {
    fontSize: 13,
    color: COLORS.darkText,
    marginBottom: 8,
    fontWeight: "600",
  },
})
