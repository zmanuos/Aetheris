// CombinedEditScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Platform,
} from 'react-native';
import { useRoute } from '@react-navigation/native';

import BackButton from '../../components/shared/BackButton';
import ResidentEditScreen from './ResidentEditScreen';
import FamiliarEditScreen from './FamiliarEditScreen';

// --- COLORES (Consistencia con los demás archivos) ---
const PRIMARY_GREEN = '#6BB240';
const LIGHT_GREEN = '#9CD275';
const ACCENT_GREEN_BACKGROUND = '#EEF7E8';
const DARK_GRAY = '#333';
const MEDIUM_GRAY = '#555';
const LIGHT_GRAY = '#888';
const VERY_LIGHT_GRAY = '#eee';
const BACKGROUND_LIGHT = '#fcfcfc';
const WHITE = '#fff';

const COLORS = {
  primaryGreen: PRIMARY_GREEN,
  lightGreen: LIGHT_GREEN,
  accentGreenBackground: ACCENT_GREEN_BACKGROUND,
  darkGray: DARK_GRAY,
  mediumGray: MEDIUM_GRAY,
  lightGray: LIGHT_GRAY,
  veryLightGray: VERY_LIGHT_GRAY,
  backgroundLight: BACKGROUND_LIGHT,
  white: WHITE,
  errorRed: '#DC3545',
  inputBorder: '#D1D5DB',
  inputBackground: '#F9FAFB',
  darkText: '#1F2937',
  accentBlue: '#3B82F6',
};

const { width } = Dimensions.get('window');
const IS_LARGE_SCREEN = width > 900; // Define si es una pantalla grande (ej. web/tablet horizontal)

export default function CombinedEditScreen({ navigation }) {
  const route = useRoute();
  const { residentId } = route.params || {};

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* El BackButton ya lo tienes importado y lo quieres mantener */}
      <BackButton onPress={() => navigation.goBack()} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContentContainer}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Editar Residente y Familiar</Text>
          <Text style={styles.subtitle}>
            Modifica los datos del residente y, opcionalmente, de su familiar asociado.
          </Text>
        </View>

        {/* Contenedor para los formularios lado a lado en pantallas grandes */}
        <View style={styles.formsWrapper}>
          {residentId ? (
            <ResidentEditScreen residentId={residentId} navigation={navigation} />
          ) : (
            <Text style={styles.errorText}>No se ha proporcionado un ID de residente para editar.</Text>
          )}

          {residentId && (
            <FamiliarEditScreen residentId={residentId} />
          )}
        </View>

        {/* ELIMINADO: Botón "Volver a la Lista de Residentes" */}

      </ScrollView>
    </SafeAreaView>
  );
}

// --- Estilos ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  scrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: IS_LARGE_SCREEN ? 20 : 20, // Reduced padding
    paddingTop: Platform.OS === 'android' ? 60 : 20,
    alignItems: 'center',
  },
  headerContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20, // Reduced margin
  },
  headerTitle: {
    fontSize: IS_LARGE_SCREEN ? 28 : 24, // Slightly smaller font
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: IS_LARGE_SCREEN ? 16 : 15, // Slightly smaller font
    color: COLORS.mediumGray,
    textAlign: 'center',
    lineHeight: IS_LARGE_SCREEN ? 24 : 22,
    maxWidth: 600,
  },
  // Nuevo estilo para el contenedor de los formularios
  formsWrapper: {
    flexDirection: IS_LARGE_SCREEN ? 'row' : 'column', // Lado a lado en pantallas grandes, uno debajo del otro en pequeñas
    flexWrap: 'wrap', // Permite que los elementos se envuelvan si no hay espacio
    justifyContent: IS_LARGE_SCREEN ? 'center' : 'center', // Centrar horizontalmente
    alignItems: IS_LARGE_SCREEN ? 'flex-start' : 'center', // Alinear al inicio verticalmente en fila, centrar en columna
    gap: IS_LARGE_SCREEN ? 20 : 0, // Reduced gap between forms
    width: '100%',
  },
  errorText: {
    color: COLORS.errorRed,
    textAlign: 'center',
    marginTop: 20,
    fontSize: IS_LARGE_SCREEN ? 16 : 14,
  },
});