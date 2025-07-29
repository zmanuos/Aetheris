import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Platform,
  Image, // Import Image component
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Config from '../../config/config';
import { useNotification } from '../../src/context/NotificationContext';
import BackButton from '../../components/shared/BackButton';
import Config from '../../config/config';

const API_URL = Config.API_BASE_URL;
// Assuming images are served from a specific base URL. Adjust this if different.
const IMAGE_BASE_URL = `${API_URL}/images/residents/`;


const { width } = Dimensions.get('window');
const IS_LARGE_SCREEN = width > 900;

const COLORS = {
  primary: '#4CAF50', // Verde vibrante pero profesional
  accent: '#2196F3', // Azul para acentos y iconos
  background: '#F8F9FA', // Fondo general muy claro
  card: '#FFFFFF', // Fondo de tarjetas blanco puro
  textDark: '#2C3E50', // Texto principal oscuro
  textMedium: '#7F8C8D', // Texto secundario / etiquetas
  textLight: '#B0B0B0', // Texto muy claro para detalles sutiles
  border: '#E0E0E0', // Color de borde claro
  shadow: 'rgba(0, 0, 0, 0.10)', // Sombra más prominente
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FFC107',
  info: '#2196F3',
  observationBg: '#E8F5E9', // Fondo para el cuadro de observaciones
  rowDivider: '#F0F0F0', // Divisor más sutil para filas

  // Colores para estados de salud
  statusNormal: '#4CAF50', // Verde para valores normales
  statusLow: '#FFC107',    // Amarillo/Naranja para valores bajos (advertencia)
  statusHigh: '#F44336',   // Rojo para valores altos (crítico)
  statusUnderweight: '#FFC107', // Amarillo/Naranja
  statusOverweight: '#FFC107',  // Amarillo/Naranja
  statusObese: '#F44336',       // Rojo
};

// --- Helper Functions for Health Status ---
const getSpO2Status = (value) => {
  if (value === null || value === undefined) return 'N/A';
  if (value >= 95) return 'normal';
  return 'low';
};

const getPulsoStatus = (value) => {
  if (value === null || value === undefined) return 'N/A';
  if (value >= 60 && value <= 100) return 'normal';
  if (value < 60) return 'low';
  return 'high';
};

const getTemperaturaStatus = (value) => {
  if (value === null || value === undefined) return 'N/A';
  if (value >= 36.5 && value <= 37.5) return 'normal';
  return 'high'; // Assuming anything outside 36.5-37.5 is high/low depending on context, but here simplified.
};

const getIMCStatus = (value) => {
  if (value === null || value === undefined) return 'N/A';
  if (value < 18.5) return 'underweight';
  if (value >= 18.5 && value <= 24.9) return 'normal';
  if (value >= 25 && value <= 29.9) return 'overweight';
  return 'obese';
};

const getStatusColor = (status) => {
  switch (status) {
    case 'normal':
      return COLORS.statusNormal;
    case 'low':
    case 'underweight':
    case 'overweight':
      return COLORS.statusLow;
    case 'high':
    case 'obese':
      return COLORS.statusHigh;
    default:
      return COLORS.textMedium; // Default for N/A or unknown status
  }
};

// Helper function to calculate age from birth date
const calculateAge = (birthDateString) => {
  if (!birthDateString) return 'N/A';
  const birthDate = new Date(birthDateString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// --- Main Component ---
export default function WeeklyCheckupDetailScreen({ route, navigation }) {
  const { checkupId, residentName, residentId: initialResidentId } = route.params;
  console.log('WeeklyCheckupDetailScreen - route.params:', route.params);

  const [checkupDetails, setCheckupDetails] = useState(null);
  const [personalName, setPersonalName] = useState('N/A');
  const [residentPhotoUrl, setResidentPhotoUrl] = useState(null);
  const [residentAge, setResidentAge] = useState('N/A'); // Nuevo estado para la edad
  const [residentGender, setResidentGender] = useState('N/A'); // Nuevo estado para el género
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const { showNotification } = useNotification();

  const fetchDetails = useCallback(async () => {
    setIsLoading(true);
    setFetchError('');
    try {
      // Fetch Checkup Details
      console.log(`Fetching checkup details for ID: ${checkupId}`);
      const checkupResponse = await fetch(`${API_URL}/ChequeoSemanal/id/${checkupId}`);
      if (!checkupResponse.ok) {
        throw new Error(`HTTP error! status: ${checkupResponse.status}`);
      }
      const checkupData = await checkupResponse.json();
      console.log('Checkup details fetched:', checkupData);
      setCheckupDetails(checkupData);

      // Determine resident ID to fetch photo and other details
      const idToFetchPhoto = initialResidentId || checkupData.residenteId;

      // Fetch Personal Name
      if (checkupData.personalId) {
        try {
          console.log(`Fetching personal details for ID: ${checkupData.personalId}`);
          const personalResponse = await fetch(`${API_URL}/Personal/${checkupData.personalId}`);
          if (personalResponse.ok) {
            const personalData = await personalResponse.json();
            console.log('Personal details fetched:', personalData);
            if (personalData.personal && personalData.personal.nombre && personalData.personal.apellido) {
              setPersonalName(`${personalData.personal.nombre} ${personalData.personal.apellido}`);
            } else {
              setPersonalName('Desconocido');
            }
          } else {
            console.warn(`No se pudieron obtener los detalles del personal para el ID: ${checkupData.personalId}`);
            setPersonalName('Desconocido');
          }
        } catch (personalError) {
          console.error('Error al obtener los detalles del personal:', personalError);
          setPersonalName('Error al cargar personal');
        }
      } else {
        setPersonalName('No asignado');
      }

      // Fetch Resident Photo and other details if a resident ID is available
      if (idToFetchPhoto) {
        try {
          const residentApiUrl = `${API_URL}/Residente/${idToFetchPhoto}`;
          console.log(`Fetching resident details for photo and info from: ${residentApiUrl}`);
          const residentResponse = await fetch(residentApiUrl);
          if (!residentResponse.ok) {
            throw new Error(`HTTP error! status: ${residentResponse.status}`);
          }
          const residentData = await residentResponse.json();
          console.log('Resident details fetched for photo and info:', residentData);

          if (residentData.residente) {
            // Extract and set photo URL
            if (residentData.residente.foto) {
              const fullPhotoUrl = `${IMAGE_BASE_URL}${residentData.residente.foto}`;
              console.log('Constructed resident photo URL:', fullPhotoUrl);
              setResidentPhotoUrl(fullPhotoUrl);
            } else {
              console.warn(`No se encontró 'foto' para el residente ID: ${idToFetchPhoto}.`, residentData);
              setResidentPhotoUrl(null);
            }

            // Calculate and set age
            if (residentData.residente.fecha_nacimiento) {
              const age = calculateAge(residentData.residente.fecha_nacimiento);
              setResidentAge(`${age} años`);
            } else {
              setResidentAge('N/A');
            }
            
            setResidentGender(residentData.residente.genero || 'N/A');

          } else {
            console.warn(`No se encontró el objeto 'residente' en la respuesta para ID: ${idToFetchPhoto}.`, residentData);
            setResidentPhotoUrl(null);
            setResidentAge('N/A');
            setResidentGender('N/A');
          }
        } catch (residentError) {
          console.error('Error al obtener los detalles del residente para la foto y info:', residentError);
          setResidentPhotoUrl(null);
          setResidentAge('N/A');
          setResidentGender('N/A');
        }
      } else {
        console.warn('No hay un ID de residente disponible para cargar la foto e información.');
        setResidentPhotoUrl(null);
        setResidentAge('N/A');
        setResidentGender('N/A');
      }

    } catch (error) {
      console.error('Error general al obtener los detalles (chequeo o residente):', error);
      setFetchError(`Error al cargar los detalles: ${error.message}`);
      showNotification(`Error al cargar los detalles: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [checkupId, initialResidentId, showNotification]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando detalles del chequeo semanal...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (fetchError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={30} color={COLORS.error} />
          <Text style={styles.errorText}>{fetchError}</Text>
          <Text style={styles.errorText}>ID del Chequeo: {checkupId}</Text>
          {initialResidentId && <Text style={styles.errorText}>ID del Residente: {initialResidentId}</Text>}
        </View>
      </SafeAreaView>
    );
  }

  if (!checkupDetails) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Ionicons name="information-circle-outline" size={30} color={COLORS.info} />
          <Text style={styles.errorText}>No se pudieron cargar los detalles del chequeo.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const DetailRow = ({ iconName, label, value, status }) => (
    <View style={styles.detailRow}>
      <Ionicons name={iconName} size={IS_LARGE_SCREEN ? 18 : 22} color={COLORS.accent} style={styles.detailIcon} />
      <Text style={styles.detailLabel}>{label}:</Text>
      <View style={styles.valueWithStatus}>
        <Text style={[styles.detailValue, { color: getStatusColor(status) }]}>{value || 'N/A'}</Text>
        {status !== 'N/A' && (
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(status) }]} />
        )}
      </View>
    </View>
  );

  const formattedDate = checkupDetails.fechaChequeo ? 
    new Date(checkupDetails.fechaChequeo).toLocaleString('es-ES', { 
      year: 'numeric', 
      month: 'numeric', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    }) : 'N/A';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backButtonContainer}>
        <BackButton onPress={() => navigation.goBack()} title="Regresar" />
      </View>

      <ScrollView contentContainerStyle={IS_LARGE_SCREEN ? styles.scrollViewContentWeb : styles.scrollViewContent}>
        <View style={[styles.detailCard, IS_LARGE_SCREEN && styles.detailCardWeb]}>

          {/* Header with Title and Date/Time */}
          <View style={styles.headerContainer}>
            <View style={styles.headerTitleContainer}>
              {/* Icono eliminado */}
              <Text style={styles.screenTitle}>Detalles de la consulta</Text>
            </View>
            <View style={styles.dateTimePersonalContainer}>
              <Text style={styles.checkupDateTime}>Fecha de consulta: {formattedDate}</Text>
              <Text style={styles.performedBy}>
                <Text style={styles.performedByLabel}>Realizada por: </Text>
                <Text style={styles.highlightedPersonalName}>{personalName}</Text>
              </Text>
            </View>
          </View>
          
          <View style={styles.sectionDivider} />

          {/* Sección de Datos del Residente con Foto a la Izquierda */}
          <View style={styles.residentDataContainer}>
            {residentPhotoUrl ? (
              <Image source={{ uri: residentPhotoUrl }} style={styles.residentPhoto} />
            ) : (
              <View style={styles.residentPhotoPlaceholder}>
                <Ionicons name="person-circle-outline" size={IS_LARGE_SCREEN ? 90 : 120} color={COLORS.textLight} />
              </View>
            )}
            <View style={styles.residentInfoBlock}>
              <Text style={styles.residentNameHeader}>{residentName || 'Residente Desconocido'}</Text>
              <View style={styles.residentDetailsGrid}>
                <DetailRow
                  iconName="happy-outline"
                  label="Edad"
                  value={residentAge}
                  status={'N/A'}
                />
                <DetailRow
                  iconName="male-female-outline"
                  label="Género"
                  value={residentGender}
                  status={'N/A'}
                />
              </View>
            </View>
          </View>

          <View style={styles.sectionDivider} />

          {/* Datos de la Consulta (Valores de Salud) */}
          <Text style={styles.sectionTitle}>Valores de Salud</Text>
          <View style={styles.checklistSection}>
            <DetailRow
              iconName="water-outline"
              label="SpO2"
              value={checkupDetails.spo2 !== undefined && checkupDetails.spo2 !== null ? `${checkupDetails.spo2}%` : 'N/A'}
              status={getSpO2Status(checkupDetails.spo2)}
            />
            <DetailRow
              iconName="heart-outline"
              label="Pulso"
              value={checkupDetails.pulso !== undefined && checkupDetails.pulso !== null ? `${checkupDetails.pulso} bpm` : 'N/A'}
              status={getPulsoStatus(checkupDetails.pulso)}
            />
            <DetailRow
              iconName="thermometer-outline"
              label="Temperatura"
              value={checkupDetails.temperaturaCorporal !== undefined && checkupDetails.temperaturaCorporal !== null ? `${checkupDetails.temperaturaCorporal}°C` : 'N/A'}
              status={getTemperaturaStatus(checkupDetails.temperaturaCorporal)}
            />
            <DetailRow
              iconName="barbell-outline"
              label="Peso"
              value={checkupDetails.peso !== undefined && checkupDetails.peso !== null ? `${checkupDetails.peso} kg` : 'N/A'}
              status={checkupDetails.peso !== undefined && checkupDetails.peso !== null ? 'normal' : 'N/A'}
            />
            <DetailRow
              iconName="resize-outline"
              label="Altura"
              value={checkupDetails.altura !== undefined && checkupDetails.altura !== null ? `${checkupDetails.altura} m` : 'N/A'}
              status={checkupDetails.altura !== undefined && checkupDetails.altura !== null ? 'normal' : 'N/A'}
            />
            <DetailRow
              iconName="body-outline"
              label="IMC"
              value={checkupDetails.imc !== undefined && checkupDetails.imc !== null ? checkupDetails.imc.toFixed(1) : 'N/A'}
              status={getIMCStatus(checkupDetails.imc)}
            />
          </View>

          <View style={styles.sectionDivider} />

          {/* Observaciones */}
          <Text style={styles.sectionTitle}>Observaciones de la consulta</Text>
          <View style={styles.observationBox}>
            <Text style={styles.observationText}>{checkupDetails.observaciones || 'No hay observaciones para este chequeo.'}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.textMedium,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.background,
  },
  errorText: {
    color: COLORS.error,
    textAlign: 'center',
    marginTop: 10,
    fontSize: 16,
  },
  backButtonContainer: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 20 : (Platform.OS === 'ios' ? 40 : 20),
    left: 15,
    zIndex: 10,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20, // Reduced padding
    paddingHorizontal: 15,
    paddingTop: 60, // Reduced padding to lift content higher
  },
  scrollViewContentWeb: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20, // Reduced padding
    paddingHorizontal: 15,
    paddingTop: 20, // Reduced padding to lift content higher
  },
  detailCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: IS_LARGE_SCREEN ? 20 : 15, // Adjusted padding for more compactness
    width: '100%',
    maxWidth: IS_LARGE_SCREEN ? 650 : '95%', // Made even less wide
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 }, // Further increased height for more lift
    shadowOpacity: 0.25, // Further increased opacity for more visibility
    shadowRadius: 15, // Further increased radius for a softer, wider spread
    elevation: 8, // Further increased elevation for Android consistency
  },
  detailCardWeb: {
    paddingTop: IS_LARGE_SCREEN ? 20 : 15,
  },
  residentDataContainer: {
    flexDirection: IS_LARGE_SCREEN ? 'row' : 'column',
    alignItems: 'center',
    marginBottom: 15, // Reduced margin
    gap: IS_LARGE_SCREEN ? 20 : 10,
  },
  residentPhoto: {
    width: IS_LARGE_SCREEN ? 120 : 140, // Slightly smaller photo
    height: IS_LARGE_SCREEN ? 120 : 140, // Slightly smaller photo
    borderRadius: IS_LARGE_SCREEN ? 60 : 70,
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  residentPhotoPlaceholder: {
    width: IS_LARGE_SCREEN ? 120 : 140, // Slightly smaller placeholder
    height: IS_LARGE_SCREEN ? 120 : 140, // Slightly smaller placeholder
    borderRadius: IS_LARGE_SCREEN ? 60 : 70,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.textLight,
  },
  residentInfoBlock: {
    flex: 1,
    alignItems: IS_LARGE_SCREEN ? 'flex-start' : 'center',
  },
  residentNameHeader: {
    fontSize: IS_LARGE_SCREEN ? 19 : 21, // Slightly smaller font
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 4, // Reduced margin
    textAlign: IS_LARGE_SCREEN ? 'left' : 'center',
    width: '100%',
  },
  residentDetailsGrid: {
    width: '100%',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
    marginTop: 5, // Reduced margin top for a cleaner look
  },
  headerTitleContainer: {
    alignItems: 'flex-start',
    flexShrink: 1,
    flexDirection: 'row', // Ensure icon and title are in a row
    alignItems: 'center', // Align icon and title vertically
    gap: 10, // Space between icon and title
  },
  screenTitle: {
    fontSize: IS_LARGE_SCREEN ? 24 : 26, // Increased font size significantly
    fontWeight: '700',
    color: COLORS.textDark,
    marginTop: 0, // No extra margin as it's row-aligned now
    textAlign: 'left',
  },
  dateTimePersonalContainer: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  checkupDateTime: {
    fontSize: IS_LARGE_SCREEN ? 13 : 15,
    fontWeight: 'bold',
    color: COLORS.textDark,
    textAlign: 'right',
    marginBottom: 3, // Reduced space
  },
  performedBy: {
    fontSize: IS_LARGE_SCREEN ? 12 : 14, // Slightly smaller font
    color: COLORS.textMedium,
    textAlign: 'right',
  },
  performedByLabel: {
    fontWeight: 'bold', // Made "Realizada por: " bold
  },
  highlightedPersonalName: {
    fontWeight: 'bold', // Made bold
    fontSize: IS_LARGE_SCREEN ? 14 : 16, // Slightly larger
    color: COLORS.textDark, // Darker color for emphasis
  },
  sectionDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    marginVertical: 12, // Reduced margin
  },
  sectionTitle: {
    fontSize: IS_LARGE_SCREEN ? 17 : 19, // Slightly smaller font
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 10, // Reduced margin
    textAlign: 'left',
  },
  checklistSection: {
    borderWidth: 1,
    borderColor: COLORS.rowDivider,
    borderRadius: 8,
    paddingHorizontal: 8, // Reduced padding
    paddingVertical: 3, // Reduced padding
    backgroundColor: COLORS.card,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: IS_LARGE_SCREEN ? 8 : 10, // Reduced padding
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.rowDivider,
  },
  detailIcon: {
    marginRight: IS_LARGE_SCREEN ? 12 : 15, // Adjusted margin
    width: IS_LARGE_SCREEN ? 22 : 26, // Slightly smaller icon
    textAlign: 'center',
  },
  detailLabel: {
    fontSize: IS_LARGE_SCREEN ? 14 : 16, // Slightly smaller font
    fontWeight: '600',
    color: COLORS.textMedium,
    flex: IS_LARGE_SCREEN ? 0.7 : 1,
  },
  valueWithStatus: {
    flex: IS_LARGE_SCREEN ? 1.3 : 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  detailValue: {
    fontSize: IS_LARGE_SCREEN ? 14 : 16, // Slightly smaller font
    fontWeight: 'bold',
    marginRight: 8,
  },
  statusIndicator: {
    width: 9, // Slightly smaller indicator
    height: 9, // Slightly smaller indicator
    borderRadius: 4.5,
  },
  observationBox: {
    backgroundColor: COLORS.observationBg,
    borderRadius: 10,
    padding: IS_LARGE_SCREEN ? 12 : 15, // Reduced padding
    marginTop: 12, // Reduced margin
    borderWidth: 1,
    borderColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  observationText: {
    fontSize: IS_LARGE_SCREEN ? 13 : 15, // Slightly smaller font
    color: COLORS.textDark,
    flex: 1,
    lineHeight: IS_LARGE_SCREEN ? 20 : 23, // Adjusted line height
  },
});