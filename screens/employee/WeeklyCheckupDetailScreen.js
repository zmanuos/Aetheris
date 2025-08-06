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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Config from '../../config/config';
import { useNotification } from '../../src/context/NotificationContext';
import BackButton from '../../components/shared/BackButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const API_URL = Config.API_BASE_URL;

const { width } = Dimensions.get('window');
const IS_LARGE_SCREEN = width > 900;
const IS_WEB = Platform.OS === 'web'; // <-- Detectar si es web

const COLORS = {
  primary: '#4CAF50',
  accent: '#2196F3',
  background: '#F8F9FA',
  card: '#FFFFFF',
  textDark: '#2C3E50',
  textMedium: '#7F8C8D',
  textLight: '#B0B0B0',
  border: '#E0E0E0',
  shadow: 'rgba(0, 0, 0, 0.10)',
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FFC107',
  info: '#2196F3',
  observationBg: '#E8F5E9',
  rowDivider: '#F0F0F0',

  statusNormal: '#4CAF50',
  statusLow: '#FFC107',
  statusHigh: '#F44336',
  statusUnderweight: '#FFC107',
  statusOverweight: '#FFC107',
  statusObese: '#F44336',
};

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
  return 'high';
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
      return COLORS.textMedium;
  }
};

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

export default function WeeklyCheckupDetailScreen({ route, navigation }) {
  const { checkupId, residentName, residentId: initialResidentId } = route.params;
  console.log('WeeklyCheckupDetailScreen - route.params:', route.params);

  const [checkupDetails, setCheckupDetails] = useState(null);
  const [personalName, setPersonalName] = useState('N/A');
  const [residentPhotoUrl, setResidentPhotoUrl] = useState(null);
  const [residentAge, setResidentAge] = useState('N/A');
  const [residentGender, setResidentGender] = useState('N/A');
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const { showNotification } = useNotification();
  const insets = useSafeAreaInsets();

  const fetchDetails = useCallback(async () => {
    setIsLoading(true);
    setFetchError('');
    try {
      console.log(`Fetching checkup details for ID: ${checkupId}`);
      const checkupResponse = await fetch(`${API_URL}/ChequeoSemanal/id/${checkupId}`);
      if (!checkupResponse.ok) {
        throw new Error(`HTTP error! status: ${checkupResponse.status}`);
      }
      const checkupData = await checkupResponse.json();
      console.log('Checkup details fetched:', checkupData);
      setCheckupDetails(checkupData);

      const idToFetchPhoto = initialResidentId || checkupData.residenteId;

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
              setPersonalName('Administrador');
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
            if (residentData.residente.foto && residentData.residente.foto !== 'nophoto.png') {
              const baseStaticUrl = API_URL.replace('/api', '');
              const photoUrl = `${baseStaticUrl}/images/residents/${residentData.residente.foto}`;
              console.log('Constructed resident photo URL:', photoUrl);
              setResidentPhotoUrl(photoUrl);
            } else {
              console.warn(`No valid photo found for resident ID: ${idToFetchPhoto} or it's 'nophoto.png'.`, residentData);
              setResidentPhotoUrl(null);
            }

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
      {/* Conditionally render BackButton based on platform */}
      {IS_WEB ? ( // Si es web, renderiza el botón sin posicionamiento absoluto
        <View style={styles.backButtonContainerWeb}> {/* Nuevo estilo para web */}
          <BackButton onPress={() => navigation.goBack()} title="Regresar" />
        </View>
      ) : ( // Si es móvil (iOS/Android), usa el posicionamiento absoluto
        <View style={[styles.backButtonContainerMobile, { top: insets.top + 55 }]}> {/* Estilo para móvil */}
          <BackButton onPress={() => navigation.goBack()} title="Regresar" />
        </View>
      )}

      <ScrollView contentContainerStyle={IS_LARGE_SCREEN ? styles.scrollViewContentWeb : styles.scrollViewContent}>
        <View style={[styles.detailCard, IS_LARGE_SCREEN && styles.detailCardWeb]}>

          <View style={IS_LARGE_SCREEN ? styles.headerContainer : styles.headerContainerMobile}>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.screenTitle}>Detalles de la consulta</Text>
            </View>
            <View style={IS_LARGE_SCREEN ? styles.dateTimePersonalContainer : styles.dateTimePersonalContainerMobile}>
              <Text style={styles.checkupDateTime}>Fecha de consulta: {formattedDate}</Text>
              <Text style={styles.performedBy}>
                <Text style={styles.performedByLabel}>Realizada por: </Text>
                <Text style={styles.highlightedPersonalName}>{personalName}</Text>
              </Text>
            </View>
          </View>
          
          <View style={styles.sectionDivider} />

          <View style={IS_LARGE_SCREEN ? styles.residentDataContainer : styles.residentDataContainerMobile}>
            {residentPhotoUrl ? (
              <Image source={{ uri: residentPhotoUrl }} style={styles.residentPhoto} />
            ) : (
              <View style={styles.residentPhotoPlaceholder}>
                <Ionicons name="person-circle-outline" size={IS_LARGE_SCREEN ? 90 : 120} color={COLORS.textLight} />
              </View>
            )}
            <View style={IS_LARGE_SCREEN ? styles.residentInfoBlock : styles.residentInfoBlockMobile}>
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

          <Text style={styles.sectionTitle}>Observaciones de la consulta</Text>
          <View style={styles.observationBox}>
            <Text style={styles.observationText}>
              {checkupDetails.observaciones || 'No hay observaciones para este chequeo.'}
            </Text>
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
  // Estilo para el botón en móviles (con posicionamiento absoluto)
  backButtonContainerMobile: {
    position: 'absolute',
    left: 15,
    zIndex: 10,
    // El 'top' se establece dinámicamente en el componente
  },
  // Nuevo estilo para el botón en web (sin posicionamiento absoluto, se deja en el flujo del documento)
  backButtonContainerWeb: {
    position: 'relative', // O 'static'
    alignSelf: 'flex-start', // Alinearlo a la izquierda
    marginLeft: 15, // Un poco de margen para que no esté pegado al borde
    marginTop: 10, // Un poco de margen superior
    marginBottom: 20, // Espacio antes del contenido principal
    zIndex: 10,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 15,
    paddingTop: 120, // Ajustado para móvil para no cubrir el botón
  },
  scrollViewContentWeb: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 15,
    paddingTop: 20, // Menos padding en web ya que el botón no es absoluto
  },
  detailCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: IS_LARGE_SCREEN ? 20 : 15,
    width: '100%',
    maxWidth: IS_LARGE_SCREEN ? 650 : '95%',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  detailCardWeb: {
    paddingTop: IS_LARGE_SCREEN ? 20 : 15,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
    marginTop: 5,
  },
  headerContainerMobile: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 5,
  },
  dateTimePersonalContainer: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  dateTimePersonalContainerMobile: {
    alignItems: 'center',
    marginTop: 10,
    width: '100%',
  },
  screenTitle: {
    fontSize: IS_LARGE_SCREEN ? 24 : 28,
    fontWeight: '700',
    color: COLORS.textDark,
    marginTop: 0,
    textAlign: IS_LARGE_SCREEN ? 'left' : 'center',
    width: '100%',
  },
  checkupDateTime: {
    fontSize: IS_LARGE_SCREEN ? 13 : 16,
    fontWeight: 'bold',
    color: COLORS.textDark,
    textAlign: IS_LARGE_SCREEN ? 'right' : 'center',
    marginBottom: 3,
  },
  performedBy: {
    fontSize: IS_LARGE_SCREEN ? 12 : 15,
    color: COLORS.textMedium,
    textAlign: IS_LARGE_SCREEN ? 'right' : 'center',
  },
  performedByLabel: {
    fontWeight: 'bold',
  },
  highlightedPersonalName: {
    fontWeight: 'bold',
    fontSize: IS_LARGE_SCREEN ? 14 : 17,
    color: COLORS.textDark,
  },
  residentDataContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 20,
  },
  residentDataContainerMobile: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 20,
    gap: 15,
  },
  residentPhoto: {
    width: IS_LARGE_SCREEN ? 120 : 150,
    height: IS_LARGE_SCREEN ? 120 : 150,
    borderRadius: IS_LARGE_SCREEN ? 60 : 75,
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  residentPhotoPlaceholder: {
    width: IS_LARGE_SCREEN ? 120 : 150,
    height: IS_LARGE_SCREEN ? 120 : 150,
    borderRadius: IS_LARGE_SCREEN ? 60 : 75,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.textLight,
  },
  residentInfoBlock: {
    flex: 1,
    alignItems: 'flex-start',
  },
  residentInfoBlockMobile: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
  },
  residentNameHeader: {
    fontSize: IS_LARGE_SCREEN ? 19 : 24,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 8,
    textAlign: 'center',
    width: '100%',
  },
  residentDetailsGrid: {
    width: '100%',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: IS_LARGE_SCREEN ? 8 : 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.rowDivider,
  },
  detailIcon: {
    marginRight: IS_LARGE_SCREEN ? 12 : 20,
    width: IS_LARGE_SCREEN ? 22 : 28,
    textAlign: 'center',
  },
  detailLabel: {
    fontSize: IS_LARGE_SCREEN ? 14 : 17,
    fontWeight: '600',
    color: COLORS.textMedium,
    width: IS_LARGE_SCREEN ? 'auto' : 120,
    marginRight: IS_LARGE_SCREEN ? 0 : 10,
  },
  valueWithStatus: {
    flex: IS_LARGE_SCREEN ? 1.3 : 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  detailValue: {
    fontSize: IS_LARGE_SCREEN ? 14 : 17,
    fontWeight: 'bold',
    marginRight: 8,
    textAlign: 'right',
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  sectionDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: IS_LARGE_SCREEN ? 17 : 20,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 10,
    textAlign: 'left',
  },
  checklistSection: {
    borderWidth: 1,
    borderColor: COLORS.rowDivider,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: COLORS.card,
  },
  observationBox: {
    backgroundColor: COLORS.observationBg,
    borderRadius: 10,
    padding: IS_LARGE_SCREEN ? 12 : 18,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  observationText: {
    fontSize: IS_LARGE_SCREEN ? 13 : 16,
    color: COLORS.textDark,
    flex: 1,
    lineHeight: IS_LARGE_SCREEN ? 20 : 24,
  },
});