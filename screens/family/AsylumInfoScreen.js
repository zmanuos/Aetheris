// AETHERIS/screens/family/AsylumInfoScreen.js
import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Platform, // Import Platform
  Image,
  Dimensions,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import Config from '../../config/config';
const API_URL = Config.API_BASE_URL;

import Notification from '../../components/shared/Notification';

const PRIMARY_GREEN = '#6BB240';
const MEDIUM_GRAY = '#8E8E93';
const DARK_GRAY = '#1C1C1E';
const LIGHT_GRAY = '#C7C7CC';
const VERY_LIGHT_GRAY = '#F2F2F7';
const BACKGROUND_LIGHT = '#FFFFFF';
const WHITE = '#FFFFFF';
const LIGHT_ACCENT_GREEN = '#E9F5E3';

const { width } = Dimensions.get('window');
const IS_LARGE_SCREEN = width > 900;

export default function AsylumInfoScreen() {
  const [asylumData, setAsylumData] = useState({
    nombre: '',
    direccion: '',
    pais: '',
    ciudad: '',
    codigo_postal: '',
    telefono: '',
    correo: '',
  });

  const [isLoading, setIsLoading] = useState(true);

  const notificationRef = useRef();

  const fetchAsylumData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/Asilo`);
      const data = await response.json();

      if (response.ok && data.status === 0 && data.asilo) {
        const fetchedData = {
          nombre: data.asilo.nombre || 'N/A',
          direccion: data.asilo.direccion || 'N/A',
          pais: data.asilo.pais || 'N/A',
          ciudad: data.asilo.ciudad || 'N/A',
          codigo_postal: data.asilo.codigo_postal || 'N/A',
          telefono: data.asilo.telefono || 'N/A',
          correo: data.asilo.correo || 'N/A',
        };
        setAsylumData(fetchedData);
      } else {
        const errorMessage = data.message || `No se pudieron cargar los datos del asilo. Código de estado: ${data.status || 'desconocido'}`;
        notificationRef.current.show(`Error: ${errorMessage}`, 'error');
        setAsylumData({
          nombre: 'N/A',
          direccion: 'N/A',
          pais: 'N/A',
          ciudad: 'N/A',
          codigo_postal: 'N/A',
          telefono: 'N/A',
          correo: 'N/A',
        });
      }
    } catch (error) {
      notificationRef.current.show('Error de Conexión: No se pudo conectar con el servidor.', 'error', 5000);
      setAsylumData({
        nombre: 'N/A',
        direccion: 'N/A',
        pais: 'N/A',
        ciudad: 'N/A',
        codigo_postal: 'N/A',
        telefono: 'N/A',
        correo: 'N/A',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAsylumData();
    }, [fetchAsylumData])
  );

  const handleCall = useCallback(async () => {
    // Only allow calling on native platforms
    if (Platform.OS !== 'web') {
      const phoneNumber = asylumData.telefono.replace(/\s/g, '');
      if (phoneNumber && phoneNumber !== 'N/A') {
        const url = `tel:${phoneNumber}`;
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          notificationRef.current.show(`No se puede abrir el marcador para ${asylumData.telefono}`, 'error');
        }
      } else {
        notificationRef.current.show('Número de teléfono no disponible.', 'warning');
      }
    }
  }, [asylumData.telefono]);

  const handleEmail = useCallback(async () => {
    // Only allow emailing on native platforms
    if (Platform.OS !== 'web') {
      const emailAddress = asylumData.correo.trim();
      if (emailAddress && emailAddress !== 'N/A') {
        const url = `mailto:${emailAddress}`;
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          notificationRef.current.show(`No se puede abrir el cliente de correo para ${asylumData.correo}`, 'error');
        }
      } else {
        notificationRef.current.show('Dirección de correo electrónico no disponible.', 'warning');
      }
    }
  }, [asylumData.correo]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.card}>
          <Image
            source={require('../../assets/images/arbol2.png')}
            style={styles.logoImage}
          />
          <Text style={styles.sectionTitle}>Información del Asilo</Text>

          {isLoading ? (
            <ActivityIndicator size="large" color={PRIMARY_GREEN} style={styles.loader} />
          ) : (
            <View style={styles.dataContainer}>
              <View style={styles.infoRow}>
                <Ionicons name="business-outline" size={20} color={PRIMARY_GREEN} />
                <View style={styles.textColumn}>
                  <Text style={styles.label}>Nombre</Text>
                  <Text style={styles.value}>{asylumData.nombre}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={20} color={PRIMARY_GREEN} />
                <View style={styles.textColumn}>
                  <Text style={styles.label}>Dirección</Text>
                  <Text style={styles.value}>{asylumData.direccion}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="map-outline" size={20} color={PRIMARY_GREEN} />
                <View style={styles.textColumn}>
                  <Text style={styles.label}>Ciudad, País, C.P.</Text>
                  <Text style={styles.value}>
                    {asylumData.ciudad}, {asylumData.pais}, {asylumData.codigo_postal}
                  </Text>
                </View>
              </View>

              {/* Teléfono - Conditional interactivity based on platform */}
              {Platform.OS !== 'web' && asylumData.telefono !== 'N/A' ? (
                <TouchableOpacity
                  onPress={handleCall}
                  style={[styles.infoRow, styles.clickableInfoRow]}
                >
                  <Ionicons name="call-outline" size={20} color={PRIMARY_GREEN} />
                  <View style={styles.textColumn}>
                    <Text style={styles.label}>Teléfono</Text>
                    <Text style={styles.value}>{asylumData.telefono}</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={styles.infoRow}>
                  <Ionicons name="call-outline" size={20} color={PRIMARY_GREEN} />
                  <View style={styles.textColumn}>
                    <Text style={styles.label}>Teléfono</Text>
                    <Text style={styles.value}>{asylumData.telefono}</Text>
                  </View>
                </View>
              )}

              {/* Correo Electrónico - Conditional interactivity based on platform */}
              {Platform.OS !== 'web' && asylumData.correo !== 'N/A' ? (
                <TouchableOpacity
                  onPress={handleEmail}
                  style={[styles.infoRow, styles.clickableInfoRow]}
                >
                  <Ionicons name="mail-outline" size={20} color={PRIMARY_GREEN} />
                  <View style={styles.textColumn}>
                    <Text style={styles.label}>Correo Electrónico</Text>
                    <Text style={styles.value}>{asylumData.correo}</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={styles.infoRow}>
                  <Ionicons name="mail-outline" size={20} color={PRIMARY_GREEN} />
                  <View style={styles.textColumn}>
                    <Text style={styles.label}>Correo Electrónico</Text>
                    <Text style={styles.value}>{asylumData.correo}</Text>
                  </View>
                </View>
              )}

            </View>
          )}
        </View>
      </ScrollView>
      <Notification ref={notificationRef} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BACKGROUND_LIGHT,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  card: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 450,
    shadowColor: DARK_GRAY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: VERY_LIGHT_GRAY,
    alignItems: 'center',
  },
  logoImage: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: DARK_GRAY,
    marginBottom: 25,
    textAlign: 'center',
    width: '100%',
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: LIGHT_GRAY,
  },
  loader: {
    marginTop: 50,
    marginBottom: 50,
  },
  dataContainer: {
    width: '100%',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: VERY_LIGHT_GRAY,
    borderRadius: 8,
    borderLeftWidth: 2,
    borderLeftColor: PRIMARY_GREEN,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 1,
    elevation: 0.5,
  },
  textColumn: {
    marginLeft: 15,
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: MEDIUM_GRAY,
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 16,
    color: DARK_GRAY,
    fontWeight: '500',
  },
  clickableInfoRow: {
    // These styles apply only when clickable (i.e., not on web or when data is N/A)
    backgroundColor: LIGHT_ACCENT_GREEN,
    borderWidth: 1,
    borderColor: PRIMARY_GREEN,
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  // We no longer need disabledClickableRow because we're using conditional rendering
  // based on Platform.OS and asylumData values directly in the JSX.
});