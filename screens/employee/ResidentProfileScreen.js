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
  Pressable,
  Picker,
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

export default function ResidentProfileScreen({ route, navigation }) {
  const { residentId } = route.params;
  const [resident, setResident] = useState(null);
  const [familiar, setFamiliar] = useState(null);
  const [familiarEmail, setFamiliarEmail] = useState(null);
  const [observation, setObservation] = useState(null);
  const [note, setNote] = useState(null);
  const [weeklyCheckups, setWeeklyCheckups] = useState([]);
  const [selectedCheckupId, setSelectedCheckupId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const { showNotification } = useNotification();

  const fetchResidentDetails = useCallback(async () => {
    setIsLoading(true);
    setFetchError('');
    try {
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
        foto_url: residentData.foto && residentData.foto !== 'default' ? `${baseStaticUrl}/images/residents/${residentData.foto}` : null,
        historial_frecuencia_cardiaca: heartRateHistory,
        ultima_frecuencia_cardiaca: latestHeartRate,
      });

      let fetchedFamiliarData = null;
      let fetchedObservationData = null;
      let fetchedNoteData = null;
      let fetchedWeeklyCheckups = [];

      try {
        const familiarResponse = await fetch(`${API_URL}/Familiar/${residentData.id_residente}`);
        if (!familiarResponse.ok) {
          console.warn(`No se pudo obtener datos del familiar para el residente ${residentData.id_residente}: ${familiarResponse.statusText}`);
        } else {
          const apiFamiliarData = await familiarResponse.json();
          fetchedFamiliarData = apiFamiliarData.familiar;

          if (fetchedFamiliarData) {
            setFamiliar(fetchedFamiliarData);

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

            if (fetchedFamiliarData.id) {
              try {
                const noteResponse = await fetch(`${API_URL}/Nota/${fetchedFamiliarData.id}`);
                if (!noteResponse.ok) {
                  console.warn(`No se pudo obtener la nota para el familiar ${fetchedFamiliarData.id}: ${noteResponse.statusText}`);
                } else {
                  const apiNoteData = await noteResponse.json();
                  fetchedNoteData = apiNoteData.nota;

                  if (fetchedNoteData && Object.keys(fetchedNoteData).length > 0) {
                    setNote(fetchedNoteData);
                  } else {
                    console.warn(`Nota no encontrada o vacía en la respuesta para el familiar ${fetchedFamiliarData.id}`);
                    setNote(null);
                  }
                }
              } catch (noteError) {
                console.error(`Error al obtener la nota para el familiar ${fetchedFamiliarData.id}:`, noteError);
                setNote(null);
              }
            } else {
              console.warn(`ID de familiar no encontrado (id) para obtener la nota.`);
              setNote(null);
            }

          } else {
            console.warn(`Datos de familiar no encontrados en la respuesta para el residente ${residentData.id_residente}`);
            setFamiliar(null);
            setFamiliarEmail(null);
            setNote(null);
          }
        }
      } catch (familiarError) {
        console.error(`Error al obtener datos del familiar para el residente ${residentData.id_residente}:`, familiarError);
        setFamiliar(null);
        setFamiliarEmail(null);
        setNote(null);
      }

      try {
        const observationResponse = await fetch(`${API_URL}/Observacion/${residentData.id_residente}`);
        if (!observationResponse.ok) {
          console.warn(`No se pudo obtener la observación para el residente ${residentData.id_residente}: ${observationResponse.statusText}`);
        } else {
          const apiObservationData = await observationResponse.json();
          fetchedObservationData = apiObservationData.observacion;
          if (Array.isArray(fetchedObservationData) && fetchedObservationData.length > 0) {
             setObservation(fetchedObservationData[0]);
          } else if (fetchedObservationData && !Array.isArray(fetchedObservationData)) {
             setObservation(fetchedObservationData);
          } else {
             setObservation(null);
             console.warn(`Observación no encontrada o vacía en la respuesta para el residente ${residentData.id_residente}`);
          }
        }
      } catch (observationError) {
        console.error(`Error al obtener la observación para el residente ${residentData.id_residente}:`, observationError);
        setObservation(null);
      }

      try {
        const checkupsResponse = await fetch(`${API_URL}/ChequeoSemanal/residente/${residentId}`);
        if (!checkupsResponse.ok) {
          console.warn(`No se pudo obtener los chequeos semanales para el residente ${residentId}: ${checkupsResponse.statusText}`);
          setWeeklyCheckups([]);
          setSelectedCheckupId(null);
        } else {
          const checkupsData = await checkupsResponse.json();
          if (Array.isArray(checkupsData) && checkupsData.length > 0) {
            const sortedCheckups = checkupsData.sort((a, b) => new Date(b.fechaChequeo) - new Date(a.fechaChequeo));
            setWeeklyCheckups(sortedCheckups);
            setSelectedCheckupId(sortedCheckups[0].id);
          } else {
            console.warn(`Chequeos semanales no encontrados o vacíos para el residente ${residentId}`);
            setWeeklyCheckups([]);
            setSelectedCheckupId(null);
          }
        }
      } catch (checkupError) {
        console.error(`Error al obtener los chequeos semanales para el residente ${residentId}:`, checkupError);
        setWeeklyCheckups([]);
        setSelectedCheckupId(null);
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

  const selectedCheckup = weeklyCheckups.find(
    (checkup) => checkup.id === selectedCheckupId
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primaryGreen} />
          <Text style={styles.loadingText}>Cargando perfil del residente, familiar, observaciones y notas...</Text>
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
          <Text style={styles.errorText}>ID del Residente: {residentId}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!resident) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Ionicons name="information-circle-outline" size={30} color={COLORS.accentBlue} />
          <Text style={styles.errorText}>No se pudo cargar el perfil del residente.</Text>
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
        <BackButton onPress={() => navigation.goBack()} title="Volver" />
      </View>

      <ScrollView contentContainerStyle={IS_LARGE_SCREEN ? styles.scrollViewContentWeb : styles.scrollViewContent}>
        <View style={[styles.profileCard, IS_LARGE_SCREEN && styles.profileCardWeb]}>
          <View style={styles.header}>
            {resident.foto_url ? (
              <Image source={{ uri: resident.foto_url }} style={styles.profileImage} resizeMode="cover" />
            ) : (
              <View style={styles.noProfileImage}>
                <Ionicons name="person" size={IS_LARGE_SCREEN ? 50 : 70} color={COLORS.lightText} />
              </View>
            )}
            <Text style={styles.residentName}>{resident.nombre} {resident.apellido}</Text>
            <Text style={styles.residentId}>ID: {resident.id_residente}</Text>
            {resident.dispositivo?.nombre && (
              <Text style={styles.deviceInfo}>Dispositivo: {resident.dispositivo.nombre}</Text>
            )}
          </View>

          {IS_LARGE_SCREEN ? (
            <View style={styles.webContentWrapper}>
              <View style={styles.webColumn}>
                <Text style={styles.sectionTitle}>Datos del Residente</Text>
                <DetailRow iconName="calendar-outline" label="Nacimiento" value={resident.fecha_nacimiento ? new Date(resident.fecha_nacimiento).toLocaleDateString() : ''} />
                <DetailRow iconName="call-outline" label="Teléfono" value={resident.telefono} />
                <DetailRow iconName="male-female-outline" label="Género" value={resident.genero} />
                <DetailRow iconName="pulse-outline" label="Última FC" value={resident.ultima_frecuencia_cardiaca !== undefined && resident.ultima_frecuencia_cardiaca !== null ? `${resident.ultima_frecuencia_cardiaca} bpm` : 'N/A'} />
                <DetailRow iconName="moon-outline" label="Promedio Reposo" value={resident.promedioReposo !== undefined && resident.promedioReposo !== null ? `${resident.promedioReposo} bpm` : 'N/A'} />
                <DetailRow iconName="walk-outline" label="Promedio Activo" value={resident.promedioActivo !== undefined && resident.promedioActivo !== null ? `${resident.promedioActivo} bpm` : 'N/A'} />
                <DetailRow iconName="flash-outline" label="Promedio Agitado" value={resident.promedioAgitado !== undefined && resident.promedioAgitado !== null ? `${resident.promedioAgitado} bpm` : 'N/A'} />
                <DetailRow iconName="bed-outline" label="Área" value={resident.nombre_area} />
                <DetailRow iconName="calendar-number-outline" label="Fecha Ingreso" value={resident.fecha_ingreso ? new Date(resident.fecha_ingreso).toLocaleDateString() : ''} />

                <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Chequeos Semanales</Text>
                {weeklyCheckups.length > 0 ? (
                  <>
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={selectedCheckupId}
                        onValueChange={(itemValue) => setSelectedCheckupId(itemValue)}
                        style={styles.picker}
                      >
                        {weeklyCheckups.map((checkup) => (
                          <Picker.Item
                            key={checkup.id}
                            label={`Chequeo del ${new Date(checkup.fechaChequeo).toLocaleDateString()}`}
                            value={checkup.id}
                          />
                        ))}
                      </Picker>
                    </View>
                    {selectedCheckup && (
                      <>
                        <DetailRow iconName="water-outline" label="SpO2" value={selectedCheckup.spo2 !== undefined && selectedCheckup.spo2 !== null ? `${selectedCheckup.spo2}%` : 'N/A'} />
                        <DetailRow iconName="heart-outline" label="Pulso" value={selectedCheckup.pulso !== undefined && selectedCheckup.pulso !== null ? `${selectedCheckup.pulso} bpm` : 'N/A'} />
                        <DetailRow iconName="thermometer-outline" label="Temperatura" value={selectedCheckup.temperaturaCorporal !== undefined && selectedCheckup.temperaturaCorporal !== null ? `${selectedCheckup.temperaturaCorporal}°C` : 'N/A'} />
                        <DetailRow iconName="barbell-outline" label="Peso" value={selectedCheckup.peso !== undefined && selectedCheckup.peso !== null ? `${selectedCheckup.peso} kg` : 'N/A'} />
                        <DetailRow iconName="resize-outline" label="Altura" value={selectedCheckup.altura !== undefined && selectedCheckup.altura !== null ? `${selectedCheckup.altura} m` : 'N/A'} />
                        <DetailRow iconName="body-outline" label="IMC" value={selectedCheckup.imc !== undefined && selectedCheckup.imc !== null ? selectedCheckup.imc.toFixed(1) : 'N/A'} />
                        <Pressable
                          style={({ pressed }) => [
                            styles.viewMoreButton,
                            pressed && styles.viewMoreButtonPressed,
                          ]}
                          onPress={() => navigation.navigate('WeeklyCheckupDetail', { checkupId: selectedCheckup.id, residentName: `${resident.nombre} ${resident.apellido}` })}
                        >
                          <Text style={styles.viewMoreButtonText}>Ver más detalles</Text>
                          <Ionicons name="arrow-forward-circle-outline" size={IS_LARGE_SCREEN ? 18 : 22} color="#fff" style={{ marginLeft: 5 }} />
                        </Pressable>
                      </>
                    )}
                  </>
                ) : (
                  <Text style={styles.noCheckupsText}>No hay chequeos semanales registrados.</Text>
                )}
              </View>

              <View style={styles.webColumn}>
                {familiar && (
                  <>
                    <Text style={[styles.sectionTitle, { marginTop: IS_LARGE_SCREEN ? 0 : 20 }]}>Contacto de Emergencia</Text>
                    <DetailRow iconName="person-outline" label="Nombre" value={`${familiar.nombre} ${familiar.apellido}`} />
                    <DetailRow iconName="call-outline" label="Teléfono" value={familiar.telefono} />
                    {familiarEmail && <DetailRow iconName="mail-outline" label="Correo" value={familiarEmail} />}
                    <DetailRow iconName="people-outline" label="Parentesco" value={familiar.parentesco ? familiar.parentesco.nombre : ''} />
                    <DetailRow iconName="calendar-outline" label="Nacimiento" value={familiar.fecha_nacimiento ? new Date(familiar.fecha_nacimiento).toLocaleDateString() : ''} />
                    <DetailRow iconName="male-female-outline" label="Género" value={familiar.genero} />
                  </>
                )}

                {observation && (
                  <>
                    <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Observaciones del Residente</Text>
                    <View style={styles.observationBox}>
                      <Ionicons name="information-circle-outline" size={IS_LARGE_SCREEN ? 16 : 20} color={COLORS.accentBlue} style={styles.detailIcon} />
                      <Text style={styles.observationText}>{observation.observacion || 'No hay observaciones registradas.'}</Text>
                    </View>
                  </>
                )}

                <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Notas del Contacto</Text>
                {note ? (
                  <View style={styles.noteChatContainer}>
                    <Ionicons name="document-text-outline" size={IS_LARGE_SCREEN ? 16 : 20} color={COLORS.darkText} style={styles.detailIcon} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.noteChatText}>{note.nota}</Text>
                      {note.fecha && (
                        <Text style={styles.noteChatDate}>Fecha: {new Date(note.fecha).toLocaleDateString()} {new Date(note.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                      )}
                    </View>
                  </View>
                ) : (
                  <View style={styles.noNoteContainer}>
                    <Ionicons name="information-circle-outline" size={IS_LARGE_SCREEN ? 18 : 22} color={COLORS.noNoteText} style={styles.detailIcon} />
                    <Text style={styles.noNoteText}>No hay notas registradas para este contacto.</Text>
                  </View>
                )}

              </View>
            </View>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Datos del Residente</Text>
              <DetailRow iconName="calendar-outline" label="Fecha de Nacimiento" value={resident.fecha_nacimiento ? new Date(resident.fecha_nacimiento).toLocaleDateString() : ''} />
              <DetailRow iconName="call-outline" label="Teléfono" value={resident.telefono} />
              <DetailRow iconName="male-female-outline" label="Género" value={resident.genero} />
              <DetailRow iconName="pulse-outline" label="Última Frecuencia Cardíaca" value={resident.ultima_frecuencia_cardiaca !== undefined && resident.ultima_frecuencia_cardiaca !== null ? `${resident.ultima_frecuencia_cardiaca} bpm` : 'N/A'} />
              <DetailRow iconName="moon-outline" label="Promedio Reposo" value={resident.promedioReposo !== undefined && resident.promedioReposo !== null ? `${resident.promedioReposo} bpm` : 'N/A'} />
              <DetailRow iconName="walk-outline" label="Promedio Activo" value={resident.promedioActivo !== undefined && resident.promedioActivo !== null ? `${resident.promedioActivo} bpm` : 'N/A'} />
              <DetailRow iconName="flash-outline" label="Promedio Agitado" value={resident.promedioAgitado !== undefined && resident.promedioAgitado !== null ? `${resident.promedioAgitado} bpm` : 'N/A'} />
              <DetailRow iconName="bed-outline" label="Área" value={resident.nombre_area} />
              <DetailRow iconName="calendar-number-outline" label="Fecha de Ingreso" value={resident.fecha_ingreso ? new Date(resident.fecha_ingreso).toLocaleDateString() : ''} />

              <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Chequeos Semanales</Text>
              {weeklyCheckups.length > 0 ? (
                <>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={selectedCheckupId}
                      onValueChange={(itemValue) => setSelectedCheckupId(itemValue)}
                      style={styles.picker}
                    >
                      {weeklyCheckups.map((checkup) => (
                        <Picker.Item
                          key={checkup.id}
                          label={`Chequeo del ${new Date(checkup.fechaChequeo).toLocaleDateString()}`}
                          value={checkup.id}
                        />
                      ))}
                    </Picker>
                  </View>
                  {selectedCheckup && (
                    <>
                      <DetailRow iconName="water-outline" label="SpO2" value={selectedCheckup.spo2 !== undefined && selectedCheckup.spo2 !== null ? `${selectedCheckup.spo2}%` : 'N/A'} />
                      <DetailRow iconName="heart-outline" label="Pulso" value={selectedCheckup.pulso !== undefined && selectedCheckup.pulso !== null ? `${selectedCheckup.pulso} bpm` : 'N/A'} />
                      <DetailRow iconName="thermometer-outline" label="Temperatura" value={selectedCheckup.temperaturaCorporal !== undefined && selectedCheckup.temperaturaCorporal !== null ? `${selectedCheckup.temperaturaCorporal}°C` : 'N/A'} />
                      <DetailRow iconName="barbell-outline" label="Peso" value={selectedCheckup.peso !== undefined && selectedCheckup.peso !== null ? `${selectedCheckup.peso} kg` : 'N/A'} />
                      <DetailRow iconName="resize-outline" label="Altura" value={selectedCheckup.altura !== undefined && selectedCheckup.altura !== null ? `${selectedCheckup.altura} m` : 'N/A'} />
                      <DetailRow iconName="body-outline" label="IMC" value={selectedCheckup.imc !== undefined && selectedCheckup.imc !== null ? selectedCheckup.imc.toFixed(1) : 'N/A'} />
                      <Pressable
                          style={({ pressed }) => [
                            styles.viewMoreButton,
                            pressed && styles.viewMoreButtonPressed,
                          ]}
                          onPress={() => navigation.navigate('WeeklyCheckupDetail', { checkupId: selectedCheckup.id, residentName: `${resident.nombre} ${resident.apellido}` })}
                        >
                          <Text style={styles.viewMoreButtonText}>Ver más detalles</Text>
                          <Ionicons name="arrow-forward-circle-outline" size={22} color="#fff" style={{ marginLeft: 5 }} />
                        </Pressable>
                    </>
                  )}
                </>
              ) : (
                <Text style={styles.noCheckupsText}>No hay chequeos semanales registrados.</Text>
              )}


              {observation && (
                <>
                  <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Observaciones del Residente</Text>
                  <View style={styles.observationBox}>
                    <Ionicons name="information-circle-outline" size={20} color={COLORS.accentBlue} style={styles.detailIcon} />
                    <Text style={styles.observationText}>{observation.observacion || 'No hay observaciones registradas.'}</Text>
                  </View>
                </>
              )}

              {familiar && (
                <>
                  <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Datos del Contacto de Emergencia</Text>
                  <DetailRow iconName="person-outline" label="Nombre" value={`${familiar.nombre} ${familiar.apellido}`} />
                  <DetailRow iconName="call-outline" label="Teléfono" value={familiar.telefono} />
                  {familiarEmail && <DetailRow iconName="mail-outline" label="Correo Electrónico" value={familiarEmail} />}
                  <DetailRow iconName="people-outline" label="Parentesco" value={familiar.parentesco ? familiar.parentesco.nombre : ''} />
                  <DetailRow iconName="calendar-outline" label="Fecha de Nacimiento" value={familiar.fecha_nacimiento ? new Date(familiar.fecha_nacimiento).toLocaleDateString() : ''} />
                  <DetailRow iconName="male-female-outline" label="Género" value={familiar.genero} />
                </>
              )}

              <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Notas del Contacto de Emergencia</Text>
              {note ? (
                <View style={styles.noteChatContainer}>
                  <Ionicons name="document-text-outline" size={20} color={COLORS.darkText} style={styles.detailIcon} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.noteChatText}>{note.nota}</Text>
                    {note.fecha && (
                      <Text style={styles.noteChatDate}>Fecha: {new Date(note.fecha).toLocaleDateString()} {new Date(note.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                    )}
                  </View>
                </View>
              ) : (
                <View style={styles.noNoteContainer}>
                  <Ionicons name="information-circle-outline" size={22} color={COLORS.noNoteText} style={styles.detailIcon} />
                  <Text style={styles.noNoteText}>No hay notas registradas para este contacto.</Text>
                </View>
              )}
            </>
          )}
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
  profileCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 15,
    padding: 20,
    width: '100%',
    maxWidth: IS_LARGE_SCREEN ? 1000 : '95%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
    paddingTop: 60,
  },
  profileCardWeb: {
    paddingTop: 20,
    flexDirection: 'column',
  },
  header: {
    alignItems: 'center',
    marginBottom: 25,
  },
  profileImage: {
    width: IS_LARGE_SCREEN ? 100 : 120,
    height: IS_LARGE_SCREEN ? 100 : 120,
    borderRadius: IS_LARGE_SCREEN ? 50 : 60,
    backgroundColor: COLORS.borderLight,
    marginBottom: 10,
    borderWidth: 3,
    borderColor: COLORS.primaryGreen,
  },
  noProfileImage: {
    width: IS_LARGE_SCREEN ? 100 : 120,
    height: IS_LARGE_SCREEN ? 100 : 120,
    borderRadius: IS_LARGE_SCREEN ? 50 : 60,
    backgroundColor: COLORS.borderLight,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.borderLight,
  },
  residentName: {
    fontSize: IS_LARGE_SCREEN ? 24 : 28,
    fontWeight: 'bold',
    color: COLORS.darkText,
    marginBottom: 5,
    textAlign: 'center',
  },
  residentId: {
    fontSize: IS_LARGE_SCREEN ? 15 : 17,
    color: COLORS.lightText,
    marginBottom: 5,
  },
  deviceInfo: {
    fontSize: IS_LARGE_SCREEN ? 14 : 16,
    color: COLORS.darkText,
    marginTop: 0,
    fontWeight: '500',
    marginBottom: 15,
  },
  webContentWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginTop: 20,
    gap: 20,
  },
  webColumn: {
    flex: 1,
    minWidth: 380,
    paddingHorizontal: 10,
  },
  sectionTitle: {
    fontSize: IS_LARGE_SCREEN ? 19 : 21,
    fontWeight: 'bold',
    color: COLORS.darkText,
    marginBottom: 12,
    textAlign: 'left',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    paddingBottom: 8,
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
  noteChatContainer: {
    backgroundColor: COLORS.noteBackground,
    borderRadius: 15,
    borderTopLeftRadius: 5,
    padding: IS_LARGE_SCREEN ? 12 : 18,
    marginTop: IS_LARGE_SCREEN ? 15 : 15,
    borderWidth: 1,
    borderColor: COLORS.primaryGreen,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  noteChatText: {
    fontSize: IS_LARGE_SCREEN ? 14 : 16,
    color: COLORS.darkText,
    flex: 1,
    lineHeight: IS_LARGE_SCREEN ? 20 : 22,
  },
  noteChatDate: {
    fontSize: IS_LARGE_SCREEN ? 11 : 13,
    color: COLORS.lightText,
    marginTop: 8,
    fontStyle: 'italic',
    textAlign: 'right',
    width: '100%',
  },
  noNoteContainer: {
    backgroundColor: COLORS.pageBackground,
    borderRadius: 10,
    padding: IS_LARGE_SCREEN ? 12 : 18,
    marginTop: IS_LARGE_SCREEN ? 15 : 15,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noNoteText: {
    fontSize: IS_LARGE_SCREEN ? 14 : 16,
    color: COLORS.noNoteText,
    fontStyle: 'italic',
    textAlign: 'center',
    flex: 1,
  },
  pickerContainer: {
    borderColor: COLORS.borderLight,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    overflow: 'hidden',
    backgroundColor: COLORS.cardBackground,
  },
  picker: {
    height: 50,
    width: '100%',
    color: COLORS.darkText,
  },
  noCheckupsText: {
    fontSize: IS_LARGE_SCREEN ? 14 : 16,
    color: COLORS.lightText,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
    paddingBottom: 10,
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accentBlue,
    paddingVertical: IS_LARGE_SCREEN ? 10 : 12,
    paddingHorizontal: IS_LARGE_SCREEN ? 15 : 20,
    borderRadius: 8,
    marginTop: 15,
    alignSelf: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  viewMoreButtonPressed: {
    opacity: 0.8,
  },
  viewMoreButtonText: {
    color: '#fff',
    fontSize: IS_LARGE_SCREEN ? 14 : 16,
    fontWeight: 'bold',
  },
});