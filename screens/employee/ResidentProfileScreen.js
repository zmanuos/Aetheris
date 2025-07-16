// screens/employee/ResidentProfileScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Image,
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

export default function ResidentProfileScreen({ route, navigation }) {
  const { residentId } = route.params;
  const [resident, setResident] = useState(null);
  const [familiar, setFamiliar] = useState(null);
  const [familiarEmail, setFamiliarEmail] = useState(null);
  const [observation, setObservation] = useState(null);
  const [note, setNote] = useState(null); // <-- NUEVO ESTADO PARA LA NOTA
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const { showNotification } = useNotification();

  const fetchResidentDetails = useCallback(async () => {
    setIsLoading(true);
    setFetchError('');
    try {
      // 1. Fetch resident general data
      const residentResponse = await fetch(`${API_URL}/Residente/${residentId}`);
      if (!residentResponse.ok) {
        throw new Error(`HTTP error! status: ${residentResponse.status}`);
      }
      const apiResidentData = await residentResponse.json();
      const residentData = apiResidentData.residente;

      if (!residentData) {
        setFetchError('No se encontró información para este residente.');
        showNotification('No se encontró información para este residente.', 'error');
        return;
      }

      const baseStaticUrl = API_URL.replace('/api', '');

      // Fetch heart rate data (similar to ResidentsScreen, but for single resident)
      let heartRateHistory = [];
      let latestHeartRate = null;
      try {
        const heartRateResponse = await fetch(`${API_URL}/LecturaResidente/${residentId}`);
        if (heartRateResponse.ok) {
          const heartRateData = await heartRateResponse.json();
          if (Array.isArray(heartRateData) && heartRateData.length > 0) {
            const sortedData = heartRateData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            heartRateHistory = sortedData.map(record => record.ritmoCardiaco);
            if (sortedData.length > 0) {
              latestHeartRate = sortedData[0].ritmoCardiaco;
            }
          }
        } else {
          console.warn(`No se pudo obtener la frecuencia cardíaca para el residente ${residentId}: ${heartRateResponse.statusText}`);
        }
      } catch (error) {
        console.error(`Error al obtener la frecuencia cardíaca para el residente ${residentId}:`, error);
      }

      setResident({
        ...residentData,
        foto_url: residentData.foto && residentData.foto !== 'nophoto.png' ? `${baseStaticUrl}/images/residents/${residentData.foto}` : null,
        historial_frecuencia_cardiaca: heartRateHistory,
        ultima_frecuencia_cardiaca: latestHeartRate,
      });

      // Fetch familiar data and email in parallel with observation and note
      let fetchedFamiliarData = null;
      let fetchedObservationData = null;
      let fetchedNoteData = null; // Variable para almacenar la nota

      try {
        // Fetch familiar data using residentId
        const familiarResponse = await fetch(`${API_URL}/Familiar/${residentData.id_residente}`);
        if (!familiarResponse.ok) {
          console.warn(`No se pudo obtener datos del familiar para el residente ${residentData.id_residente}: ${familiarResponse.statusText}`);
        } else {
          const apiFamiliarData = await familiarResponse.json();
          fetchedFamiliarData = apiFamiliarData.familiar;

          if (fetchedFamiliarData) {
            setFamiliar(fetchedFamiliarData);

            // Fetch familiar email using firebase_uid
            if (fetchedFamiliarData.firebase_uid) {
              try {
                const emailResponse = await fetch(`${API_URL}/Personal/manage/get-correo/${fetchedFamiliarData.firebase_uid}`);
                if (!emailResponse.ok) {
                  console.warn(`No se pudo obtener el correo del familiar ${fetchedFamiliarData.nombre}: ${emailResponse.statusText}`);
                  setFamiliarEmail(null);
                } else {
                  const emailData = await emailResponse.json();
                  if (emailData && emailData.email) {
                    setFamiliarEmail(emailData.email);
                  } else {
                    console.warn(`Correo no encontrado en la respuesta para el familiar ${fetchedFamiliarData.nombre}`);
                    setFamiliarEmail(null);
                  }
                }
              } catch (emailError) {
                console.error(`Error al obtener el correo del familiar ${fetchedFamiliarData.nombre}:`, emailError);
                setFamiliarEmail(null);
              }
            } else {
              console.warn(`firebase_uid no encontrado para el familiar del residente ${residentData.id_residente}`);
              setFamiliarEmail(null);
            }

            // Fetch note data using familiar.id (as per API spec)
            if (fetchedFamiliarData.id) { // Ensure familiar ID exists before fetching note
              try {
                const noteResponse = await fetch(`${API_URL}/Nota/${fetchedFamiliarData.id}`);
                if (!noteResponse.ok) {
                  console.warn(`No se pudo obtener la nota para el familiar ${fetchedFamiliarData.id}: ${noteResponse.statusText}`);
                } else {
                  const apiNoteData = await noteResponse.json();
                  fetchedNoteData = apiNoteData.nota;

                  if (fetchedNoteData) {
                    setNote(fetchedNoteData);
                  } else {
                    console.warn(`Nota no encontrada en la respuesta para el familiar ${fetchedFamiliarData.id}`);
                    setNote(null);
                  }
                }
              } catch (noteError) {
                console.error(`Error al obtener la nota para el familiar ${fetchedFamiliarData.id}:`, noteError);
                setNote(null);
              }
            } else {
              console.warn(`ID de familiar no encontrado para obtener la nota.`);
              setNote(null);
            }

          } else {
            console.warn(`Datos de familiar no encontrados en la respuesta para el residente ${residentData.id_residente}`);
            setFamiliar(null);
            setFamiliarEmail(null);
            setNote(null); // Reset note if no familiar
          }
        }
      } catch (familiarError) {
        console.error(`Error al obtener datos del familiar para el residente ${residentData.id_residente}:`, familiarError);
        setFamiliar(null);
        setFamiliarEmail(null);
        setNote(null); // Reset note if familiar fetch fails
      }

      // Fetch observation data using residentId
      try {
        const observationResponse = await fetch(`${API_URL}/Observacion/${residentData.id_residente}`);
        if (!observationResponse.ok) {
          console.warn(`No se pudo obtener la observación para el residente ${residentData.id_residente}: ${observationResponse.statusText}`);
        } else {
          const apiObservationData = await observationResponse.json();
          fetchedObservationData = apiObservationData.observacion;

          if (fetchedObservationData) {
            setObservation(fetchedObservationData);
          } else {
            console.warn(`Observación no encontrada en la respuesta para el residente ${residentData.id_residente}`);
            setObservation(null);
          }
        }
      } catch (observationError) {
        console.error(`Error al obtener la observación para el residente ${residentData.id_residente}:`, observationError);
        setObservation(null);
      }


    } catch (error) {
      console.error('Error general al cargar el perfil:', error);
      setFetchError(`Error general al cargar el perfil: ${error.message}`);
      showNotification(`Error general al cargar el perfil: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [residentId, showNotification]);

  useEffect(() => {
    fetchResidentDetails();
  }, [fetchResidentDetails]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6BB240" />
          <Text style={styles.loadingText}>Cargando perfil del residente, familiar, observaciones y notas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (fetchError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={30} color="#DC3545" />
          <Text style={styles.errorText}>{fetchError}</Text>
          <Text style={styles.errorText}>ID del Residente: {residentId}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!resident) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Ionicons name="information-circle-outline" size={30} color="#007BFF" />
          <Text style={styles.errorText}>No se pudo cargar el perfil del residente.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <BackButton onPress={() => navigation.goBack()} title="Volver" />

        <View style={styles.profileCard}>
          <View style={styles.header}>
            {resident.foto_url ? (
              <Image source={{ uri: resident.foto_url }} style={styles.profileImage} />
            ) : (
              <View style={styles.noProfileImage}>
                <Ionicons name="person" size={70} color="#ccc" />
              </View>
            )}
            <Text style={styles.residentName}>{resident.nombre} {resident.apellido}</Text>
            <Text style={styles.residentId}>ID: {resident.id_residente}</Text>
          </View>

          <View style={styles.detailsContainer}>
            <Text style={styles.sectionTitle}>Datos del Residente</Text>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={20} color="#555" style={styles.detailIcon} />
              <Text style={styles.detailLabel}>Fecha de Nacimiento:</Text>
              <Text style={styles.detailValue}>{resident.fecha_nacimiento ? new Date(resident.fecha_nacimiento).toLocaleDateString() : 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="call-outline" size={20} color="#555" style={styles.detailIcon} />
              <Text style={styles.detailLabel}>Teléfono:</Text>
              <Text style={styles.detailValue}>{resident.telefono || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="male-female-outline" size={20} color="#555" style={styles.detailIcon} />
              <Text style={styles.detailLabel}>Género:</Text>
              <Text style={styles.detailValue}>{resident.genero || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={20} color="#555" style={styles.detailIcon} />
              <Text style={styles.detailLabel}>Dirección:</Text>
              <Text style={styles.detailValue}>{resident.direccion || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="fitness-outline" size={20} color="#555" style={styles.detailIcon} />
              <Text style={styles.detailLabel}>Condición Física:</Text>
              <Text style={styles.detailValue}>{resident.condicion_fisica || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="pulse-outline" size={20} color="#555" style={styles.detailIcon} />
              <Text style={styles.detailLabel}>Última Frecuencia Cardíaca:</Text>
              <Text style={styles.detailValue}>{resident.ultima_frecuencia_cardiaca ? `${resident.ultima_frecuencia_cardiaca} bpm` : 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="bed-outline" size={20} color="#555" style={styles.detailIcon} />
              <Text style={styles.detailValue}>{resident.nombre_area || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="accessibility-outline" size={20} color="#555" style={styles.detailIcon} />
              <Text style={styles.detailLabel}>Tipo de Discapacidad:</Text>
              <Text style={styles.detailValue}>{resident.tipo_discapacidad || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="medical-outline" size={20} color="#555" style={styles.detailIcon} />
              <Text style={styles.detailLabel}>Condiciones Médicas:</Text>
              <Text style={styles.detailValue}>{resident.condiciones_medicas || 'N/A'}</Text>
            </View>
              <View style={styles.detailRow}>
              <Ionicons name="calendar-number-outline" size={20} color="#555" style={styles.detailIcon} />
              <Text style={styles.detailLabel}>Fecha de Ingreso:</Text>
              <Text style={styles.detailValue}>{resident.fecha_ingreso ? new Date(resident.fecha_ingreso).toLocaleDateString() : 'N/A'}</Text>
            </View>
          </View>

          {/* Sección de Observaciones del Residente */}
          {observation && (
            <View style={styles.detailsContainer}>
              <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Observaciones del Residente</Text>
              <View style={styles.observationBox}>
                <Ionicons name="information-circle-outline" size={20} color="#555" style={styles.detailIcon} />
                <Text style={styles.observationText}>{observation.observacion || 'No hay observaciones registradas.'}</Text>
              </View>
            </View>
          )}

          {/* Sección de datos del Familiar */}
          {familiar && (
            <View style={styles.detailsContainer}>
              <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Datos del Contacto de Emergencia</Text>
              <View style={styles.detailRow}>
                <Ionicons name="person-outline" size={20} color="#555" style={styles.detailIcon} />
                <Text style={styles.detailLabel}>Nombre:</Text>
                <Text style={styles.detailValue}>{familiar.nombre} {familiar.apellido}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="call-outline" size={20} color="#555" style={styles.detailIcon} />
                <Text style={styles.detailLabel}>Teléfono:</Text>
                <Text style={styles.detailValue}>{familiar.telefono || 'N/A'}</Text>
              </View>
              {familiarEmail && (
                <View style={styles.detailRow}>
                  <Ionicons name="mail-outline" size={20} color="#555" style={styles.detailIcon} />
                  <Text style={styles.detailLabel}>Correo Electrónico:</Text>
                  <Text style={styles.detailValue}>{familiarEmail}</Text>
                </View>
              )}
              <View style={styles.detailRow}>
                <Ionicons name="people-outline" size={20} color="#555" style={styles.detailIcon} />
                <Text style={styles.detailLabel}>Parentesco:</Text>
                <Text style={styles.detailValue}>{familiar.parentesco ? familiar.parentesco.nombre : 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={20} color="#555" style={styles.detailIcon} />
                <Text style={styles.detailLabel}>Fecha de Nacimiento:</Text>
                <Text style={styles.detailValue}>{familiar.fecha_nacimiento ? new Date(familiar.fecha_nacimiento).toLocaleDateString() : 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="male-female-outline" size={20} color="#555" style={styles.detailIcon} />
                <Text style={styles.detailLabel}>Género:</Text>
                <Text style={styles.detailValue}>{familiar.genero || 'N/A'}</Text>
              </View>
            </View>
          )}

          {/* Sección de Notas del Residente (asociadas al familiar) */}
          {note && (
            <View style={styles.detailsContainer}>
              <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Notas del Contacto de Emergencia</Text>
              <View style={styles.observationBox}> {/* Reutilizamos observationBox para el estilo */}
                <Ionicons name="document-text-outline" size={20} color="#555" style={styles.detailIcon} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.observationText}>{note.nota || 'No hay notas registradas.'}</Text>
                  {note.fecha && (
                    <Text style={styles.noteDate}>Fecha: {new Date(note.fecha).toLocaleDateString()} {new Date(note.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                  )}
                </View>
              </View>
            </View>
          )}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f0f2f5',
  },
  errorText: {
    color: '#DC3545',
    textAlign: 'center',
    marginTop: 10,
    fontSize: 16,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: IS_LARGE_SCREEN ? 700 : '95%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 25,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e0e0e0',
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#6BB240',
  },
  noProfileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e0e0e0',
    marginBottom: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ccc',
  },
  residentName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  residentId: {
    fontSize: 16,
    color: '#777',
    marginBottom: 15,
  },
  detailsContainer: {
    width: '100%',
    paddingHorizontal: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailIcon: {
    marginRight: 10,
    width: 24,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  observationBox: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  observationText: {
    fontSize: 15,
    color: '#444',
    flex: 1,
  },
  noteDate: { // <-- NUEVO ESTILO PARA LA FECHA DE LA NOTA
    fontSize: 13,
    color: '#777',
    marginTop: 5,
    fontStyle: 'italic',
  },
});