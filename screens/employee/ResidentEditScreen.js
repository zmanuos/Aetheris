// ResidentEditScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  Image,
  Dimensions,
  ActionSheetIOS,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { useNotification } from '../../src/context/NotificationContext';
import BackButton from '../../components/shared/BackButton'; // Asumiendo que aún se usa

import {
  formatName,
  isValidName,
  isAdult,
  formatPhoneNumber,
  isValidPhoneNumber,
} from '../../components/shared/Validations';

import Config from '../../config/config';
const API_URL = Config.API_BASE_URL;

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
const IS_LARGE_SCREEN = width > 900;
const baseStaticUrl = API_URL.replace('/api', '');

// `residentId` y `navigation` son ahora props
export default function ResidentEditScreen({ residentId, navigation }) {
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const { showNotification } = useNotification();

  // Estados para datos del Residente
  const [residentName, setResidentName] = useState('');
  const [residentApellido, setResidentApellido] = useState('');
  const [residentFechaNacimiento, setResidentFechaNacimiento] = useState(new Date(2000, 0, 1));
  const [showResidentDatePicker, setShowResidentDatePicker] = useState(false);
  const [residentGenero, setResidentGenero] = useState('');
  const [residentTelefono, setResidentTelefono] = useState('');
  const [residentFotoFilename, setResidentFotoFilename] = useState('');
  const [residentFotoPreview, setResidentFotoPreview] = useState(null);
  const [residentActivo, setResidentActivo] = useState(true);
  const [residentDispositivoId, setResidentDispositivoId] = useState(null);
  const [residentPromedioReposo, setResidentPromedioReposo] = useState('');
  const [residentPromedioActivo, setResidentPromedioActivo] = useState('');
  const [residentPromedioAgitado, setResidentPromedioAgitado] = useState('');

  // Estados para validaciones
  const [nameError, setNameError] = useState('');
  const [apellidoError, setApellidoError] = useState('');
  const [fechaNacimientoError, setFechaNacimientoError] = useState('');
  const [generoError, setGeneroError] = useState('');
  const [telefonoError, setTelefonoError] = useState('');

  const scrollViewRef = useRef(null);

  // --- Funciones de Validación ---
  const validateResident = () => {
    let valid = true;
    if (!isValidName(residentName)) { setNameError('Nombre inválido.'); valid = false; } else { setNameError(''); }
    if (!isValidName(residentApellido)) { setApellidoError('Apellido inválido.'); valid = false; } else { setApellidoError(''); }
    if (!isAdult(residentFechaNacimiento)) { setFechaNacimientoError('El residente debe ser mayor de 18 años.'); valid = false; } else { setFechaNacimientoError(''); }
    if (!residentGenero) { setGeneroError('Selecciona un género.'); valid = false; } else { setGeneroError(''); }
    if (!isValidPhoneNumber(residentTelefono)) { setTelefonoError('Número de teléfono inválido (10 dígitos).'); valid = false; } else { setTelefonoError(''); }
    return valid;
  };

  // --- Precarga de datos del Residente ---
  const fetchResidentData = useCallback(async () => {
    if (!residentId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setFetchError('');
    try {
      const residentResponse = await fetch(`${API_URL}/Residente/${residentId}`);
      if (!residentResponse.ok) {
        throw new Error('No se pudo cargar el residente.');
      }
      const residentData = await residentResponse.json();

      setResidentName(residentData.nombre || '');
      setResidentApellido(residentData.apellido || '');
      if (residentData.fecha_nacimiento) {
        setResidentFechaNacimiento(new Date(residentData.fecha_nacimiento));
      }
      setResidentGenero(residentData.genero || '');
      setResidentTelefono(formatPhoneNumber(residentData.telefono || ''));
      setResidentActivo(residentData.activo);
      setResidentDispositivoId(residentData.id_dispositivo || null);
      setResidentPromedioReposo(residentData.promedio_frecuencia_reposo?.toString() || '');
      setResidentPromedioActivo(residentData.promedio_frecuencia_activa?.toString() || '');
      setResidentPromedioAgitado(residentData.promedio_frecuencia_agitado?.toString() || '');

      if (residentData.foto && residentData.foto !== 'nophoto.png') {
        setResidentFotoFilename(residentData.foto);
        setResidentFotoPreview(`${baseStaticUrl}/images/residents/${residentData.foto}`);
      } else {
        setResidentFotoFilename('nophoto.png');
        setResidentFotoPreview(null);
      }

    } catch (error) {
      console.error('Error al cargar datos del residente:', error);
      setFetchError('Error al cargar los datos del residente. Intenta de nuevo.');
      showNotification('Error al cargar los datos del residente.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [residentId, showNotification]);

  useEffect(() => {
    fetchResidentData();
  }, [fetchResidentData]);

  // --- Manejadores de fechas ---
  const onChangeResidentDate = (event, selectedDate) => {
    const currentDate = selectedDate || residentFechaNacimiento;
    setShowResidentDatePicker(Platform.OS === 'ios');
    setResidentFechaNacimiento(currentDate);
  };

  const showResidentDatepicker = () => {
    setShowResidentDatePicker(true);
  };

  // --- Manejo de la selección de imagen ---
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permiso Requerido", "Necesitamos acceso a tu galería para poder seleccionar una imagen.");
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!pickerResult.canceled) {
      const selectedAsset = pickerResult.assets[0];
      setResidentFotoPreview(selectedAsset.uri);
      const fileName = selectedAsset.uri.split('/').pop();
      setResidentFotoFilename(fileName);
    }
  };

  const openImagePicker = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancelar', 'Seleccionar de Galería', 'Tomar Foto'],
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            pickImage();
          } else if (buttonIndex === 2) {
            Alert.alert("Función no disponible", "La opción de tomar foto no está implementada aún.");
            // Implementar lógica para tomar foto si es necesario
          }
        }
      );
    } else {
      // Para Android y Web, usar el pickImage directamente
      pickImage();
    }
  };

  // --- Función para subir la foto ---
  const uploadPhoto = async (uri, fileName) => {
    if (!uri) return 'nophoto.png'; // Si no hay URI, no hay foto para subir

    const fileExtension = fileName.split('.').pop();
    const newFileName = `resident_${residentId}_${Date.now()}.${fileExtension}`;

    try {
      const response = await fetch(uri);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append('file', blob, newFileName);

      const uploadResponse = await fetch(`${API_URL}/upload/resident_photo`, {
        method: 'POST',
        body: formData,
        headers: {
          // No Content-Type header when using FormData, browser sets it
        },
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Error al subir la foto: ${errorText}`);
      }

      const uploadResult = await uploadResponse.json();
      return uploadResult.fileName; // Retorna el nombre de archivo guardado en el servidor

    } catch (error) {
      console.error('Error en uploadPhoto:', error);
      showNotification(`Error al subir la foto: ${error.message}`, 'error');
      return 'nophoto.png'; // Retornar un valor predeterminado en caso de error
    }
  };

  // --- Guardar Cambios del Residente ---
  const handleSaveResident = async () => {
    if (!validateResident()) {
      showNotification('Por favor, corrige los errores en el formulario del residente.', 'error');
      return;
    }

    setIsLoading(true);
    setFetchError(''); // Limpiar errores previos
    try {
      let finalPhotoFilename = residentFotoFilename;

      // Solo subir la foto si ha cambiado o es nueva
      if (residentFotoPreview && residentFotoPreview.startsWith('file://')) { // Es una nueva imagen local
        finalPhotoFilename = await uploadPhoto(residentFotoPreview, residentFotoFilename);
      } else if (!residentFotoPreview && residentFotoFilename !== 'nophoto.png') {
        // Si se eliminó la foto y no es nophoto.png
        finalPhotoFilename = 'nophoto.png';
      }

      const residentDataToUpdate = {
        nombre: residentName,
        apellido: residentApellido,
        fecha_nacimiento: residentFechaNacimiento.toISOString().split('T')[0],
        genero: residentGenero,
        telefono: residentTelefono.replace(/\D/g, ''), // Guardar solo dígitos
        foto: finalPhotoFilename,
        activo: residentActivo,
        id_dispositivo: residentDispositivoId || null,
        promedio_frecuencia_reposo: parseFloat(residentPromedioReposo) || null,
        promedio_frecuencia_activa: parseFloat(residentPromedioActivo) || null,
        promedio_frecuencia_agitado: parseFloat(residentPromedioAgitado) || null,
      };

      const method = residentId ? 'PUT' : 'POST';
      const url = residentId ? `${API_URL}/Residente/${residentId}` : `${API_URL}/Residente`;

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(residentDataToUpdate),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al guardar el residente.');
      }

      showNotification('Datos del residente guardados exitosamente.', 'success');
      // No navegar aquí para permitir la edición conjunta

    } catch (error) {
      console.error('Error al guardar residente:', error);
      setFetchError(error.message);
      showNotification(`Error al guardar residente: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };


  if (isLoading && !fetchError) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryGreen} />
        <Text style={styles.loadingText}>Cargando datos del residente...</Text>
      </View>
    );
  }

  if (fetchError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{fetchError}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchResidentData}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Datos del Residente</Text>

      {/* Campo: Foto del Residente (Moved to top) */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Foto</Text>
        <TouchableOpacity style={styles.imagePickerButton} onPress={openImagePicker}>
          {residentFotoPreview ? (
            <Image source={{ uri: residentFotoPreview }} style={styles.profileImage} />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Ionicons name="image" size={50} color={COLORS.lightGray} />
            </View>
          )}
          <Text style={styles.imagePickerButtonText}>
            {residentFotoPreview ? 'Cambiar Foto' : 'Seleccionar Foto'}
          </Text>
        </TouchableOpacity>
        {residentFotoPreview && (
          <TouchableOpacity onPress={() => { setResidentFotoPreview(null); setResidentFotoFilename('nophoto.png'); }} style={styles.removeImageButton}>
            <Ionicons name="close-circle" size={24} color={COLORS.errorRed} />
            <Text style={styles.removeImageButtonText}>Quitar Foto</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Campo: Nombre */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Nombre</Text>
        <TextInput
          style={[styles.input, nameError ? styles.inputError : {}]}
          value={residentName}
          onChangeText={setResidentName}
          placeholder="Nombre del residente"
          placeholderTextColor={COLORS.lightGray}
          onBlur={() => validateResident()}
        />
        {nameError ? <Text style={styles.errorTextSmall}>{nameError}</Text> : null}
      </View>

      {/* Campo: Apellido */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Apellido</Text>
        <TextInput
          style={[styles.input, apellidoError ? styles.inputError : {}]}
          value={residentApellido}
          onChangeText={setResidentApellido}
          placeholder="Apellido del residente"
          placeholderTextColor={COLORS.lightGray}
          onBlur={() => validateResident()}
        />
        {apellidoError ? <Text style={styles.errorTextSmall}>{apellidoError}</Text> : null}
      </View>

      {/* Campo: Fecha de Nacimiento */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Fecha de Nacimiento</Text>
        <TouchableOpacity onPress={showResidentDatepicker} style={styles.dateDisplay}>
          <TextInput
            style={[styles.input, fechaNacimientoError ? styles.inputError : {}, styles.dateTextInput]}
            value={residentFechaNacimiento.toLocaleDateString('es-ES')}
            editable={false}
            placeholder="DD/MM/AAAA"
            placeholderTextColor={COLORS.lightGray}
          />
          <Ionicons name="calendar" size={20} color={COLORS.mediumGray} style={styles.calendarIcon} />
        </TouchableOpacity>
        {showResidentDatePicker && (
          <DateTimePicker
            testID="residentDatePicker"
            value={residentFechaNacimiento}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onChangeResidentDate}
            maximumDate={new Date()}
            locale="es-ES"
            style={Platform.OS === 'web' ? styles.datePickerWeb : undefined}
          />
        )}
        {fechaNacimientoError ? <Text style={styles.errorTextSmall}>{fechaNacimientoError}</Text> : null}
      </View>

      {/* Campo: Género */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Género</Text>
        <View style={[styles.pickerContainer, generoError ? styles.inputError : {}]}>
          <Picker
            selectedValue={residentGenero}
            onValueChange={(itemValue) => setResidentGenero(itemValue)}
            style={styles.picker}
            itemStyle={styles.pickerItem}
          >
            <Picker.Item label="Selecciona" value="" enabled={false} style={{ color: COLORS.lightGray }} />
            <Picker.Item label="Masculino" value="Masculino" />
            <Picker.Item label="Femenino" value="Femenino" />
            <Picker.Item label="Otro" value="Otro" />
          </Picker>
        </View>
        {generoError ? <Text style={styles.errorTextSmall}>{generoError}</Text> : null}
      </View>

      {/* Campo: Teléfono */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Teléfono</Text>
        <TextInput
          style={[styles.input, telefonoError ? styles.inputError : {}]}
          value={residentTelefono}
          onChangeText={(text) => setResidentTelefono(formatPhoneNumber(text))}
          keyboardType="phone-pad"
          placeholder="Ej: (123) 456-7890"
          placeholderTextColor={COLORS.lightGray}
          maxLength={14}
          onBlur={() => validateResident()}
        />
        {telefonoError ? <Text style={styles.errorTextSmall}>{telefonoError}</Text> : null}
      </View>

      {/* Switch: Residente Activo */}
      <View style={styles.switchContainer}>
        <Text style={styles.inputLabel}>Residente Activo</Text>
        <Switch
          onValueChange={setResidentActivo}
          value={residentActivo}
          trackColor={{ false: COLORS.lightGray, true: COLORS.primaryGreen }}
          thumbColor={COLORS.white}
        />
      </View>

      {/* Campos de promedio de frecuencia */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Promedio Frecuencia Reposo</Text>
        <TextInput
          style={styles.input}
          value={residentPromedioReposo}
          onChangeText={setResidentPromedioReposo}
          keyboardType="numeric"
          placeholder="Ej: 60"
          placeholderTextColor={COLORS.lightGray}
        />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Promedio Frecuencia Activa</Text>
        <TextInput
          style={styles.input}
          value={residentPromedioActivo}
          onChangeText={setResidentPromedioActivo}
          keyboardType="numeric"
          placeholder="Ej: 120"
          placeholderTextColor={COLORS.lightGray}
        />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Promedio Frecuencia Agitado</Text>
        <TextInput
          style={styles.input}
          value={residentPromedioAgitado}
          onChangeText={setResidentPromedioAgitado}
          keyboardType="numeric"
          placeholder="Ej: 150"
          placeholderTextColor={COLORS.lightGray}
        />
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={handleSaveResident} disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.buttonText}>Guardar Cambios del Residente</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

// --- Estilos ---
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: IS_LARGE_SCREEN ? 18 : 16,
    color: COLORS.darkGray,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
    padding: 20,
  },
  errorText: {
    color: COLORS.errorRed,
    textAlign: 'center',
    fontSize: IS_LARGE_SCREEN ? 16 : 14,
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: COLORS.accentBlue,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: IS_LARGE_SCREEN ? 16 : 14,
    fontWeight: 'bold',
  },
  sectionContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: IS_LARGE_SCREEN ? 20 : 20, // Reduced padding
    marginBottom: IS_LARGE_SCREEN ? 20 : 20, // Reduced margin
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    width: '100%',
    maxWidth: IS_LARGE_SCREEN ? 380 : '100%', // Significantly reduced max width
  },
  sectionTitle: {
    fontSize: IS_LARGE_SCREEN ? 22 : 20, // Slightly smaller font
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginBottom: 20, // Reduced margin
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 10, // Reduced margin
  },
  inputLabel: {
    fontSize: IS_LARGE_SCREEN ? 14 : 13, // Slightly smaller font
    color: COLORS.darkText,
    marginBottom: 6, // Reduced margin
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 8,
    padding: IS_LARGE_SCREEN ? 10 : 8, // Reduced padding
    fontSize: IS_LARGE_SCREEN ? 15 : 14, // Slightly smaller font
    color: COLORS.darkText,
    backgroundColor: COLORS.inputBackground,
  },
  inputError: {
    borderColor: COLORS.errorRed,
    borderWidth: 2,
  },
  errorTextSmall: {
    color: COLORS.errorRed,
    fontSize: IS_LARGE_SCREEN ? 12 : 11, // Slightly smaller font
    marginTop: 4, // Reduced margin
    paddingLeft: 5,
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 8,
    backgroundColor: COLORS.inputBackground,
    paddingRight: 10,
  },
  dateTextInput: {
    flex: 1,
    padding: IS_LARGE_SCREEN ? 10 : 8, // Reduced padding
    fontSize: IS_LARGE_SCREEN ? 15 : 14, // Slightly smaller font
    color: COLORS.darkText,
  },
  calendarIcon: {
    marginLeft: 10,
  },
  datePickerWeb: {
    width: '100%',
    height: 40, // Reduced height
    color: COLORS.darkText,
    paddingHorizontal: 10,
    backgroundColor: 'transparent',
    borderWidth: 0,
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    appearance: 'none',
    outline: 'none',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 8,
    backgroundColor: COLORS.inputBackground,
  },
  picker: {
    height: Platform.OS === 'ios' ? 120 : 40, // Reduced height for picker
    width: '100%',
    color: COLORS.darkText,
  },
  pickerItem: {
    fontSize: IS_LARGE_SCREEN ? 15 : 14, // Slightly smaller font
    color: COLORS.darkText,
  },
  imagePickerButton: {
    alignItems: 'center',
    marginBottom: 10, // Reduced margin
  },
  profileImage: {
    width: 120, // Reduced size
    height: 120, // Reduced size
    borderRadius: 60, // Adjusted border radius
    marginBottom: 8, // Reduced margin
    borderColor: COLORS.primaryGreen,
    borderWidth: 3,
  },
  profileImagePlaceholder: {
    width: 120, // Reduced size
    height: 120, // Reduced size
    borderRadius: 60, // Adjusted border radius
    backgroundColor: COLORS.veryLightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8, // Reduced margin
    borderColor: COLORS.lightGray,
    borderWidth: 1,
  },
  imagePickerButtonText: {
    color: COLORS.accentBlue,
    fontSize: IS_LARGE_SCREEN ? 15 : 14, // Slightly smaller font
    fontWeight: 'bold',
  },
  removeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -5,
    marginBottom: 8, // Reduced margin
    padding: 5,
  },
  removeImageButtonText: {
    color: COLORS.errorRed,
    fontSize: IS_LARGE_SCREEN ? 13 : 12, // Slightly smaller font
    marginLeft: 5,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10, // Reduced margin
    paddingVertical: 8, // Reduced padding
    paddingHorizontal: 10,
    backgroundColor: COLORS.inputBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },
  primaryButton: {
    backgroundColor: COLORS.primaryGreen,
    paddingVertical: IS_LARGE_SCREEN ? 12 : 10, // Reduced padding
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15, // Reduced margin
    shadowColor: COLORS.darkGray,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
    width: '100%',
    maxWidth: IS_LARGE_SCREEN ? 350 : '100%', // Adjusted max width for button
  },
  buttonText: {
    color: COLORS.white,
    fontSize: IS_LARGE_SCREEN ? 16 : 15, // Slightly smaller font
    fontWeight: 'bold',
  },
});