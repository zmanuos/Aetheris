import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { StackActions } from '@react-navigation/native'; // Necesario para popToTop

import Config from '../../config/config';
const API_URL = Config.API_BASE_URL;

// --- COLORES BASADOS EN SIDEMENU.JS ---
const PRIMARY_GREEN = '#6BB240';
const LIGHT_GREEN = '#9CD275';
const ACCENT_GREEN_BACKGROUND = '#EEF7E8'; // Usado para elementos activos o de fondo sutil
const DARK_GRAY = '#333';
const MEDIUM_GRAY = '#555';
const LIGHT_GRAY = '#888';
const VERY_LIGHT_GRAY = '#eee';
const BACKGROUND_LIGHT = '#fcfcfc'; // Fondo general de la pantalla
const WHITE = '#fff'; // Para texto en botones de color

export default function CombinedRegistrationScreen({ navigation }) {
  // Estados del Residente
  const [residentName, setResidentName] = useState('');
  const [residentApellido, setResidentApellido] = useState('');
  const [residentFechaNacimiento, setResidentFechaNacimiento] = useState(new Date());
  const [showResidentDatePicker, setShowResidentDatePicker] = useState(false);
  const [residentGenero, setResidentGenero] = useState('');
  const [residentTelefono, setResidentTelefono] = useState('');
  const residentPhotoDataRef = useRef(null);
  const [residentFotoPreview, setResidentFotoPreview] = useState(null);

  // Estados del Familiar
  const [familiarName, setFamiliarName] = useState('');
  const [familiarApellido, setFamiliarApellido] = useState('');
  const [familiarFechaNacimiento, setFamiliarFechaNacimiento] = useState(new Date());
  const [showFamiliarDatePicker, setShowFamiliarDatePicker] = useState(false);
  const [familiarGenero, setFamiliarGenero] = useState('');
  const [familiarTelefono, setFamiliarTelefono] = useState('');
  const [familiarParentesco, setFamiliarParentesco] = useState('');
  const [familiarFirebaseEmail, setFamiliarFirebaseEmail] = useState('');
  const [familiarFirebasePassword, setFamiliarFirebasePassword] = useState('');

  // Estados para el flujo y carga
  const [isLoading, setIsLoading] = useState(false);
  const [parentescos, setParentescos] = useState([]);

  // useEffect para cargar la lista de parentescos desde la API
  useEffect(() => {
    const fetchParentescos = async () => {
      try {
        const response = await fetch(`${API_URL}/Parentesco`);
        const data = await response.json();
        if (response.ok && data.data) {
          setParentescos(data.data);
        } else {
          console.error('Error al cargar parentescos:', data.message || 'Error desconocido');
          setParentescos([
            { id: 1, nombre: 'Hijo/a' }, { id: 2, nombre: 'Cónyuge' },
            { id: 3, nombre: 'Hermano/a' }, { id: 4, nombre: 'Nieto/a' },
            { id: 5, nombre: 'Sobrino/a' }, { id: 6, nombre: 'Otro' },
          ]);
        }
      } catch (error) {
        console.error('Error de conexión al cargar parentescos:', error);
        setParentescos([
          { id: 1, nombre: 'Hijo/a' }, { id: 2, nombre: 'Cónyuge' },
          { id: 3, nombre: 'Hermano/a' }, { id: 4, nombre: 'Nieto/a' },
          { id: 5, nombre: 'Sobrino/a' }, { id: 6, nombre: 'Otro' },
        ]);
      }
    };
    fetchParentescos();
  }, []);

  // Manejadores de cambio de fecha para DateTimePicker (móvil) - Residente
  const onChangeResidentDateMobile = (event, selectedDate) => {
    const currentDate = selectedDate || residentFechaNacimiento;
    setShowResidentDatePicker(Platform.OS === 'ios' ? false : false);
    setResidentFechaNacimiento(currentDate);
  };

  // Manejador de cambio de fecha para input tipo 'date' (web) - Residente
  const onChangeResidentDateWeb = (event) => {
    const dateString = event.target.value;
    if (dateString) {
      setResidentFechaNacimiento(new Date(dateString + 'T00:00:00Z'));
    }
  };

  // Manejadores de cambio de fecha para DateTimePicker (móvil) - Familiar
  const onChangeFamiliarDateMobile = (event, selectedDate) => {
    const currentDate = selectedDate || familiarFechaNacimiento;
    setShowFamiliarDatePicker(Platform.OS === 'ios' ? false : false);
    setFamiliarFechaNacimiento(currentDate);
  };

  // Manejador de cambio de fecha para input tipo 'date' (web) - Familiar
  const onChangeFamiliarDateWeb = (event) => {
    const dateString = event.target.value;
    if (dateString) {
      const date = new Date(dateString + 'T00:00:00Z');
      if (!isNaN(date.getTime())) {
        setFamiliarFechaNacimiento(date);
      }
    }
  };

  const pickImage = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitamos permiso para acceder a tu galería de fotos.');
        return;
      }
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.canceled) {
      const assetUri = result.assets[0].uri;
      let imageDataForUpload = null;
      let previewUri = assetUri;

      if (assetUri.startsWith('data:')) {
        try {
          const response = await fetch(assetUri);
          const blob = await response.blob();

          const match = assetUri.match(/^data:(.*?);base64,/);
          const mimeType = match ? match[1] : 'image/jpeg';
          let extension = mimeType.split('/')[1] || 'jpeg';

          imageDataForUpload = { blob, name: `photo.${extension}`, type: mimeType };
        } catch (blobError) {
          console.error('Error al convertir data URI a Blob:', blobError);
          Alert.alert('Error', 'No se pudo procesar la imagen seleccionada.');
          residentPhotoDataRef.current = null;
          setResidentFotoPreview(null);
          return;
        }
      } else {
        let filename = assetUri.split('/').pop();
        let type = 'image/jpeg';
        const extensionMatch = filename.match(/\.([0-9a-z]+)(?:[\?#]|$)/i);
        if (extensionMatch) {
          const ext = extensionMatch[1].toLowerCase();
          switch (ext) {
            case 'png': type = 'image/png'; break;
            case 'jpg':
            case 'jpeg': type = 'image/jpeg'; break;
            case 'gif': type = 'image/gif'; break;
            default: type = 'application/octet-stream';
          }
        }
        imageDataForUpload = { uri: assetUri, name: filename, type: type };
      }

      residentPhotoDataRef.current = imageDataForUpload;
      setResidentFotoPreview(previewUri);
    } else {
      residentPhotoDataRef.current = null;
      setResidentFotoPreview(null);
    }
  };

  // NUEVA FUNCIÓN UNIFICADA PARA REGISTRAR AMBOS
  const handleCombinedRegistration = async () => {
    // 1. Validación de todos los campos necesarios para residente
    if (!residentName || !residentApellido || residentGenero === '' || !residentTelefono) {
      Alert.alert('Error', 'Por favor, completa todos los campos obligatorios del residente.');
      return;
    }

    // 2. Validación de todos los campos necesarios para familiar
    if (!familiarName || !familiarApellido || familiarGenero === '' || !familiarTelefono || familiarParentesco === '' || !familiarFirebaseEmail || !familiarFirebasePassword) {
      Alert.alert('Error', 'Por favor, completa todos los campos obligatorios del familiar, incluyendo email y contraseña para el acceso.');
      return;
    }

    setIsLoading(true);
    let newResidentId = null;

    try {
      // 3. Registro del Residente
      const residentFormData = new FormData();
      residentFormData.append('nombre', residentName);
      residentFormData.append('apellido', residentApellido);

      const year = residentFechaNacimiento.getFullYear();
      const month = String(residentFechaNacimiento.getMonth() + 1).padStart(2, '0');
      const day = String(residentFechaNacimiento.getDate()).padStart(2, '0');
      residentFormData.append('fechaNacimiento', `${year}-${month}-${day}`);

      residentFormData.append('genero', residentGenero);
      residentFormData.append('telefono', residentTelefono);

      const residentResponse = await fetch(`${API_URL}/Residente`, {
        method: 'POST',
        body: residentFormData,
      });

      const residentData = await residentResponse.json();

      if (!residentResponse.ok || residentData.status !== 0) {
        Alert.alert('Error al Registrar Residente', residentData.message || 'Ocurrió un error inesperado al registrar al residente.');
        return; // Detener el proceso si el registro del residente falla
      }
      newResidentId = residentData.data?.id_residente;
      if (!newResidentId) {
        Alert.alert('Error', 'Residente registrado, pero no se recibió el ID. No se puede registrar al familiar.');
        return;
      }

      // 4. Subida de la foto del Residente (si el residente se registró exitosamente)
      const currentResidentPhotoData = residentPhotoDataRef.current;
      if (currentResidentPhotoData) {
        const photoUploadFormData = new FormData();
        photoUploadFormData.append('IdResidente', newResidentId.toString());

        if (currentResidentPhotoData.blob) {
          photoUploadFormData.append('FotoArchivo', currentResidentPhotoData.blob, currentResidentPhotoData.name);
        } else {
          photoUploadFormData.append('FotoArchivo', {
            uri: currentResidentPhotoData.uri,
            name: currentResidentPhotoData.name,
            type: currentResidentPhotoData.type,
          });
        }

        try {
          const photoUploadResponse = await fetch(`${API_URL}/Residente/UploadPhoto`, {
            method: 'POST',
            body: photoUploadFormData,
          });

          if (!photoUploadResponse.ok) {
            console.warn('Advertencia: Error al subir la foto del residente. Se continuará con el registro del familiar. Error:', await photoUploadResponse.text());
          }
        } catch (photoError) {
          console.warn('Advertencia: Error de conexión al subir la foto del residente. Se continuará con el registro del familiar. Error:', photoError);
        }
      }

      // 5. Registro del Familiar
      let firebaseUid = null;
      try {
        // SIMULACIÓN DE CREACIÓN DE USUARIO EN FIREBASE (AJUSTAR SEGÚN TU LÓGICA REAL DE FIREBASE)
        console.log("Simulando creación de usuario Firebase con:", familiarFirebaseEmail, familiarFirebasePassword);
        firebaseUid = `mock_${Math.random().toString(36).substring(2, 15)}`; // Genera un UID simulado
        console.log("UID de Firebase simulado:", firebaseUid);
      } catch (firebaseError) {
        console.error("Error al crear usuario Firebase:", firebaseError);
        Alert.alert("Error Firebase", `No se pudo crear el usuario en Firebase: ${firebaseError.message || 'Error desconocido.'}`);
        return; // Detener el proceso si la creación de Firebase falla
      }

      const familiarFormData = new FormData();
      familiarFormData.append('nombre', familiarName);
      familiarFormData.append('apellido', familiarApellido);
      const familiarYear = familiarFechaNacimiento.getFullYear();
      const familiarMonth = String(familiarFechaNacimiento.getMonth() + 1).padStart(2, '0');
      const familiarDay = String(familiarFechaNacimiento.getDate()).padStart(2, '0');
      familiarFormData.append('fechaNacimiento', `${familiarYear}-${familiarMonth}-${familiarDay}`);
      familiarFormData.append('genero', familiarGenero);
      familiarFormData.append('telefono', familiarTelefono);
      familiarFormData.append('id_residente', newResidentId.toString()); // Usa el ID del residente recién creado
      familiarFormData.append('id_parentesco', familiarParentesco);
      familiarFormData.append('firebase_uid', firebaseUid);
      familiarFormData.append('email', familiarFirebaseEmail);
      familiarFormData.append('contra', familiarFirebasePassword);

      const familiarResponse = await fetch(`${API_URL}/Familiar`, {
        method: 'POST',
        body: familiarFormData,
      });

      const familiarData = await familiarResponse.json();

      if (familiarResponse.ok && familiarData.status === 0) {
        Alert.alert('Éxito', 'Residente y Familiar registrados exitosamente.');
        navigation.dispatch(StackActions.popToTop()); // Regresa a la primera pantalla
      } else {
        if (familiarData.errors) {
          let errorMessages = Object.values(familiarData.errors).map(errArray => errArray.join(', ')).join('\n');
          Alert.alert('Error de Validación', `Por favor, corrige los siguientes errores del familiar:\n${errorMessages}`);
        } else {
          Alert.alert('Error al Registrar Familiar', familiarData.message || 'Ocurrió un error inesperado al guardar datos personales del familiar.');
        }
        // Considera implementar lógica para "deshacer" el registro del residente si el familiar falla
        console.error('El registro del familiar falló después de registrar al residente. ID del Residente:', newResidentId);
      }

    } catch (error) {
      console.error('Error en el proceso de registro combinado:', error);
      Alert.alert('Error de Conexión', 'No se pudo conectar con el servidor para completar el registro combinado.');
    } finally {
      setIsLoading(false);
    }
  };

  const formattedResidentDateForDisplay = residentFechaNacimiento.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  const formattedResidentDateForWebInput = residentFechaNacimiento.toISOString().split('T')[0]; // "YYYY-MM-DD"

  const formattedFamiliarDateForDisplay = familiarFechaNacimiento.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  const formattedFamiliarDateForWebInput = familiarFechaNacimiento.toISOString().split('T')[0]; // "YYYY-MM-DD"

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={DARK_GRAY} />
        </TouchableOpacity>
        <Text style={styles.title}>Registro de Residente y Familiar</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.mainContentWrapper}>
          {/* Formulario de Residente */}
          <View style={styles.formCard}> {/* Eliminado formCardWeb ya que se aplica en mainContentWrapper */}
            {/* Sección de la foto */}
            <View style={styles.photoContainer}>
              {residentFotoPreview ? (
                <Image source={{ uri: residentFotoPreview }} style={styles.residentPhotoPreview} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="person-circle-outline" size={80} color={LIGHT_GRAY} />
                  <Text style={styles.photoPlaceholderText}>Añadir Foto</Text>
                </View>
              )}
              <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage} disabled={isLoading}>
                <Ionicons name="camera-outline" size={20} color={WHITE} />
                <Text style={styles.imagePickerButtonText}>Seleccionar Foto</Text>
              </TouchableOpacity>
            </View>

            {/* Sección de datos del residente */}
            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Datos Personales del Residente</Text>
              <TextInput
                style={styles.input}
                placeholder="Nombre"
                placeholderTextColor={MEDIUM_GRAY}
                value={residentName}
                onChangeText={setResidentName}
                editable={!isLoading}
              />
              <TextInput
                style={styles.input}
                placeholder="Apellido"
                placeholderTextColor={MEDIUM_GRAY}
                value={residentApellido}
                onChangeText={setResidentApellido}
                editable={!isLoading}
              />

              {/* Selector de Género del Residente */}
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={residentGenero}
                  onValueChange={(itemValue) => setResidentGenero(itemValue)}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                  enabled={!isLoading}
                >
                  <Picker.Item label="Seleccionar Género..." value="" enabled={true} color={MEDIUM_GRAY} />
                  <Picker.Item label="Masculino" value="Masculino" />
                  <Picker.Item label="Femenino" value="Femenino" />
                </Picker>
                <View style={styles.pickerIcon}>
                  <Ionicons name="chevron-down" size={20} color={MEDIUM_GRAY} />
                </View>
              </View>

              {/* Selector de Fecha de Nacimiento del Residente Condicional */}
              {Platform.OS === 'web' ? (
                <View style={styles.webDateInputContainer}>
                  <Text style={styles.dateLabel}>Fecha de Nacimiento:</Text>
                  <input
                    type="date"
                    value={formattedResidentDateForWebInput}
                    onChange={onChangeResidentDateWeb}
                    style={styles.webDateInput}
                    disabled={isLoading}
                  />
                </View>
              ) : (
                <>
                  <TouchableOpacity style={styles.dateInput} onPress={() => setShowResidentDatePicker(true)} disabled={isLoading}>
                    <Text style={styles.dateInputText}>
                      Fecha de Nacimiento: {formattedResidentDateForDisplay}
                    </Text>
                    <Ionicons name="calendar-outline" size={20} color={MEDIUM_GRAY} />
                  </TouchableOpacity>
                  {showResidentDatePicker && (
                    <DateTimePicker
                      testID="residentDatePicker"
                      value={residentFechaNacimiento}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={onChangeResidentDateMobile}
                    />
                  )}
                </>
              )}
              <TextInput
                style={styles.input}
                placeholder="Teléfono (Ej: 5512345678)"
                placeholderTextColor={MEDIUM_GRAY}
                value={residentTelefono}
                onChangeText={setResidentTelefono}
                keyboardType="phone-pad"
                editable={!isLoading}
              />
            </View>
          </View>

          {/* Formulario de Familiar */}
          <View style={styles.formCard}> {/* Eliminado familiarFormCardWeb ya que se aplica en mainContentWrapper */}
            {/* Sección del Formulario del Familiar */}
            <View style={styles.familiarFormContent}>
              <Text style={styles.sectionTitle}>Datos del Familiar</Text>
              <TextInput
                style={styles.input}
                placeholder="Nombre Familiar"
                placeholderTextColor={MEDIUM_GRAY}
                value={familiarName}
                onChangeText={setFamiliarName}
                editable={!isLoading}
              />
              <TextInput
                style={styles.input}
                placeholder="Apellido Familiar"
                placeholderTextColor={MEDIUM_GRAY}
                value={familiarApellido}
                onChangeText={setFamiliarApellido}
                editable={!isLoading}
              />

              {/* Selector de Género Familiar */}
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={familiarGenero}
                  onValueChange={(itemValue) => setFamiliarGenero(itemValue)}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                  enabled={!isLoading}
                >
                  <Picker.Item label="Seleccionar Género..." value="" enabled={true} color={MEDIUM_GRAY} />
                  <Picker.Item label="Masculino" value="Masculino" />
                  <Picker.Item label="Femenino" value="Femenino" />
                </Picker>
                <View style={styles.pickerIcon}>
                  <Ionicons name="chevron-down" size={20} color={MEDIUM_GRAY} />
                </View>
              </View>

              {/* Selector de Fecha de Nacimiento Familiar Condicional (para Web y Mobile) */}
              {Platform.OS === 'web' ? (
                <View style={styles.webDateInputContainer}>
                  <Text style={styles.dateLabel}>Fecha de Nacimiento Familiar:</Text>
                  <input
                    type="date"
                    value={formattedFamiliarDateForWebInput}
                    onChange={onChangeFamiliarDateWeb}
                    style={styles.webDateInput}
                    disabled={isLoading}
                  />
                </View>
              ) : (
                <>
                  <TouchableOpacity style={styles.dateInput} onPress={() => setShowFamiliarDatePicker(true)} disabled={isLoading}>
                    <Text style={styles.dateInputText}>
                      Fecha de Nacimiento Familiar: {formattedFamiliarDateForDisplay}
                    </Text>
                    <Ionicons name="calendar-outline" size={20} color={MEDIUM_GRAY} />
                  </TouchableOpacity>
                  {showFamiliarDatePicker && (
                    <DateTimePicker
                      testID="familiarDatePicker"
                      value={familiarFechaNacimiento}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={onChangeFamiliarDateMobile}
                    />
                  )}
                </>
              )}
              <TextInput
                style={styles.input}
                placeholder="Teléfono Familiar"
                placeholderTextColor={MEDIUM_GRAY}
                value={familiarTelefono}
                onChangeText={setFamiliarTelefono}
                keyboardType="phone-pad"
                editable={!isLoading}
              />

              {/* Selector de Parentesco */}
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={familiarParentesco}
                  onValueChange={(itemValue) => setFamiliarParentesco(itemValue)}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                  enabled={!isLoading}
                >
                  <Picker.Item label="Seleccionar Parentesco..." value="" enabled={true} color={MEDIUM_GRAY} />
                  {parentescos.map((p) => (
                    <Picker.Item key={p.id} label={p.nombre} value={p.id.toString()} />
                  ))}
                </Picker>
                <View style={styles.pickerIcon}>
                  <Ionicons name="chevron-down" size={20} color={MEDIUM_GRAY} />
                </View>
              </View>
              <Text style={styles.sectionSubtitle}>Credenciales de Acceso</Text>
              <TextInput
                style={styles.input}
                placeholder="Email (para acceso)"
                placeholderTextColor={MEDIUM_GRAY}
                value={familiarFirebaseEmail}
                onChangeText={setFamiliarFirebaseEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
              <TextInput
                style={styles.input}
                placeholder="Contraseña (para acceso)"
                placeholderTextColor={MEDIUM_GRAY}
                value={familiarFirebasePassword}
                onChangeText={setFamiliarFirebasePassword}
                secureTextEntry={true}
                editable={!isLoading}
              />
            </View>
          </View>
        </View>

        {/* ÚNICO BOTÓN DE REGISTRO PARA AMBOS */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleCombinedRegistration}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={WHITE} />
          ) : (
            <Text style={styles.primaryButtonText}>Registrar Residente y Familiar</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- ESTILOS DEL FORMULARIO (UNIFICADOS Y ADAPTADOS) ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BACKGROUND_LIGHT, // Fondo claro del SideMenu
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    backgroundColor: WHITE, // Fondo blanco para el header
    borderBottomWidth: 0.5,
    borderBottomColor: VERY_LIGHT_GRAY, // Línea sutil
    paddingTop: Platform.OS === 'android' ? 35 : 18,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: Platform.OS === 'android' ? 35 : 18,
    zIndex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: DARK_GRAY,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  mainContentWrapper: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column', // Fila en web, columna en móvil
    justifyContent: 'center',
    alignItems: 'flex-start', // Alinea al inicio de la flex-direction
    flexWrap: 'wrap', // Permite que los elementos se envuelvan en pantallas más pequeñas
    maxWidth: 1200, // Ancho máximo para el contenedor de los formularios en web
    width: '100%',
    paddingHorizontal: 15,
  },
  formCard: {
    backgroundColor: WHITE,
    borderRadius: 12,
    padding: 20,
    margin: 10, // Margen entre tarjetas
    shadowColor: DARK_GRAY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    alignItems: 'center', // Centrar contenido dentro de la tarjeta
    flex: 1, // Permite que las tarjetas crezcan y se encojan
    minWidth: 300, // Ancho mínimo para cada tarjeta en web
    maxWidth: Platform.OS === 'web' ? '48%' : '100%', // 48% para dejar espacio para el margen en web, 100% en móvil
    width: Platform.OS === 'web' ? 'auto' : '100%', // Ajuste automático en web, completo en móvil
  },
  photoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: ACCENT_GREEN_BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: LIGHT_GREEN,
  },
  photoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    color: MEDIUM_GRAY,
    fontSize: 14,
    marginTop: 5,
  },
  residentPhotoPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePickerButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: PRIMARY_GREEN,
    borderRadius: 20,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: DARK_GRAY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  imagePickerButtonText: {
    color: WHITE,
    marginLeft: 5,
    fontSize: 12,
    fontWeight: '600',
  },
  detailsSection: {
    width: '100%',
  },
  familiarFormContent: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: PRIMARY_GREEN,
    marginBottom: 15,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DARK_GRAY,
    marginTop: 20,
    marginBottom: 10,
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: VERY_LIGHT_GRAY,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    color: DARK_GRAY,
    backgroundColor: ACCENT_GREEN_BACKGROUND, // Fondo suave para los inputs
  },
  pickerContainer: {
    width: '100%',
    borderWidth: 1,
    borderColor: VERY_LIGHT_GRAY,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: ACCENT_GREEN_BACKGROUND,
    justifyContent: 'center',
    position: 'relative', // Para posicionar el icono
    height: 48, // Altura consistente con los inputs
  },
  picker: {
    width: '100%',
    height: 48, // Android uses this for height
    color: DARK_GRAY,
  },
  pickerItem: {
    fontSize: 16,
    color: DARK_GRAY,
  },
  pickerIcon: {
    position: 'absolute',
    right: 15,
    top: '50%',
    transform: [{ translateY: -10 }], // Centrar verticalmente
    pointerEvents: 'none', // Asegura que el picker pueda ser clickeado a través del icono
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: VERY_LIGHT_GRAY,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: ACCENT_GREEN_BACKGROUND,
  },
  dateInputText: {
    fontSize: 16,
    color: DARK_GRAY,
  },
  webDateInputContainer: {
    width: '100%',
    borderWidth: 1,
    borderColor: VERY_LIGHT_GRAY,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: ACCENT_GREEN_BACKGROUND,
    paddingVertical: 5, // Ajuste para contener el input de fecha nativo
  },
  dateLabel: {
    fontSize: 14,
    color: MEDIUM_GRAY,
    marginBottom: 5,
    paddingLeft: 15,
    paddingTop: 8,
  },
  webDateInput: {
    height: 38,
    width: '100%',
    borderColor: 'transparent',
    borderWidth: 0,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    color: DARK_GRAY,
    backgroundColor: 'transparent',
    outline: 'none',
    boxSizing: 'border-box',
  },
  primaryButton: {
    backgroundColor: PRIMARY_GREEN, // Verde primario del SideMenu
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    width: Platform.OS === 'web' ? 'calc(100% - 20px)' : '100%', // Ajuste para el margen en web
    maxWidth: 1180, // Limita el ancho del botón en web para que coincida con los formularios
    shadowColor: DARK_GRAY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
  primaryButtonText: {
    color: WHITE,
    fontSize: 18,
    fontWeight: '700',
  },
});