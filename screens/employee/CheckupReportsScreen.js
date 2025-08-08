"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  Dimensions,
  Alert,
  Modal,
} from "react-native"
import { Picker } from "@react-native-picker/picker"
import DateTimePicker from "@react-native-community/datetimepicker"
import { LineChart } from "react-native-chart-kit"
import RNHTMLtoPDF from "react-native-html-to-pdf"

// IMPORTO EL ARCHIVO DE CONFIGURACIÓN
import Config from '../../config/config';

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

const API_BASE_URL = Config.API_BASE_URL;

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

const Select = ({ selectedValue, onValueChange, children, style = {}, placeholder = "Seleccionar una opción" }) => {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedItemLabel = useMemo(() => {
    const foundChild = React.Children.toArray(children).find(child => child.props.value === selectedValue);
    return foundChild ? foundChild.props.label : placeholder;
  }, [selectedValue, children, placeholder]);

  if (Platform.OS === 'web') {
    return (
      <Picker
        selectedValue={selectedValue}
        onValueChange={onValueChange}
        style={[styles.select, style]}
      >
        {children}
      </Picker>
    );
  }

  // Mobile (iOS/Android) implementation
  return (
    <View>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={[styles.input, style]}
      >
        <Text style={selectedValue ? styles.inputText : styles.inputPlaceholder}>
          {selectedItemLabel}
        </Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Seleccione una opción</Text>
            <Picker
              selectedValue={selectedValue}
              onValueChange={(itemValue) => {
                onValueChange(itemValue);
                setModalVisible(false);
              }}
              style={styles.pickerInsideModal}
              itemStyle={Platform.OS === 'ios' ? styles.pickerItemStyle : {}}
            >
              {children}
            </Picker>
            <Button onPress={() => setModalVisible(false)} variant="outline" style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </Button>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const SelectItem = ({ label, value }) => <Picker.Item label={label} value={value} />

import { TextInput } from "react-native"

const Input = ({ type = "text", value, onChangeText, style = {}, ...props }) => {
  const [showDatePicker, setShowDatePicker] = useState(false)

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === "ios")
    if (event.type === "set" && selectedDate) {
      onChangeText(selectedDate.toISOString().split("T")[0])
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
  const [dateRange, setDateRange] = useState("mensual") // Default to mensual
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
      case "mensual":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case "trimestral":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      default: // Fallback, e.g., if dateRange is initially not 'mensual' or 'trimestral'
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // Default to monthly
        break
    }

    return filtered.filter((c) => {
      const checkDate = new Date(c.fechaChequeo)
      return checkDate >= startDate && checkDate <= endDate
    })
  }, [chequeos, selectedResidenteId, dateRange])

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

    const points = data
      .map((value, index) => {
        const x = padding + (index * chartWidth) / (data.length - 1)
        const y = padding + chartHeight - ((value - min) / range) * chartHeight
        return `${x},${y}`
      })
      .join(" ")

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

          <defs>
            <pattern id="grid-${title.replace(/\s+/g, "")}" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="${NEUTRAL_LIGHT}" stroke-width="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-${title.replace(/\s+/g, "")})" opacity="0.3"/>

          <polygon points="${areaPoints}" fill="url(#gradient-${title.replace(/\s+/g, "").replace(/[()]/g, "")})" />

          <polyline points="${points}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>

          ${data
            .map((value, index) => {
              const x = padding + (index * chartWidth) / (data.length - 1)
              const y = padding + chartHeight - ((value - min) / range) * chartHeight
              return `<circle cx="${x}" cy="${y}" r="3" fill="${color}" stroke="white" stroke-width="1.5"/>`
            })
            .join("")}

          <text x="5" y="${padding + 5}" text-anchor="start" font-size="9" fill="${NEUTRAL_MEDIUM}">${max.toFixed(1)}${unit}</text>
          <text x="5" y="${padding + chartHeight}" text-anchor="start" font-size="9" fill="${NEUTRAL_MEDIUM}">${min.toFixed(1)}${unit}</text>

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

  const createSimpleChart = (data, label, color = PRIMARY_ACCENT) => {
    if (!data || data.length === 0) return ""

    const max = Math.max(...data)
    const min = Math.min(...data)
    const range = max - min || 1

    return data
      .map((value, index) => {
        const height = Math.round(((value - min) / range) * 20) + 5
        return `<div class="chart-bar" style="height: ${height}px; background-color: ${color}; width: 20px; display: inline-block; margin: 0 2px; vertical-align: bottom;"></div>`
      })
      .join("")
  }

  const generatePdfContent = useCallback(() => {
    const rangeText =
        dateRange === "mensual" ? "Último mes" : "Último trimestre"

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
            .slice()
            .reverse()
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
                  <p><strong>📅 Periodo:</strong> Último ${dateRange === "mensual" ? "mes" : "trimestre"}</p>
                  <p><strong>📋 Total de Chequeos:</strong> ${timeSeriesData.length}</p>
                  <p><strong>🏥 Fecha de Generación:</strong> ${new Date().toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric", })} a las ${new Date().toLocaleTimeString("es-ES")}</p>
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
  }, [timeSeriesData, selectedResidente, dateRange, stats])

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
      newWindow.print()
    } else {
      // Check if RNHTMLtoPDF is available and has the convert method
      if (RNHTMLtoPDF && typeof RNHTMLtoPDF.convert === 'function') {
        try {
          const htmlContent = generatePdfContent()
          const options = {
            html: htmlContent,
            fileName: `ReporteChequeos_${
              selectedResidenteId !== "all" ? selectedResidente?.nombre + "_" + selectedResidente?.apellido : "Todos"
            }_${dateRange}_${new Date().toISOString().split("T")[0]}.pdf`,
            directory: "Documents",
          }
          const file = await RNHTMLtoPDF.convert(options)
          Alert.alert("✅ Éxito", `PDF generado exitosamente y guardado en: ${file.filePath}`)
        } catch (error) {
          console.error("Error generating PDF:", error)
          Alert.alert("❌ Error", `No se pudo generar el PDF: ${error.message}`)
        }
      } else {
        // Fallback for when RNHTMLtoPDF is not available (e.g., native module not linked)
        Alert.alert(
          "❌ Error de PDF",
          "La funcionalidad de generación de PDF no está disponible en este dispositivo. Por favor, asegúrate de que la aplicación esté correctamente instalada o contacta a soporte.",
          [{ text: "OK" }]
        );
        console.error("RNHTMLtoPDF or RNHTMLtoPDF.convert is not available on this platform.");
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
            <CardTitle>Error al cargar datos</CardTitle>
            <CardDescription>
              Hubo un problema al intentar obtener la información. Por favor, verifica tu conexión a Internet e inténtalo de nuevo.
              {error && `\nDetalles: ${error}`}
            </CardDescription>
            <Button onPress={fetchData} style={{ marginTop: 20 }}>
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      <Card>
        <CardHeader>
          <CardTitle>Generar Reporte de Chequeos</CardTitle>
          <CardDescription>Selecciona los filtros para generar el reporte de salud de tus residentes.</CardDescription>
        </CardHeader>
        <CardContent>
          <Text style={styles.label}>Residente:</Text>
          <Select
            selectedValue={selectedResidenteId}
            onValueChange={(itemValue) => handleResidenteChange(itemValue)}
          >
            <SelectItem label="Todos los Residentes" value="all" />
            {residentes.map((residente) => (
              <SelectItem
                key={residente.id_residente}
                label={`${residente.nombre} ${residente.apellido}`}
                value={residente.id_residente.toString()}
              />
            ))}
          </Select>

          <Text style={[styles.label, { marginTop: 16 }]}>Período:</Text>
          <Select selectedValue={dateRange} onValueChange={(itemValue) => setDateRange(itemValue)}>
            <SelectItem label="Último mes" value="mensual" />
            <SelectItem label="Último trimestre" value="trimestral" />
          </Select>

          <Button onPress={exportReport} style={styles.generateButton}>
            Generar Reporte PDF
          </Button>
        </CardContent>
      </Card>

      <Card style={styles.historyCard}>
        <CardHeader>
          <CardTitle>Historial de Chequeos Recientes</CardTitle>
          <CardDescription>
            Visualización de los chequeos de salud de los residentes seleccionados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {timeSeriesData.length > 0 ? (
            <View>
              <Text style={styles.sectionTitle}>Resumen de Estadísticas</Text>
              {stats && (
                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Último SpO2:</Text>
                    <Text style={styles.statValue}>{stats.latest.spo2}%</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Promedio Pulso:</Text>
                    <Text style={styles.statValue}>{stats.avg.pulso} lpm</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Alertas:</Text>
                    <Text style={[styles.statValue, stats.alertas > 0 ? styles.alertText : {}]}>
                      {stats.alertas}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Total Chequeos:</Text>
                    <Text style={styles.statValue}>{stats.total}</Text>
                  </View>
                </View>
              )}

              <Text style={styles.sectionTitle}>Gráficas de Tendencia</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chartContainer}>
                  <Text style={styles.chartTitle}>SPO2 (%)</Text>
                  <LineChart
                    data={{
                      labels: timeSeriesData.map((d) => d.fecha),
                      datasets: [{ data: timeSeriesData.map((d) => d.spo2) }],
                    }}
                    width={screenWidth * 1.5}
                    height={220}
                    chartConfig={{
                      backgroundColor: COLORS.card,
                      backgroundGradientFrom: COLORS.card,
                      backgroundGradientTo: COLORS.card,
                      decimalPlaces: 1,
                      color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(58, 71, 80, ${opacity})`,
                      propsForDots: {
                        r: "6",
                        strokeWidth: "2",
                        stroke: COLORS.primary,
                      },
                    }}
                    bezier
                    style={styles.chart}
                  />
                </View>

                <View style={styles.chartContainer}>
                  <Text style={styles.chartTitle}>Pulso (lpm)</Text>
                  <LineChart
                    data={{
                      labels: timeSeriesData.map((d) => d.fecha),
                      datasets: [{ data: timeSeriesData.map((d) => d.pulso) }],
                    }}
                    width={screenWidth * 1.5}
                    height={220}
                    chartConfig={{
                      backgroundColor: COLORS.card,
                      backgroundGradientFrom: COLORS.card,
                      backgroundGradientTo: COLORS.card,
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(208, 2, 27, ${opacity})`, // Danger color
                      labelColor: (opacity = 1) => `rgba(58, 71, 80, ${opacity})`,
                      propsForDots: {
                        r: "6",
                        strokeWidth: "2",
                        stroke: COLORS.danger,
                      },
                    }}
                    bezier
                    style={styles.chart}
                  />
                </View>

                <View style={styles.chartContainer}>
                  <Text style={styles.chartTitle}>Temperatura (°C)</Text>
                  <LineChart
                    data={{
                      labels: timeSeriesData.map((d) => d.fecha),
                      datasets: [{ data: timeSeriesData.map((d) => d.temperatura) }],
                    }}
                    width={screenWidth * 1.5}
                    height={220}
                    chartConfig={{
                      backgroundColor: COLORS.card,
                      backgroundGradientFrom: COLORS.card,
                      backgroundGradientTo: COLORS.card,
                      decimalPlaces: 1,
                      color: (opacity = 1) => `rgba(245, 166, 35, ${opacity})`, // Warning color
                      labelColor: (opacity = 1) => `rgba(58, 71, 80, ${opacity})`,
                      propsForDots: {
                        r: "6",
                        strokeWidth: "2",
                        stroke: COLORS.warning,
                      },
                    }}
                    bezier
                    style={styles.chart}
                  />
                </View>

                <View style={styles.chartContainer}>
                  <Text style={styles.chartTitle}>Peso (kg)</Text>
                  <LineChart
                    data={{
                      labels: timeSeriesData.map((d) => d.fecha),
                      datasets: [{ data: timeSeriesData.map((d) => d.peso) }],
                    }}
                    width={screenWidth * 1.5}
                    height={220}
                    chartConfig={{
                      backgroundColor: COLORS.card,
                      backgroundGradientFrom: COLORS.card,
                      backgroundGradientTo: COLORS.card,
                      decimalPlaces: 1,
                      color: (opacity = 1) => `rgba(126, 211, 33, ${opacity})`, // Success color
                      labelColor: (opacity = 1) => `rgba(58, 71, 80, ${opacity})`,
                      propsForDots: {
                        r: "6",
                        strokeWidth: "2",
                        stroke: COLORS.success,
                      },
                    }}
                    bezier
                    style={styles.chart}
                  />
                </View>

                <View style={styles.chartContainer}>
                  <Text style={styles.chartTitle}>IMC</Text>
                  <LineChart
                    data={{
                      labels: timeSeriesData.map((d) => d.fecha),
                      datasets: [{ data: timeSeriesData.map((d) => d.imc) }],
                    }}
                    width={screenWidth * 1.5}
                    height={220}
                    chartConfig={{
                      backgroundColor: COLORS.card,
                      backgroundGradientFrom: COLORS.card,
                      backgroundGradientTo: COLORS.card,
                      decimalPlaces: 1,
                      color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`, // Purple color
                      labelColor: (opacity = 1) => `rgba(58, 71, 80, ${opacity})`,
                      propsForDots: {
                        r: "6",
                        strokeWidth: "2",
                        stroke: COLORS.purple,
                      },
                    }}
                    bezier
                    style={styles.chart}
                  />
                </View>
              </ScrollView>

              <Text style={styles.sectionTitle}>Detalles del Historial</Text>
              <ScrollView style={styles.tableScrollView}>
                <View>
                  <View style={styles.tableHeaderRow}>
                    <Text style={styles.tableHeaderCell}>Fecha</Text>
                    <Text style={styles.tableHeaderCell}>Residente</Text>
                    <Text style={styles.tableHeaderCell}>SpO2</Text>
                    <Text style={styles.tableHeaderCell}>Pulso</Text>
                    <Text style={styles.tableHeaderCell}>Temp. Corporal</Text>
                    <Text style={styles.tableHeaderCell}>Peso</Text>
                    <Text style={styles.tableHeaderCell}>IMC</Text>
                    <Text style={styles.tableHeaderCell}>Estado</Text>
                    <Text style={styles.tableHeaderCell}>Observaciones</Text>
                  </View>
                  {timeSeriesData
                    .slice()
                    .reverse()
                    .map((item, index) => (
                      <View key={index} style={styles.tableRow}>
                        <Text style={styles.tableCell}>{item.fechaCompleta}</Text>
                        <Text style={[styles.tableCell, styles.residentName]}>{item.residente}</Text>
                        <Text style={[styles.tableCell, item.spo2 >= 95 ? styles.normalText : styles.alertText]}>
                          {item.spo2}%
                        </Text>
                        <Text
                          style={[
                            styles.tableCell,
                            item.pulso >= 60 && item.pulso <= 100 ? styles.normalText : styles.alertText,
                          ]}
                        >
                          {item.pulso} lpm
                        </Text>
                        <Text
                          style={[
                            styles.tableCell,
                            item.temperatura >= 36.1 && item.temperatura <= 37.2 ? styles.normalText : styles.alertText,
                          ]}
                        >
                          {item.temperatura}°C
                        </Text>
                        <Text style={styles.tableCell}>{item.peso} kg</Text>
                        <Text style={styles.tableCell}>{item.imc.toFixed(1)}</Text>
                        <View style={styles.tableCellContent}>
                          <Badge variant={item.isNormal ? "success" : "destructive"}>
                            {item.isNormal ? "Normal" : "Atención"}
                          </Badge>
                        </View>
                        <Text style={styles.tableCell}>{item.observaciones || "N/A"}</Text>
                      </View>
                    ))}
                </View>
              </ScrollView>
            </View>
          ) : (
            <Text style={styles.noDataText}>No hay datos disponibles para los filtros seleccionados.</Text>
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
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  cardContent: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    color: COLORS.text,
  },
  inputText: {
    fontSize: 16,
    color: COLORS.text,
  },
  inputPlaceholder: {
    fontSize: 16,
    color: COLORS.textLight,
  },
  select: {
    height: 50,
    width: "100%",
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: COLORS.card,
    color: COLORS.text,
    marginBottom: 12,
  },
  dateRangeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  dateInputWrapper: {
    width: "48%",
  },
  generateButton: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginTop: 24,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 8,
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statItem: {
    width: "48%",
    backgroundColor: COLORS.lightBlue,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "500",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.darkText,
  },
  alertText: {
    color: COLORS.danger,
    fontWeight: "700",
  },
  chartContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: screenWidth * 0.9,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
    textAlign: "center",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.textLight,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
    padding: 20,
  },
  errorCard: {
    width: "90%",
    padding: 20,
    alignItems: "center",
  },
  errorCardContent: {
    alignItems: "center",
  },
  errorEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
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
    maxHeight: 400,
  },
  tableHeaderRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
  },
  tableHeaderCell: {
    fontWeight: "600",
    color: COLORS.text,
    paddingHorizontal: 12,
    width: 120,
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
    width: 120,
    justifyContent: "center",
    alignSelf: "center",
  },
  tableCellContent: {
    width: 120,
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  residentName: {
    fontWeight: "600",
    color: COLORS.primary,
  },
  normalText: {
    color: COLORS.success,
    fontWeight: "bold",
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "80%",
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 15,
    color: COLORS.text,
  },
  pickerInsideModal: {
    width: "100%",
    height: 150,
  },
  pickerItemStyle: {
    fontSize: 16,
    color: COLORS.text,
  },
  cancelButton: {
    marginTop: 20,
    width: "100%",
  },
  cancelButtonText: {
    color: COLORS.primary,
  },
})

export default CheckupReportsScreen