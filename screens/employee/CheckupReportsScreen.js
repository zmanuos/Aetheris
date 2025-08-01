"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  Dimensions,
  Alert, // Import Alert for showing messages
} from "react-native"
import { Picker } from "@react-native-picker/picker"
import DateTimePicker from "@react-native-community/datetimepicker"
import { LineChart } from "react-native-chart-kit" // Simplified imports for requested charts
import RNHTMLtoPDF from "react-native-html-to-pdf" // For React Native PDF generation

// Using the same color scheme as HomeScreen
const PRIMARY_ACCENT = "#4A90E2"
const SECONDARY_ACCENT = "#7ED321"
const WARNING_COLOR = "#F5A623"
const DANGER_COLOR = "#D0021B"
const NEUTRAL_DARK = "#3A4750"
const NEUTRAL_MEDIUM = "#606C76"
const NEUTRAL_LIGHT = "#B0BEC5"
const BACKGROUND_LIGHT = "#F8F9FA"
const CARD_BACKGROUND = "#FFFFFF"
const PURPLE = "#8B5CF6"

const COLORS = {
  primary: PRIMARY_ACCENT,
  secondary: NEUTRAL_MEDIUM,
  success: SECONDARY_ACCENT,
  warning: WARNING_COLOR,
  danger: DANGER_COLOR,
  info: PRIMARY_ACCENT,
  purple: PURPLE,
  pink: "#EC4899",
  background: BACKGROUND_LIGHT,
  card: CARD_BACKGROUND,
  text: NEUTRAL_DARK,
  textLight: NEUTRAL_MEDIUM,
  border: NEUTRAL_LIGHT,
  lightBlue: "#DBEAFE",
  darkText: NEUTRAL_DARK,
}

const API_BASE_URL = "http://localhost:5214/api"

const screenWidth = Dimensions.get("window").width

const Card = ({ children, style = {} }) => <View style={[styles.card, style]}>{children}</View>

const CardHeader = ({ children, style = {} }) => <View style={[styles.cardHeader, style]}>{children}</View>

const CardTitle = ({ children, style = {} }) => <Text style={[styles.cardTitle, style]}>{children}</Text>

const CardDescription = ({ children, style = {} }) => <Text style={[styles.cardDescription, style]}>{children}</Text>

const CardContent = ({ children, style = {} }) => <View style={[styles.cardContent, style]}>{children}</View>

const Button = ({ children, onPress, variant = "default", style = {}, disabled = false }) => {
  const baseClasses = {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  }
  const variants = {
    default: { backgroundColor: COLORS.primary },
    outline: { borderWidth: 1, borderColor: COLORS.border, backgroundColor: "transparent" },
    destructive: { backgroundColor: COLORS.danger },
  }

  const textVariants = {
    default: { color: "#FFFFFF" },
    outline: { color: COLORS.text },
    destructive: { color: "#FFFFFF" },
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[baseClasses, variants[variant], style, disabled && { opacity: 0.5 }]}
    >
      {typeof children === "string" ? (
        <Text style={[styles.buttonText, textVariants[variant]]}>{children}</Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  )
}

const Badge = ({ children, variant = "default", style = {} }) => {
  const variants = {
    default: { backgroundColor: COLORS.primary + "1A", color: COLORS.primary },
    destructive: { backgroundColor: COLORS.danger + "1A", color: COLORS.danger },
    secondary: { backgroundColor: COLORS.secondary + "1A", color: COLORS.secondary },
    success: { backgroundColor: COLORS.success + "1A", color: COLORS.success },
  }

  return (
    <Text
      style={[
        styles.badge,
        { backgroundColor: variants[variant].backgroundColor, color: variants[variant].color },
        style,
      ]}
    >
      {children}
    </Text>
  )
}

const Select = ({ selectedValue, onValueChange, children, style = {} }) => {
  return (
    <Picker
      selectedValue={selectedValue}
      onValueChange={(itemValue) => onValueChange(itemValue)}
      style={[styles.select, style]}
    >
      {children}
    </Picker>
  )
}

const SelectItem = ({ label, value }) => <Picker.Item label={label} value={value} />

import { TextInput } from "react-native"

const Input = ({ type = "text", value, onChangeText, style = {}, ...props }) => {
  const [showDatePicker, setShowDatePicker] = useState(false)

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === "ios") // For iOS, keep it open if not confirmed
    if (event.type === "set" && selectedDate) {
      onChangeText(selectedDate.toISOString().split("T")[0]) // Format YYYY-MM-DD
    }
  }

  if (type === "date") {
    return (
      <View>
        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={[styles.input, style]}>
          <Text style={value ? styles.inputText : styles.inputPlaceholder}>{value ? value : "Seleccionar Fecha"}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            testID="dateTimePicker"
            value={value ? new Date(value) : new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}
      </View>
    )
  }

  return (
    <TextInput
      style={[styles.input, style]}
      value={value}
      onChangeText={onChangeText}
      keyboardType={type === "number" ? "numeric" : "default"}
      {...props}
    />
  )
}

const CheckupReportsScreen = () => {
  const [residentes, setResidentes] = useState([])
  const [chequeos, setChequeos] = useState([])
  const [selectedResidente, setSelectedResidente] = useState(null)
  const [selectedResidenteId, setSelectedResidenteId] = useState("all")
  const [dateRange, setDateRange] = useState("semanal")
  const [customStartDate, setCustomStartDate] = useState("")
  const [customEndDate, setCustomEndDate] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [residentesResponse, chequeosResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/Residente`, {
          method: "GET",
          headers: {
            accept: "*/*",
          },
        }),
        fetch(`${API_BASE_URL}/ChequeoSemanal`, {
          method: "GET",
          headers: {
            accept: "text/plain",
          },
        }),
      ])

      if (!residentesResponse.ok || !chequeosResponse.ok) {
        throw new Error("Error al obtener los datos del servidor")
      }

      const residentesData = await residentesResponse.json()
      const chequeosData = await chequeosResponse.json()

      setResidentes(residentesData.data || residentesData)
      setChequeos(chequeosData)
    } catch (error) {
      console.error("Error fetching data:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredChequeos = useMemo(() => {
    let filtered = chequeos

    if (selectedResidenteId !== "all") {
      filtered = filtered.filter((c) => c.residenteId === selectedResidenteId)
    }

    const now = new Date()
    let startDate
    let endDate = now

    switch (dateRange) {
      case "semanal":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case "mensual":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case "trimestral":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case "personalizado":
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate)
          endDate = new Date(customEndDate)
          // Adjust end date to include the whole day
          endDate.setHours(23, 59, 59, 999)
        } else {
          // If custom dates are not set, return all if personalizado is selected but dates aren't
          return filtered
        }
        break
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
    }

    return filtered.filter((c) => {
      const checkDate = new Date(c.fechaChequeo)
      return checkDate >= startDate && checkDate <= endDate
    })
  }, [chequeos, selectedResidenteId, dateRange, customStartDate, customEndDate])

  const timeSeriesData = useMemo(() => {
    return filteredChequeos
      .sort((a, b) => new Date(a.fechaChequeo).getTime() - new Date(b.fechaChequeo).getTime())
      .map((c) => {
        const residente = residentes.find((r) => r.id_residente.toString() === c.residenteId)
        return {
          fecha: new Date(c.fechaChequeo).toLocaleDateString("es-ES", { month: "short", day: "numeric" }),
          fechaCompleta: new Date(c.fechaChequeo).toLocaleDateString("es-ES"),
          spo2: c.spo2,
          pulso: c.pulso,
          temperatura: c.temperaturaCorporal,
          peso: c.peso,
          imc: c.imc,
          residente: residente ? `${residente.nombre} ${residente.apellido}` : `Residente ${c.residenteId}`,
          residenteId: c.residenteId,
          isNormal:
            c.spo2 >= 95 &&
            c.pulso >= 60 &&
            c.pulso <= 100 &&
            c.temperaturaCorporal >= 36.1 &&
            c.temperaturaCorporal <= 37.2,
          observaciones: c.observaciones,
        }
      })
  }, [filteredChequeos, residentes])

  const stats = useMemo(() => {
    if (filteredChequeos.length === 0) return null

    const latest = filteredChequeos[filteredChequeos.length - 1]
    const avg = {
      spo2: (filteredChequeos.reduce((sum, c) => sum + c.spo2, 0) / filteredChequeos.length).toFixed(1),
      pulso: Math.round(filteredChequeos.reduce((sum, c) => sum + c.pulso, 0) / filteredChequeos.length),
      temperatura: (
        filteredChequeos.reduce((sum, c) => sum + c.temperaturaCorporal, 0) / filteredChequeos.length
      ).toFixed(1),
      imc: (filteredChequeos.reduce((sum, c) => sum + c.imc, 0) / filteredChequeos.length).toFixed(1),
    }

    const alertas = filteredChequeos.filter(
      (c) =>
        c.spo2 < 95 || c.pulso < 60 || c.pulso > 100 || c.temperaturaCorporal < 36.1 || c.temperaturaCorporal > 37.2,
    ).length

    return { latest, avg, alertas, total: filteredChequeos.length }
  }, [filteredChequeos])

  const handleResidenteChange = (residenteId) => {
    setSelectedResidenteId(residenteId)
    const residente = residentes.find((r) => r.id_residente.toString() === residenteId)
    setSelectedResidente(residente || null)
  }

  // Helper function to create individual SVG line charts with shading
  const createIndividualLineChart = (data, labels, title, color, unit, minValue = null, maxValue = null) => {
    if (!data || data.length === 0) return ""

    const width = 220
    const height = 120
    const padding = 30
    const chartWidth = width - padding * 2
    const chartHeight = height - padding * 2

    const max = maxValue !== null ? maxValue : Math.max(...data)
    const min = minValue !== null ? minValue : Math.min(...data)
    const range = max - min || 1

    // Create points for the line
    const points = data
      .map((value, index) => {
        const x = padding + (index * chartWidth) / (data.length - 1)
        const y = padding + chartHeight - ((value - min) / range) * chartHeight
        return `${x},${y}`
      })
      .join(" ")

    // Create points for the filled area (including bottom line)
    const areaPoints =
      `${padding},${padding + chartHeight} ` + points + ` ${padding + chartWidth},${padding + chartHeight}`

    return `
      <div class="individual-chart">
        <h4>${title}</h4>
        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
          <defs>
            <linearGradient id="gradient-${title.replace(/\s+/g, "").replace(/[()]/g, "")}" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:${color};stop-opacity:0.4" />
              <stop offset="100%" style="stop-color:${color};stop-opacity:0.05" />
            </linearGradient>
          </defs>
          
          <!-- Grid lines -->
          <defs>
            <pattern id="grid-${title.replace(/\s+/g, "")}" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="${NEUTRAL_LIGHT}" stroke-width="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-${title.replace(/\s+/g, "")})" opacity="0.3"/>
          
          <!-- Filled area under the line -->
          <polygon points="${areaPoints}" fill="url(#gradient-${title.replace(/\s+/g, "").replace(/[()]/g, "")})" />
          
          <!-- Main line -->
          <polyline points="${points}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          
          <!-- Data points -->
          ${data
            .map((value, index) => {
              const x = padding + (index * chartWidth) / (data.length - 1)
              const y = padding + chartHeight - ((value - min) / range) * chartHeight
              return `<circle cx="${x}" cy="${y}" r="3" fill="${color}" stroke="white" stroke-width="1.5"/>`
            })
            .join("")}
          
          <!-- Y-axis labels -->
          <text x="5" y="${padding + 5}" text-anchor="start" font-size="9" fill="${NEUTRAL_MEDIUM}">${max.toFixed(1)}${unit}</text>
          <text x="5" y="${padding + chartHeight}" text-anchor="start" font-size="9" fill="${NEUTRAL_MEDIUM}">${min.toFixed(1)}${unit}</text>
          
          <!-- X-axis labels -->
          ${labels
            .map((label, index) => {
              if (index === 0 || index === labels.length - 1) {
                const x = padding + (index * chartWidth) / (data.length - 1)
                return `<text x="${x}" y="${height - 5}" text-anchor="middle" font-size="8" fill="${NEUTRAL_MEDIUM}">${label}</text>`
              }
              return ""
            })
            .join("")}
        </svg>
        <div class="chart-stats">
          <span class="current-value">Actual: <strong>${data[data.length - 1]}${unit}</strong></span>
          <span class="avg-value">Promedio: <strong>${(data.reduce((a, b) => a + b, 0) / data.length).toFixed(1)}${unit}</strong></span>
        </div>
      </div>
    `
  }

  // Helper function to create simple bar charts for stat cards
  const createSimpleChart = (data, label, color = PRIMARY_ACCENT) => {
    if (!data || data.length === 0) return ""

    const max = Math.max(...data)
    const min = Math.min(...data)
    const range = max - min || 1

    return data
      .map((value, index) => {
        const height = Math.round(((value - min) / range) * 20) + 5 // Scale to 5-25px height
        return `<div class="chart-bar" style="height: ${height}px; background-color: ${color}; width: 20px; display: inline-block; margin: 0 2px; vertical-align: bottom;"></div>`
      })
      .join("")
  }

  const generatePdfContent = useCallback(() => {
    const rangeText =
      dateRange === "personalizado" && customStartDate && customEndDate
        ? `del ${customStartDate} al ${customEndDate}`
        : ` (${dateRange === "semanal" ? "Última semana" : dateRange === "mensual" ? "Último mes" : "Último trimestre"})`

    const residentHeaderText = selectedResidente
      ? `${selectedResidente.nombre} ${selectedResidente.apellido}`
      : `Todos los Residentes`

    const statsHtml = stats
      ? `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-icon">O₂</span>
                    <div class="stat-info">
                        <p class="stat-label">SpO2 Promedio</p>
                        <p class="stat-value">${stats.avg.spo2}%</p>
                        <p class="stat-trend">Último: ${stats.latest.spo2}%</p>
                    </div>
                </div>
                <div class="mini-chart">
                    ${createSimpleChart(
                      timeSeriesData.map((d) => d.spo2),
                      "SpO2",
                      PRIMARY_ACCENT,
                    )}
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-icon">♥</span>
                    <div class="stat-info">
                        <p class="stat-label">Pulso Promedio</p>
                        <p class="stat-value">${stats.avg.pulso} lpm</p>
                        <p class="stat-trend">Último: ${stats.latest.pulso} lpm</p>
                    </div>
                </div>
                <div class="mini-chart">
                    ${createSimpleChart(
                      timeSeriesData.map((d) => d.pulso),
                      "Pulso",
                      DANGER_COLOR,
                    )}
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-icon">°C</span>
                    <div class="stat-info">
                        <p class="stat-label">Temperatura Promedio</p>
                        <p class="stat-value">${stats.avg.temperatura}°C</p>
                        <p class="stat-trend">Última: ${stats.latest.temperaturaCorporal}°C</p>
                    </div>
                </div>
                <div class="mini-chart">
                    ${createSimpleChart(
                      timeSeriesData.map((d) => d.temperatura),
                      "Temperatura",
                      WARNING_COLOR,
                    )}
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-header">
                    <span class="stat-icon">IMC</span>
                    <div class="stat-info">
                        <p class="stat-label">IMC Promedio</p>
                        <p class="stat-value">${stats.avg.imc}</p>
                        <p class="stat-trend">Último: ${stats.latest.imc.toFixed(1)}</p>
                    </div>
                </div>
                <div class="mini-chart">
                    ${createSimpleChart(
                      timeSeriesData.map((d) => d.imc),
                      "IMC",
                      PURPLE,
                    )}
                </div>
            </div>
        </div>
    `
      : '<div class="no-data"><p>No hay promedios disponibles para el período seleccionado.</p></div>'

    // Create individual trend visualizations for each indicator
    const trendVisualization =
      timeSeriesData.length > 0
        ? `
        <div class="trend-section">
            <h2>Análisis Individual de Signos Vitales</h2>
            <div class="individual-charts-grid">
                ${createIndividualLineChart(
                  timeSeriesData.map((d) => d.spo2),
                  timeSeriesData.map((d) => d.fecha),
                  "Saturación de Oxígeno (SpO2)",
                  PRIMARY_ACCENT,
                  "%",
                  90,
                  100,
                )}
                ${createIndividualLineChart(
                  timeSeriesData.map((d) => d.pulso),
                  timeSeriesData.map((d) => d.fecha),
                  "Frecuencia Cardíaca",
                  DANGER_COLOR,
                  " lpm",
                  50,
                  120,
                )}
                ${createIndividualLineChart(
                  timeSeriesData.map((d) => d.temperatura),
                  timeSeriesData.map((d) => d.fecha),
                  "Temperatura Corporal",
                  WARNING_COLOR,
                  "°C",
                  35,
                  39,
                )}
                ${createIndividualLineChart(
                  timeSeriesData.map((d) => d.peso),
                  timeSeriesData.map((d) => d.fecha),
                  "Peso Corporal",
                  SECONDARY_ACCENT,
                  " kg",
                )}
                ${createIndividualLineChart(
                  timeSeriesData.map((d) => d.imc),
                  timeSeriesData.map((d) => d.fecha),
                  "Índice de Masa Corporal",
                  PURPLE,
                  "",
                  15,
                  35,
                )}
            </div>
        </div>
    `
        : ""

    const tableRows =
      timeSeriesData.length > 0
        ? timeSeriesData
            .slice() // Create a shallow copy
            .reverse() // Display most recent first
            .map(
              (item) => `
      <tr>
        <td>${item.fechaCompleta}</td>
        <td class="resident-name">${item.residente}</td>
        <td class="${item.spo2 >= 95 ? "normal" : "alert"}">${item.spo2}%</td>
        <td class="${item.pulso >= 60 && item.pulso <= 100 ? "normal" : "alert"}">${item.pulso} lpm</td>
        <td class="${item.temperatura >= 36.1 && item.temperatura <= 37.2 ? "normal" : "alert"}">${item.temperatura}°C</td>
        <td>${item.peso} kg</td>
        <td>${item.imc}</td>
        <td class="${item.isNormal ? "normal" : "alert"}">${item.isNormal ? "Normal" : "Atención"}</td>
        <td class="observations">${item.observaciones || "Sin observaciones"}</td>
      </tr>
    `,
            )
            .join("")
        : `<tr><td colspan="9" class="no-data-cell">No hay datos en el historial para el rango de fechas seleccionado.</td></tr>`

    return `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <title>Reporte de Chequeos de Salud</title>
          <style>
              @page {
                  margin: 40px;
                  size: A4;
              }
              
              body {
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  margin: 0;
                  padding: 0;
                  color: ${NEUTRAL_DARK};
                  background-color: #ffffff;
                  line-height: 1.6;
                  font-size: 14px;
              }
              
              .container {
                  max-width: 100%;
                  margin: 0 auto;
                  padding: 20px;
              }
              
              .header {
                  text-align: center;
                  margin-bottom: 40px;
                  padding: 40px 0;
                  background: linear-gradient(135deg, ${PRIMARY_ACCENT}15, ${BACKGROUND_LIGHT});
                  border-radius: 15px;
                  border: 2px solid ${PRIMARY_ACCENT}30;
                  position: relative;
              }
              
              .logo {
                  max-width: 350px;
                  max-height: 150px;
                  margin-bottom: 20px;
                  display: block;
                  margin-left: auto;
                  margin-right: auto;
              }
              
              h1 {
                  font-size: 32px;
                  color: ${PRIMARY_ACCENT};
                  margin: 0 0 15px 0;
                  font-weight: 700;
                  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              
              .subtitle {
                  font-size: 18px;
                  color: ${NEUTRAL_MEDIUM};
                  margin: 0;
                  font-weight: 500;
              }
              
              h2 {
                  font-size: 24px;
                  color: ${PRIMARY_ACCENT};
                  margin: 35px 0 20px 0;
                  padding-bottom: 10px;
                  border-bottom: 3px solid ${PRIMARY_ACCENT}50;
                  font-weight: 600;
              }
              
              h3 {
                  font-size: 20px;
                  color: ${NEUTRAL_DARK};
                  margin: 25px 0 15px 0;
                  font-weight: 600;
              }
              
              h4 {
                  font-size: 14px;
                  color: ${NEUTRAL_DARK};
                  margin: 10px 0 8px 0;
                  font-weight: 600;
                  text-align: center;
              }
              
              .section {
                  background-color: ${CARD_BACKGROUND};
                  border-radius: 12px;
                  padding: 30px;
                  margin-bottom: 25px;
                  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
                  border: 1px solid ${NEUTRAL_LIGHT};
              }
              
              .header-info {
                  background: linear-gradient(135deg, ${BACKGROUND_LIGHT}, ${CARD_BACKGROUND});
                  border-radius: 12px;
                  padding: 25px;
                  margin-bottom: 30px;
                  border-left: 5px solid ${PRIMARY_ACCENT};
              }
              
              .header-info p {
                  margin: 8px 0;
                  font-size: 16px;
                  color: ${NEUTRAL_DARK};
                  font-weight: 500;
              }
              
              .header-info strong {
                  color: ${PRIMARY_ACCENT};
                  font-weight: 600;
              }
              
              .alert-notice {
                  background-color: ${DANGER_COLOR}10;
                  color: ${DANGER_COLOR};
                  padding: 15px;
                  border-radius: 8px;
                  border-left: 4px solid ${DANGER_COLOR};
                  font-weight: 600;
                  margin-top: 15px;
              }
              
              .stats-grid {
                  display: grid;
                  grid-template-columns: repeat(2, 1fr);
                  gap: 20px;
                  margin: 25px 0;
              }
              
              .stat-card {
                  background: linear-gradient(135deg, ${CARD_BACKGROUND}, ${BACKGROUND_LIGHT});
                  border-radius: 12px;
                  padding: 20px;
                  border: 1px solid ${NEUTRAL_LIGHT};
                  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
              }
              
              .stat-header {
                  display: flex;
                  align-items: flex-start;
                  gap: 15px;
                  margin-bottom: 15px;
              }
              
              .stat-icon {
                  font-size: 28px;
                  font-weight: bold;
                  line-height: 1;
                  color: ${PRIMARY_ACCENT};
                  min-width: 40px;
                  text-align: center;
              }
              
              .stat-info {
                  flex: 1;
              }
              
              .stat-label {
                  font-size: 14px;
                  color: ${NEUTRAL_MEDIUM};
                  font-weight: 600;
                  margin: 0 0 5px 0;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
              }
              
              .stat-value {
                  font-size: 28px;
                  font-weight: 700;
                  color: ${PRIMARY_ACCENT};
                  margin: 0 0 5px 0;
                  line-height: 1;
              }
              
              .stat-trend {
                  font-size: 12px;
                  color: ${NEUTRAL_MEDIUM};
                  margin: 0;
                  font-style: italic;
              }
              
              .mini-chart {
                  margin-top: 15px;
                  padding: 10px;
                  background-color: ${BACKGROUND_LIGHT};
                  border-radius: 6px;
                  text-align: center;
                  min-height: 35px;
                  display: flex;
                  align-items: end;
                  justify-content: center;
              }
              
              .chart-bar {
                  border-radius: 2px 2px 0 0;
                  transition: all 0.3s ease;
              }
              
              .trend-section {
                  margin: 30px 0;
                  page-break-inside: avoid;
              }
              
              .individual-charts-grid {
                  display: grid;
                  grid-template-columns: repeat(3, 1fr);
                  gap: 20px;
                  margin-top: 25px;
              }
              
              .individual-chart {
                  background-color: ${CARD_BACKGROUND};
                  border: 1px solid ${NEUTRAL_LIGHT};
                  border-radius: 12px;
                  padding: 15px;
                  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
                  page-break-inside: avoid;
              }
              
              .individual-chart h4 {
                  margin: 0 0 12px 0;
                  color: ${PRIMARY_ACCENT};
                  font-size: 13px;
                  font-weight: 600;
              }
              
              .chart-stats {
                  display: flex;
                  justify-content: space-between;
                  margin-top: 8px;
                  font-size: 10px;
                  color: ${NEUTRAL_MEDIUM};
              }
              
              .chart-stats strong {
                  color: ${PRIMARY_ACCENT};
              }
              
              table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-top: 20px;
                  font-size: 13px;
                  background-color: ${CARD_BACKGROUND};
                  border-radius: 8px;
                  overflow: hidden;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
              }
              
              th, td {
                  border: 1px solid ${NEUTRAL_LIGHT};
                  padding: 12px 10px;
                  text-align: left;
              }
              
              th {
                  background: linear-gradient(135deg, ${PRIMARY_ACCENT}, ${PRIMARY_ACCENT}dd);
                  color: #ffffff;
                  font-weight: 600;
                  text-transform: uppercase;
                  font-size: 12px;
                  letter-spacing: 0.5px;
              }
              
              tr:nth-child(even) {
                  background-color: ${BACKGROUND_LIGHT};
              }
              
              tr:hover {
                  background-color: ${PRIMARY_ACCENT}08;
              }
              
              .resident-name {
                  font-weight: 600;
                  color: ${PRIMARY_ACCENT};
              }
              
              td.normal {
                  background-color: ${SECONDARY_ACCENT}20;
                  color: ${SECONDARY_ACCENT};
                  font-weight: 600;
                  border-radius: 4px;
                  text-align: center;
              }
              
              td.alert {
                  background-color: ${DANGER_COLOR}20;
                  color: ${DANGER_COLOR};
                  font-weight: 600;
                  border-radius: 4px;
                  text-align: center;
              }
              
              td.observations {
                  font-size: 11px;
                  color: ${NEUTRAL_MEDIUM};
                  font-style: italic;
                  max-width: 150px;
                  word-wrap: break-word;
              }
              
              .no-data {
                  text-align: center;
                  padding: 40px;
                  color: ${NEUTRAL_MEDIUM};
                  font-size: 16px;
                  background-color: ${BACKGROUND_LIGHT};
                  border-radius: 8px;
                  border: 2px dashed ${NEUTRAL_LIGHT};
              }
              
              .no-data-cell {
                  text-align: center;
                  padding: 30px;
                  color: ${NEUTRAL_MEDIUM};
                  font-size: 14px;
                  font-style: italic;
              }
              
              .footer {
                  text-align: center;
                  margin-top: 50px;
                  padding-top: 20px;
                  border-top: 2px solid ${NEUTRAL_LIGHT};
                  font-size: 12px;
                  color: ${NEUTRAL_MEDIUM};
              }
              
              .footer strong {
                  color: ${PRIMARY_ACCENT};
              }
              
              /* Print optimizations */
              @media print {
                  .section {
                      break-inside: avoid;
                      page-break-inside: avoid;
                  }
                  
                  .stats-grid {
                      break-inside: avoid;
                  }
                  
                  .trend-section {
                      break-inside: avoid;
                  }
                  
                  .individual-chart {
                      break-inside: avoid;
                  }
                  
                  table {
                      break-inside: auto;
                  }
                  
                  tr {
                      break-inside: avoid;
                      break-after: auto;
                  }
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" alt="Logo de la Empresa" class="logo" onerror="this.style.display='none'" />
                  <h1>Reporte de Chequeos de Salud</h1>
                  <p class="subtitle">Sistema de Monitoreo Integral de Residentes</p>
              </div>
              
              <div class="header-info">
                  <p><strong>👤 Residente:</strong> ${residentHeaderText}</p>
                  <p><strong>📅 Periodo:</strong> ${
                    dateRange === "personalizado" && customStartDate && customEndDate
                      ? `Del ${customStartDate} al ${customEndDate}`
                      : `Última ${dateRange === "semanal" ? "semana" : dateRange === "mensual" ? "mes" : "trimestre"}`
                  }</p>
                  <p><strong>📋 Total de Chequeos:</strong> ${timeSeriesData.length}</p>
                  <p><strong>🏥 Fecha de Generación:</strong> ${new Date().toLocaleDateString("es-ES", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })} a las ${new Date().toLocaleTimeString("es-ES")}</p>
                  ${stats && stats.alertas > 0 ? `<div class="alert-notice">⚠ ${stats.alertas} Alertas registradas que requieren atención médica</div>` : ""}
              </div>

              <div class="section">
                  <h2>Resumen de Indicadores Promedio</h2>
                  ${statsHtml}
              </div>

              ${trendVisualization ? `<div class="section">${trendVisualization}</div>` : ""}

              <div class="section">
                  <h2>Historial Detallado de Chequeos</h2>
                  <table>
                      <thead>
                          <tr>
                              <th>📅 Fecha</th>
                              <th>👤 Residente</th>
                              <th>O₂ SpO2</th>
                              <th>♥ Pulso</th>
                              <th>°C Temp.</th>
                              <th>⚖ Peso</th>
                              <th>IMC</th>
                              <th>🏥 Estado</th>
                              <th>📝 Observaciones</th>
                          </tr>
                      </thead>
                      <tbody>
                          ${tableRows}
                      </tbody>
                  </table>
              </div>
              
              <div class="footer">
                  <p><strong>Sistema de Salud Digital</strong> | Reporte generado automáticamente</p>
                  <p>Este documento contiene información médica confidencial</p>
              </div>
          </div>
      </body>
      </html>
    `
  }, [timeSeriesData, selectedResidente, dateRange, customStartDate, customEndDate, stats])

  const exportReport = useCallback(async () => {
    if (Platform.OS === "web") {
      Alert.alert(
        "Exportar Reporte (Web)",
        "Para exportar a PDF en la web, puedes usar la función de impresión del navegador (Ctrl/Cmd + P). El reporte incluye gráficas individuales con sombreado y diseño mejorado.",
        [{ text: "OK" }],
      )
      const newWindow = window.open()
      newWindow.document.write(generatePdfContent())
      newWindow.document.close()
      newWindow.print() // Immediately trigger print dialog
    } else {
      // For React Native (iOS/Android)
      try {
        const htmlContent = generatePdfContent()

        const options = {
          html: htmlContent,
          fileName: `ReporteChequeos_${
            selectedResidenteId !== "all" ? selectedResidente?.nombre + "_" + selectedResidente?.apellido : "Todos"
          }_${dateRange}_${new Date().toISOString().split("T")[0]}.pdf`,
          directory: "Documents", // iOS and Android directory for saving
        }

        const file = await RNHTMLtoPDF.convert(options)
        Alert.alert("✅ Éxito", `PDF generado exitosamente y guardado en: ${file.filePath}`)
      } catch (error) {
        console.error("Error generating PDF:", error)
        Alert.alert("❌ Error", `No se pudo generar el PDF: ${error.message}`)
      }
    }
  }, [generatePdfContent, selectedResidenteId, selectedResidente, dateRange])

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando dashboard...</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Card style={styles.errorCard}>
          <CardContent style={styles.errorCardContent}>
            <Text style={styles.errorEmoji}>⚠️</Text>
            <CardTitle style={styles.errorTitle}>Error al cargar los datos</CardTitle>
            <Text style={styles.errorMessage}>{error}</Text>
            <Button onPress={fetchData}>Reintentar</Button>
          </CardContent>
        </Card>
      </View>
    )
  }

  // Chart data preparation for react-native-chart-kit
  const chartConfig = {
    backgroundGradientFrom: COLORS.card,
    backgroundGradientTo: COLORS.card,
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(58, 71, 80, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(58, 71, 80, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    propsForDots: {
      r: "4",
      strokeWidth: "1",
      stroke: COLORS.primary,
    },
  }

  const combinedVitalSignsLineData = {
    labels: timeSeriesData.map((d) => d.fecha),
    datasets: [
      { data: timeSeriesData.map((d) => d.spo2), color: (opacity = 1) => COLORS.primary, legend: "SpO2 (%)" },
      { data: timeSeriesData.map((d) => d.pulso), color: (opacity = 1) => COLORS.danger, legend: "Pulso (lpm)" },
      {
        data: timeSeriesData.map((d) => d.temperatura),
        color: (opacity = 1) => COLORS.warning,
        legend: "Temperatura (°C)",
      },
    ],
  }

  const pesoImcLineData = {
    labels: timeSeriesData.map((d) => d.fecha),
    datasets: [
      { data: timeSeriesData.map((d) => d.peso), color: (opacity = 1) => COLORS.success, legend: "Peso (kg)" },
      { data: timeSeriesData.map((d) => d.imc), color: (opacity = 1) => COLORS.purple, legend: "IMC" },
    ],
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerCard}>
        <View style={styles.headerContent}>
          <Text style={styles.dashboardTitle}>Dashboard de Salud</Text>
          <Text style={styles.dashboardSubtitle}>
            {stats?.total || 0} chequeos • {residentes.length} residentes
            {stats?.alertas > 0 && (
              <Badge variant="destructive" style={styles.alertBadge}>
                {stats.alertas} alertas
              </Badge>
            )}
          </Text>
        </View>
        <Button variant="outline" style={styles.exportButton} onPress={exportReport}>
          <Text style={styles.exportButtonText}>📥 Exportar Reporte</Text>
        </Button>
      </View>

      <View style={styles.filterContainer}>
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>👤 Residente</Text>
          <Select selectedValue={selectedResidenteId} onValueChange={handleResidenteChange}>
            <SelectItem label="Todos los residentes" value="all" />
            {residentes.map((r) => (
              <SelectItem key={r.id_residente} label={`${r.nombre} ${r.apellido}`} value={r.id_residente.toString()} />
            ))}
          </Select>
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>📅 Período</Text>
          <Select selectedValue={dateRange} onValueChange={setDateRange}>
            <SelectItem label="Última semana" value="semanal" />
            <SelectItem label="Último mes" value="mensual" />
            <SelectItem label="Último trimestre" value="trimestral" />
            <SelectItem label="Rango personalizado" value="personalizado" />
          </Select>
        </View>

        {dateRange === "personalizado" && (
          <>
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Fecha inicio</Text>
              <Input type="date" value={customStartDate} onChangeText={setCustomStartDate} />
            </View>
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Fecha fin</Text>
              <Input type="date" value={customEndDate} onChangeText={setCustomEndDate} />
            </View>
          </>
        )}
      </View>

      {selectedResidenteId !== "all" && selectedResidente && (
        <Card style={styles.residentInfoCard}>
          <CardHeader>
            <CardTitle style={styles.cardTitleWithIcon}>👤 Información del Residente</CardTitle>
          </CardHeader>
          <CardContent>
            <View style={styles.residentInfoGrid}>
              <View style={styles.residentInfoColumn}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Nombre completo</Text>
                  <Text style={styles.infoValue}>
                    {selectedResidente.nombre} {selectedResidente.apellido}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Género</Text>
                  <Text style={styles.infoValue}>{selectedResidente.genero}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Teléfono</Text>
                  <Text style={styles.infoValue}>{selectedResidente.telefono}</Text>
                </View>
              </View>
              <View style={styles.residentInfoColumn}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Fecha de nacimiento</Text>
                  <Text style={styles.infoValue}>
                    {new Date(selectedResidente.fecha_nacimiento).toLocaleDateString("es-ES")}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Dispositivo</Text>
                  <Text style={styles.infoValue}>{selectedResidente.dispositivo.nombre}</Text>
                  <Text style={styles.infoSubValue}>{selectedResidente.dispositivo.direccion_MAC}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Estado</Text>
                  <Badge variant={selectedResidente.activo ? "default" : "secondary"}>
                    {selectedResidente.activo ? "Activo" : "Inactivo"}
                  </Badge>
                </View>
              </View>
              <View style={styles.residentInfoColumn}>
                <View style={styles.activityGrid}>
                  <View style={styles.activityBox}>
                    <Text style={styles.activityLabel}>Reposo</Text>
                    <Text style={styles.activityValue}>{selectedResidente.promedioReposo}%</Text>
                  </View>
                  <View style={styles.activityBox}>
                    <Text style={styles.activityLabel}>Activo</Text>
                    <Text style={styles.activityValue}>{selectedResidente.promedioActivo}%</Text>
                  </View>
                  <View style={styles.activityBox}>
                    <Text style={styles.activityLabel}>Agitado</Text>
                    <Text style={styles.activityValue}>{selectedResidente.promedioAgitado}%</Text>
                  </View>
                </View>
              </View>
            </View>
          </CardContent>
        </Card>
      )}

      {/* Promedios (stats) - Manteniéndose como solicitaste */}
      {stats && (
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <CardHeader style={styles.statCardHeader}>
              <CardTitle style={styles.statCardTitle}>SpO2 Promedio</CardTitle>
              <Text style={styles.statIcon}>🫁</Text>
            </CardHeader>
            <CardContent>
              <Text style={styles.statValue}>{stats.avg.spo2}%</Text>
              <Text style={styles.statSubValue}>Último: {stats.latest.spo2}%</Text>
            </CardContent>
          </Card>

          <Card style={styles.statCard}>
            <CardHeader style={styles.statCardHeader}>
              <CardTitle style={styles.statCardTitle}>Pulso Promedio</CardTitle>
              <Text style={styles.statIcon}>❤️</Text>
            </CardHeader>
            <CardContent>
              <Text style={styles.statValue}>{stats.avg.pulso} lpm</Text>
              <Text style={styles.statSubValue}>Último: {stats.latest.pulso} lpm</Text>
            </CardContent>
          </Card>

          <Card style={styles.statCard}>
            <CardHeader style={styles.statCardHeader}>
              <CardTitle style={styles.statCardTitle}>Temperatura Promedio</CardTitle>
              <Text style={styles.statIcon}>🌡️</Text>
            </CardHeader>
            <CardContent>
              <Text style={styles.statValue}>{stats.avg.temperatura}°C</Text>
              <Text style={styles.statSubValue}>Última: {stats.latest.temperaturaCorporal}°C</Text>
            </CardContent>
          </Card>

          <Card style={styles.statCard}>
            <CardHeader style={styles.statCardHeader}>
              <CardTitle style={styles.statCardTitle}>IMC Promedio</CardTitle>
              <Text style={styles.statIcon}>⚖️</Text>
            </CardHeader>
            <CardContent>
              <Text style={styles.statValue}>{stats.avg.imc}</Text>
              <Text style={styles.statSubValue}>Último: {stats.latest.imc.toFixed(1)}</Text>
            </CardContent>
          </Card>
        </View>
      )}

      <View style={styles.chartsGrid}>
        {/* Gráfica 1: Tendencia de ritmo cardíaco, oxígeno en la sangre, temperatura */}
        <Card style={styles.chartCard}>
          <CardHeader>
            <CardTitle style={styles.cardTitleWithIcon}>📈 Tendencias de Signos Vitales</CardTitle>
            <CardDescription>Evolución temporal de SpO2, pulso y temperatura en sus últimas consultas</CardDescription>
          </CardHeader>
          <CardContent>
            {timeSeriesData.length > 0 ? (
              <LineChart
                data={{
                  labels: combinedVitalSignsLineData.labels,
                  datasets: combinedVitalSignsLineData.datasets,
                  legend: combinedVitalSignsLineData.datasets.map((d) => d.legend),
                }}
                width={screenWidth - 48} // Padding for the card
                height={300}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
              />
            ) : (
              <Text style={styles.noDataText}>No hay datos para mostrar la tendencia de signos vitales.</Text>
            )}
          </CardContent>
        </Card>

        {/* Gráfica 2: Tendencia de peso e IMC */}
        <Card style={styles.chartCard}>
          <CardHeader>
            <CardTitle>📊 Evolución de Peso e IMC</CardTitle>
            <CardDescription>Monitoreo de composición corporal en sus últimas consultas</CardDescription>
          </CardHeader>
          <CardContent>
            {timeSeriesData.length > 0 ? (
              <LineChart
                data={{
                  labels: pesoImcLineData.labels,
                  datasets: pesoImcLineData.datasets,
                  legend: pesoImcLineData.datasets.map((d) => d.legend),
                }}
                width={screenWidth - 48}
                height={300}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
              />
            ) : (
              <Text style={styles.noDataText}>No hay datos para mostrar la evolución de peso e IMC.</Text>
            )}
          </CardContent>
        </Card>
      </View>

      {/* Historial Detallado de Chequeos - Ahora dinámico con el rango de fechas y sin slice(-10) */}
      <Card style={styles.historyCard}>
        <CardHeader>
          <CardTitle>📋 Historial Detallado de Chequeos</CardTitle>
          <CardDescription>Todos los chequeos registrados en el rango de fechas seleccionado</CardDescription>
        </CardHeader>
        <CardContent>
          {timeSeriesData.length > 0 ? (
            <ScrollView horizontal style={styles.tableScrollView}>
              <View>
                <View style={styles.tableHeaderRow}>
                  <Text style={styles.tableHeaderCell}>Fecha</Text>
                  <Text style={styles.tableHeaderCell}>Residente</Text>
                  <Text style={styles.tableHeaderCell}>SpO2</Text>
                  <Text style={styles.tableHeaderCell}>Pulso</Text>
                  <Text style={styles.tableHeaderCell}>Temperatura</Text>
                  <Text style={styles.tableHeaderCell}>Peso</Text>
                  <Text style={styles.tableHeaderCell}>IMC</Text>
                  <Text style={styles.tableHeaderCell}>Estado</Text>
                  <Text style={styles.tableHeaderCell}>Observaciones</Text>
                </View>
                {timeSeriesData
                  .slice() // Create a shallow copy to reverse without modifying original
                  .reverse() // Display most recent first
                  .map((item, index) => (
                    <View key={index} style={styles.tableRow}>
                      <Text style={styles.tableCell}>{item.fechaCompleta}</Text>
                      <Text style={[styles.tableCell, styles.tableCellFontMedium]}>{item.residente}</Text>
                      <View style={styles.tableCellContent}>
                        <Badge variant={item.spo2 >= 95 ? "default" : "destructive"}>{item.spo2}%</Badge>
                      </View>
                      <View style={styles.tableCellContent}>
                        <Badge variant={item.pulso >= 60 && item.pulso <= 100 ? "default" : "destructive"}>
                          {item.pulso} lpm
                        </Badge>
                      </View>
                      <View style={styles.tableCellContent}>
                        <Badge
                          variant={item.temperatura >= 36.1 && item.temperatura <= 37.2 ? "default" : "destructive"}
                        >
                          {item.temperatura}°C
                        </Badge>
                      </View>
                      <Text style={styles.tableCell}>{item.peso} kg</Text>
                      <Text style={styles.tableCell}>{item.imc}</Text>
                      <View style={styles.tableCellContent}>
                        <Badge variant={item.isNormal ? "default" : "destructive"}>
                          {item.isNormal ? "Normal" : "Atención"}
                        </Badge>
                      </View>
                      <Text style={styles.tableCellObservations}>{item.observaciones || "Sin observaciones"}</Text>
                    </View>
                  ))}
              </View>
            </ScrollView>
          ) : (
            <Text style={styles.noDataText}>No hay datos en el historial para el rango de fechas seleccionado.</Text>
          )}
        </CardContent>
      </Card>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.textLight,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },
  errorCard: {
    width: "90%",
    maxWidth: 400,
  },
  errorCardContent: {
    paddingVertical: 24,
    alignItems: "center",
  },
  errorEmoji: {
    fontSize: 40,
    color: COLORS.danger,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
    textAlign: "center",
  },
  errorMessage: {
    color: COLORS.textLight,
    marginBottom: 16,
    textAlign: "center",
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  cardHeader: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
  },
  cardTitleWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 4,
  },
  cardContent: {
    padding: 24,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999, // Full pill shape
    fontSize: 11,
    fontWeight: "500",
    alignSelf: "flex-start", // To make it wrap content
    overflow: "hidden", // Ensure border radius works
  },
  select: {
    height: 50,
    width: "100%",
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 6,
    backgroundColor: COLORS.card,
    color: COLORS.text,
  },
  input: {
    height: 48,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    backgroundColor: COLORS.card,
    justifyContent: "center",
  },
  inputText: {
    color: COLORS.text,
    fontSize: 16,
  },
  inputPlaceholder: {
    color: COLORS.textLight,
    fontSize: 16,
  },
  headerCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    padding: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerContent: {},
  dashboardTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.text,
  },
  dashboardSubtitle: {
    color: COLORS.textLight,
    marginTop: 4,
    fontSize: 14,
  },
  alertBadge: {
    marginLeft: 8,
  },
  exportButton: {
    backgroundColor: "transparent",
    borderColor: COLORS.border,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  exportButtonText: {
    color: COLORS.text,
    fontWeight: "500",
  },
  filterContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  filterGroup: {
    width: "48%", // Approximately half width for two columns
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.textLight,
    marginBottom: 6,
  },
  residentInfoCard: {
    marginBottom: 16,
  },
  residentInfoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 24, // Equivalent to gap-6
  },
  residentInfoColumn: {
    width: "30%", // Approximately 1/3rd width
    minWidth: 120, // Minimum width to avoid squishing on small screens
    marginBottom: 16,
  },
  infoItem: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginTop: 2,
  },
  infoSubValue: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  activityGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  activityBox: {
    backgroundColor: COLORS.primary + "0D", // Using lighter shades for background
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    width: "30%", // For 3 columns
  },
  activityLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  activityValue: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.primary, // Specific colors for each stat as per original
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statCard: {
    width: "48%", // For 2 columns, adjust for 4 columns on larger screens
    marginBottom: 16,
  },
  statCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 8,
  },
  statCardTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textLight,
  },
  statIcon: {
    fontSize: 20,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.primary, // Dynamically set color based on stat in actual render
  },
  statSubValue: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  chartsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  chartCard: {
    width: "100%", // Full width by default
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 8,
  },
  noDataText: {
    textAlign: "center",
    color: COLORS.textLight,
    marginTop: 20,
    marginBottom: 20,
  },
  historyCard: {
    marginBottom: 16,
  },
  tableScrollView: {
    maxHeight: 400, // Limit table height and enable scrolling
  },
  tableHeaderRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 12,
    backgroundColor: COLORS.background, // Slightly different background for header
  },
  tableHeaderCell: {
    fontWeight: "600",
    color: COLORS.text,
    paddingHorizontal: 12,
    width: 120, // Fixed width for each column, adjust as needed
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 12,
    backgroundColor: COLORS.card,
  },
  tableCell: {
    color: COLORS.text,
    paddingHorizontal: 12,
    width: 120, // Fixed width for each column
    justifyContent: "center",
    alignSelf: "center", // Vertically center text in cell
  },
  tableCellContent: {
    // For cells containing badges
    width: 120,
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "flex-start", // Align badge to start
  },
  tableCellFontMedium: {
    fontWeight: "500",
  },
  tableCellObservations: {
    color: COLORS.textLight,
    fontSize: 12,
    maxWidth: 150, // Limit width for observations
    paddingHorizontal: 12,
    alignSelf: "center",
  },
})

export default CheckupReportsScreen;