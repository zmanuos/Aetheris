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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Config from '../../config/config';
import { useNotification } from '../../src/context/NotificationContext';
import BackButton from '../../components/shared/BackButton';

const API_URL = Config.API_BASE_URL;
const { width } = Dimensions.get('window');
const IS_LARGE_SCREEN = width > 900;

const COLORS = {
  primaryGreen: '#6BB240',
  lightGreenAccent: '#EAF7E3',
  darkText: '#2C3E50',
  lightText: '#7F8C8D',
  accentBlue: '#3498DB',
  cardBackground: '#FFFFFF',
  pageBackground: '#F5F7FA',
  borderLight: '#E0E0E0',
  errorRed: '#DC3545',
  noteBackground: '#DCF8C6',
  noNoteText: '#A0A0A0',
};

export default function WeeklyCheckupDetailScreen({ route, navigation }) {
  const { checkupId, residentName } = route.params;
  const [checkupDetails, setCheckupDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const { showNotification } = useNotification();

  const fetchCheckupDetails = useCallback(async () => {
    setIsLoading(true);
    setFetchError('');
    try {
      const response = await fetch(`${API_URL}/ChequeoSemanal/id/${checkupId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setCheckupDetails(data);
    } catch (error) {
      console.error('Error fetching checkup details:', error);
      setFetchError(`Error al cargar los detalles del chequeo: ${error.message}`);
      showNotification(`Error al cargar los detalles del chequeo: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [checkupId, showNotification]);

  useEffect(() => {
    fetchCheckupDetails();
  }, [fetchCheckupDetails]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primaryGreen} />
          <Text style={styles.loadingText}>Cargando detalles del chequeo semanal...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (fetchError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={30} color={COLORS.errorRed} />
          <Text style={styles.errorText}>{fetchError}</Text>
          <Text style={styles.errorText}>ID del Chequeo: {checkupId}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!checkupDetails) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Ionicons name="information-circle-outline" size={30} color={COLORS.accentBlue} />
          <Text style={styles.errorText}>No se pudieron cargar los detalles del chequeo.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const DetailRow = ({ iconName, label, value }) => (
    <View style={styles.detailRow}>
      <Ionicons name={iconName} size={IS_LARGE_SCREEN ? 16 : 20} color={COLORS.accentBlue} style={styles.detailIcon} />
      <Text style={styles.detailLabel}>{label}:</Text>
      <Text style={styles.detailValue}>{value || 'N/A'}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backButtonContainer}>
        <BackButton onPress={() => navigation.goBack()} title="Volver al Perfil" />
      </View>

      <ScrollView contentContainerStyle={IS_LARGE_SCREEN ? styles.scrollViewContentWeb : styles.scrollViewContent}>
        <View style={[styles.detailCard, IS_LARGE_SCREEN && styles.detailCardWeb]}>
          <Text style={styles.screenTitle}>Detalles del Chequeo Semanal</Text>
          <Text style={styles.residentInfo}>Residente: {residentName || 'N/A'}</Text>
          <Text style={styles.checkupDate}>Fecha del Chequeo: {checkupDetails.fechaChequeo ? new Date(checkupDetails.fechaChequeo).toLocaleDateString() : 'N/A'}</Text>

          <View style={styles.sectionDivider} />

          <Text style={styles.sectionTitle}>Signos Vitales y Medidas</Text>
          <DetailRow iconName="water-outline" label="SpO2" value={checkupDetails.spo2 !== undefined && checkupDetails.spo2 !== null ? `${checkupDetails.spo2}%` : 'N/A'} />
          <DetailRow iconName="heart-outline" label="Pulso" value={checkupDetails.pulso !== undefined && checkupDetails.pulso !== null ? `${checkupDetails.pulso} bpm` : 'N/A'} />
          <DetailRow iconName="thermometer-outline" label="Temperatura Corporal" value={checkupDetails.temperaturaCorporal !== undefined && checkupDetails.temperaturaCorporal !== null ? `${checkupDetails.temperaturaCorporal}°C` : 'N/A'} />
          <DetailRow iconName="barbell-outline" label="Peso" value={checkupDetails.peso !== undefined && checkupDetails.peso !== null ? `${checkupDetails.peso} kg` : 'N/A'} />
          <DetailRow iconName="resize-outline" label="Altura" value={checkupDetails.altura !== undefined && checkupDetails.altura !== null ? `${checkupDetails.altura} m` : 'N/A'} />
          <DetailRow iconName="body-outline" label="IMC" value={checkupDetails.imc !== undefined && checkupDetails.imc !== null ? checkupDetails.imc.toFixed(1) : 'N/A'} />

          <View style={styles.sectionDivider} />

          <Text style={styles.sectionTitle}>Información Adicional</Text>
          <DetailRow iconName="person-outline" label="ID del Personal" value={checkupDetails.personalId || 'N/A'} />
          <DetailRow iconName="hardware-chip-outline" label="Dispositivo SpO2" value={checkupDetails.dispositivoSpO2 || 'N/A'} />
          <DetailRow iconName="hardware-chip-outline" label="Dispositivo Temp. Corporal" value={checkupDetails.dispositivoTempCorp || 'N/A'} />
          <DetailRow iconName="hardware-chip-outline" label="Dispositivo Peso" value={checkupDetails.dispositivoPeso || 'N/A'} />
          <DetailRow iconName="hardware-chip-outline" label="Dispositivo Altura" value={checkupDetails.dispositivoAltura || 'N/A'} />

          <View style={styles.sectionDivider} />

          <Text style={styles.sectionTitle}>Observaciones</Text>
          <View style={styles.observationBox}>
            <Ionicons name="document-text-outline" size={IS_LARGE_SCREEN ? 16 : 20} color={COLORS.darkText} style={styles.detailIcon} />
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
    backgroundColor: COLORS.pageBackground,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.pageBackground,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.lightText,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.pageBackground,
  },
  errorText: {
    color: COLORS.errorRed,
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
    paddingVertical: 20,
    paddingHorizontal: 15,
    paddingTop: 60,
  },
  scrollViewContentWeb: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 15,
    paddingTop: 20,
  },
  detailCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 15,
    padding: 20,
    width: '100%',
    maxWidth: IS_LARGE_SCREEN ? 700 : '95%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
    paddingTop: 60,
  },
  detailCardWeb: {
    paddingTop: 20,
  },
  screenTitle: {
    fontSize: IS_LARGE_SCREEN ? 24 : 28,
    fontWeight: 'bold',
    color: COLORS.darkText,
    marginBottom: 5,
    textAlign: 'center',
  },
  residentInfo: {
    fontSize: IS_LARGE_SCREEN ? 16 : 18,
    color: COLORS.accentBlue,
    marginBottom: 5,
    textAlign: 'center',
    fontWeight: '600',
  },
  checkupDate: {
    fontSize: IS_LARGE_SCREEN ? 14 : 16,
    color: COLORS.lightText,
    marginBottom: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  sectionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: IS_LARGE_SCREEN ? 18 : 20,
    fontWeight: 'bold',
    color: COLORS.darkText,
    marginBottom: 12,
    textAlign: 'left',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: IS_LARGE_SCREEN ? 8 : 12,
    paddingBottom: IS_LARGE_SCREEN ? 6 : 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.borderLight,
  },
  detailIcon: {
    marginRight: IS_LARGE_SCREEN ? 10 : 12,
    width: IS_LARGE_SCREEN ? 20 : 24,
    textAlign: 'center',
  },
  detailLabel: {
    fontSize: IS_LARGE_SCREEN ? 15 : 17,
    fontWeight: '600',
    color: COLORS.lightText,
    flex: IS_LARGE_SCREEN ? 0.7 : 1,
  },
  detailValue: {
    fontSize: IS_LARGE_SCREEN ? 15 : 17,
    color: COLORS.darkText,
    flex: IS_LARGE_SCREEN ? 1.3 : 2,
    textAlign: 'left',
  },
  observationBox: {
    backgroundColor: COLORS.lightGreenAccent,
    borderRadius: 10,
    padding: IS_LARGE_SCREEN ? 12 : 18,
    marginTop: IS_LARGE_SCREEN ? 15 : 15,
    borderWidth: 1,
    borderColor: COLORS.primaryGreen,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  observationText: {
    fontSize: IS_LARGE_SCREEN ? 14 : 15,
    color: COLORS.darkText,
    flex: 1,
  },
});
