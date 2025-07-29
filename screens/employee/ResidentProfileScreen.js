// AETHERIS/screens/employee/ResidentProfileScreen.js
"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Dimensions, Platform, Alert } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import Config from "../../config/config"
import { useNotification } from "../../src/context/NotificationContext"
import BackButton from "../../components/shared/BackButton"
import { Audio } from 'expo-audio';

import ResidentCard from "../../components/shared/resident_profile/ResidentCard"
import FamilyContactCard from "../../components/shared/resident_profile/FamilyContactCard"
import ChatContainer from "../../components/shared/resident_profile/ChatContainer"
import CheckupsHistoryContainer from "../../components/shared/resident_profile/CheckupsHistoryContainer"
import HealthStatsSection from "../../components/shared/resident_profile/HealthStatsSection"
import ChartsSection from "../../components/shared/resident_profile/ChartsSection"
import AlertsSummaryChart from "../../components/shared/resident_profile/AlertsSummaryChart"


const API_URL = Config.API_BASE_URL
const { width, height } = Dimensions.get("window")
const IS_WEB = Platform.OS === "web"

const COLORS = {
  primaryGreen: "#10B981",
  pageBackground: "#F9FAFB",
  errorRed: "#EF4444",
  accentBlue: "#3B82F6",
  lightText: "#6B7280",
}

export default function ResidentProfileScreen({ route, navigation }) {
  // Aquí currentUserRole y currentUserId siempre serán de un admin/employee
  const { residentId, currentUserRole, currentUserId } = route.params;
  const [resident, setResident] = useState(null)
  const [familiar, setFamiliar] = useState(null)
  const [familiarEmail, setFamiliarEmail] = useState(null)
  const [observations, setObservations] = useState([])
  const [notes, setNotes] = useState([])
  const [weeklyCheckups, setWeeklyCheckups] = useState([])
  const [alerts, setAlerts] = useState([])
  const [selectedCheckupId, setSelectedCheckupId] = useState(null)
  const [alertTimeFilter, setAlertTimeFilter] = useState("7days")
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState("")
  const [newMessage, setNewMessage] = useState("")
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const { showNotification } = useNotification()
  const messageInputRef = useRef(null)

  const [messageSentSound, setMessageSentSound] = useState(null);

  useEffect(() => {
    const loadSound = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/sounds/sent_message.mp3')
        );
        setMessageSentSound(sound);
      } catch (error) {
        console.error("Error loading sound:", error);
      }
    };

    loadSound();

    return () => {
      if (messageSentSound) {
        messageSentSound.unloadAsync();
      }
    };
  }, []);

  const playMessageSentSound = async () => {
    if (messageSentSound) {
      try {
        await messageSentSound.replayAsync();
      } catch (error) {
        console.error("Error playing sound:", error);
      }
    }
  };

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
                    const sortedNotes = activeNotes.sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
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

      await fetchObservations()

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

  const fetchObservations = useCallback(async () => {
    try {
      const observationResponse = await fetch(`${API_URL}/Observacion/${residentId}`)
      if (observationResponse.ok) {
        const apiObservationData = await observationResponse.json()
        const fetchedObservationsData = apiObservationData.observaciones
        if (Array.isArray(fetchedObservationsData) && fetchedObservationsData.length > 0) {
          setObservations(fetchedObservationsData)
        } else {
          setObservations([])
        }
      } else {
         setObservations([])
      }
    } catch (observationError) {
      console.error(`Error al obtener las observaciones:`, observationError)
      setObservations([])
    }
  }, [residentId])


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
      formData.append("notaTexto", newMessage.trim())

      let senderIdForBackend = null;
      let senderIdInNote = null;

      // Para Admin y Employee, el senderIdForBackend siempre será currentUserId
      if (currentUserId) {
          senderIdForBackend = currentUserId.toString();
          formData.append("id_personal", senderIdForBackend);
          senderIdInNote = currentUserId;
      }
      
      if (familiar && familiar.id) {
          formData.append("id_familiar", familiar.id.toString());
      }

      const response = await fetch(`${API_URL}/Nota`, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "*/*",
        },
      })

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("API response not OK:", response.status, errorBody);
        throw new Error(`HTTP error! status: ${response.status} - ${errorBody}`);
      }

      const result = await response.json()

      if (result.type === "Success") {
        const newNote = {
          id: Date.now(),
          nota: newMessage.trim(),
          fecha: new Date().toISOString(),
          activo: true,
          id_personal: senderIdInNote,
          id_familiar: familiar ? familiar.id : null,
        };

        setNotes((prevNotes) => [...prevNotes, newNote].sort((a, b) => new Date(a.fecha) - new Date(b.fecha)))
        setNewMessage("")
        playMessageSentSound();
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

  useEffect(() => {
    fetchResidentDetails();
  }, [fetchResidentDetails]);

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

  // Para Admin y Employee, el botón de retroceso siempre debe aparecer.
  // La condición IS_WEB se mantiene en los estilos para el posicionamiento.
  const shouldShowBackButton = true; // Siempre true para admin/employee

  return (
    <View style={styles.modernContainer}>
      {shouldShowBackButton && (
        <BackButton onPress={() => navigation.goBack()} title="Volver" style={styles.modernBackButton} />
      )}

      <ScrollView style={styles.modernScrollView} showsVerticalScrollIndicator={true}>
        <View style={styles.modernMainContainer}>
          <View style={styles.modernMainGrid}>
            <View style={styles.modernSidebar}>
              <ResidentCard
                resident={resident}
                observations={observations}
                calculateAge={calculateAge}
                onObservationsUpdated={fetchObservations}
                showNotification={showNotification}
                canEditObservations={true} // Admin/Employee siempre pueden editar
              />

              <FamilyContactCard familiar={familiar} familiarEmail={familiarEmail} />

              <ChatContainer
                notes={notes}
                newMessage={newMessage}
                setNewMessage={setNewMessage}
                isSendingMessage={isSendingMessage}
                sendMessage={sendMessage}
                messageInputRef={messageInputRef}
                currentUserRole={currentUserRole}
                currentUserId={currentUserId}
                familiar={familiar}
              />

              <CheckupsHistoryContainer
                weeklyCheckups={weeklyCheckups}
                selectedCheckupId={selectedCheckupId}
                setSelectedCheckupId={setSelectedCheckupId}
                navigation={navigation}
                resident={resident}
              />
            </View>

            <View style={styles.modernMainContent}>
              <HealthStatsSection
                latestCheckup={latestCheckup}
                getTimeSinceCheckup={getTimeSinceCheckup}
                isCheckupOverdue={isCheckupOverdue}
              />

              <ChartsSection
                spo2TrendData={spo2TrendData}
                pulseTrendData={pulseTrendData}
                temperatureTrendData={temperatureTrendData}
                weightTrendData={weightTrendData}
              />

              <AlertsSummaryChart
                alerts={alerts}
                timeFilter={alertTimeFilter}
                setAlertTimeFilter={setAlertTimeFilter}
              />
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
    top: IS_WEB ? 7 : Platform.OS === "ios" ? 50 : 30,
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
    paddingBottom: 40,
    minHeight: IS_WEB ? "calc(100vh - 60px)" : "auto",
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
});