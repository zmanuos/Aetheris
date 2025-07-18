import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
  Image,
  Switch, // Import Switch for the 'activo' field
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Config from '../../config/config';
import { useNotification } from '../../src/context/NotificationContext';
import BackButton from '../../components/shared/BackButton';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';

const API_URL = Config.API_BASE_URL;
const { width } = Dimensions.get('window');
const IS_LARGE_SCREEN = width > 900;

// --- COLORES BASADOS EN SIDEMENU.JS Y ResidentRegistrationScreen.js para consistencia ---
const PRIMARY_GREEN = '#6BB240';
const LIGHT_GREEN = '#9CD275';
const ACCENT_GREEN_BACKGROUND = '#EEF7E8';
const DARK_GRAY = '#333';
const MEDIUM_GRAY = '#555';
const LIGHT_GRAY = '#888';
const VERY_LIGHT_GRAY = '#eee';
const BACKGROUND_LIGHT = '#fcfcfc';
const WHITE = '#fff';

// Defined COLORS object for consistent usage in styles
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
  // Add other colors from ResidentRegistrationScreen for consistency if needed
  errorRed: '#DC3545',
  cardBackground: '#FFFFFF',
  pageBackground: '#F5F7FA',
  borderLight: '#E0E0E0',
  darkText: '#2C3E50', // From ResidentProfileScreen, good for general text
  lightText: '#7F8C8D', // From ResidentProfileScreen, good for general text
};

export default function ResidentEditScreen({ route, navigation }) {
  const { residentId } = route.params;
  const { showNotification } = useNotification();

  const [isLoading, setIsLoading] = useState(true);
  const [residentName, setResidentName] = useState('');
  const [residentApellido, setResidentApellido] = useState('');
  const [residentFechaNacimiento, setResidentFechaNacimiento] = useState(new Date());
  const [residentGenero, setResidentGenero] = useState('Masculino'); // Default or fetched
  const [residentTelefono, setResidentTelefono] = useState('');
  const [residentFoto, setResidentFoto] = useState('');
  const [residentDispositivoId, setResidentDispositivoId] = useState(0); // 0 for unassigned
  const [residentActivo, setResidentActivo] = useState(true); // Default to true
  const [residentPromedioReposo, setResidentPromedioReposo] = useState('');
  const [residentPromedioActivo, setResidentPromedioActivo] = useState('');
  const [residentPromedioAgitado, setResidentPromedioAgitado] = useState('');

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [availableDevices, setAvailableDevices] = useState([]); // State for available devices

  // Request permission for media library access
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permiso requerido', 'Necesitamos acceso a la galería para seleccionar una foto.');
        }
      }
    })();
  }, []);

  const fetchResidentData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/Residente/${residentId}`);
      const jsonResponse = await response.json();

      if (jsonResponse.status === 0 && jsonResponse.residente) {
        const residentData = jsonResponse.residente;
        setResidentName(residentData.nombre || '');
        setResidentApellido(residentData.apellido || '');
        setResidentFechaNacimiento(new Date(residentData.fecha_nacimiento));
        setResidentGenero(residentData.genero || 'Masculino');
        setResidentTelefono(residentData.telefono || '');
        setResidentFoto(residentData.foto || '');
        setResidentDispositivoId(residentData.dispositivo?.id_dispositivo || 0); // Handle nested device object
        setResidentActivo(residentData.activo);
        setResidentPromedioReposo(residentData.promedioReposo?.toString() || '');
        setResidentPromedioActivo(residentData.promedioActivo?.toString() || '');
        setResidentPromedioAgitado(residentData.promedioAgitado?.toString() || '');
      } else {
        showNotification(jsonResponse.message || 'Error al cargar los datos del residente.', 'error');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error fetching resident data:', error);
      showNotification('Error de conexión al cargar el residente.', 'error');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  }, [residentId, showNotification, navigation]);

  const fetchAvailableDevices = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/Dispositivo`); // Assuming an endpoint to get all devices
      const jsonResponse = await response.json();
      if (jsonResponse.status === 0 && jsonResponse.data) {
        // Filter out devices that are already assigned to other residents, unless it's the current resident's device
        const devices = jsonResponse.data.filter(device =>
          device.asignadoA === null || device.asignadoA === residentId
        );
        setAvailableDevices(devices);
      } else {
        showNotification('No se pudieron cargar los dispositivos disponibles.', 'warning');
      }
    } catch (error) {
      console.error('Error fetching available devices:', error);
      showNotification('Error de conexión al cargar dispositivos.', 'error');
    }
  }, [showNotification, residentId]);


  useEffect(() => {
    fetchResidentData();
    fetchAvailableDevices();
  }, [fetchResidentData, fetchAvailableDevices]);

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || residentFechaNacimiento;
    setShowDatePicker(Platform.OS === 'ios');
    setResidentFechaNacimiento(currentDate);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setResidentFoto(result.assets[0].uri);
      // For a PUT request with a string 'foto', you might need to upload the image separately
      // and get a URL/name back to set here, or rely on your backend to handle base64 encoding if applicable.
      // For this example, we assume residentFoto will be a URL/filename string.
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Basic validation
    if (!residentName || !residentApellido || !residentFechaNacimiento || !residentGenero || !residentTelefono) {
      showNotification('Todos los campos obligatorios deben ser completados.', 'error');
      setIsSaving(false);
      return;
    }

    const payload = {
      id_residente: residentId,
      nombre: residentName,
      apellido: residentApellido,
      fechaNacimiento: residentFechaNacimiento.toISOString(), // Ensure ISO 8601 format
      genero: residentGenero,
      telefono: residentTelefono,
      foto: residentFoto, // Send the photo string (URL or filename)
      dispositivo: residentDispositivoId,
      activo: residentActivo,
      promedio_reposo: parseInt(residentPromedioReposo || '0', 10),
      promedio_activo: parseInt(residentPromedioActivo || '0', 10),
      promedio_agitado: parseInt(residentPromedioAgitado || '0', 10),
    };

    try {
      const response = await fetch(`${API_URL}/Residente`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*', // Important for some APIs
        },
        body: JSON.stringify(payload),
      });

      const jsonResponse = await response.json();

      if (jsonResponse.status === 0) {
        showNotification(jsonResponse.message || 'Residente actualizado exitosamente.', 'success');
        navigation.goBack(); // Go back to the previous screen (e.g., Residents list or profile)
      } else {
        showNotification(jsonResponse.message || 'Error al actualizar el residente.', 'error');
      }
    } catch (error) {
      console.error('Error updating resident:', error);
      showNotification('Error de conexión al intentar actualizar el residente.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryGreen} />
        <Text style={styles.loadingText}>Cargando datos del residente...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.headerTitle}>Editar Residente</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Datos Personales</Text>

          {residentFoto ? (
            <Image source={{ uri: residentFoto }} style={styles.profileImage} />
          ) : (
            <Ionicons name="person-circle-outline" size={100} color={COLORS.lightGray} style={styles.profileImagePlaceholder} />
          )}
          <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
            <Text style={styles.imagePickerButtonText}>Cambiar Foto</Text>
            <Ionicons name="camera" size={20} color={COLORS.white} />
          </TouchableOpacity>

          <Text style={styles.inputLabel}>Nombre</Text>
          <TextInput
            style={styles.input}
            placeholder="Nombre"
            value={residentName}
            onChangeText={setResidentName}
          />

          <Text style={styles.inputLabel}>Apellido</Text>
          <TextInput
            style={styles.input}
            placeholder="Apellido"
            value={residentApellido}
            onChangeText={setResidentApellido}
          />

          <Text style={styles.inputLabel}>Fecha de Nacimiento</Text>
          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateInputContainer}>
            <Text style={styles.dateInputText}>
              {residentFechaNacimiento.toLocaleDateString('es-ES')}
            </Text>
            <Ionicons name="calendar-outline" size={24} color={COLORS.mediumGray} />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              testID="datePicker"
              value={residentFechaNacimiento}
              mode="date"
              display="default"
              onChange={onChangeDate}
            />
          )}
          {Platform.OS === 'web' && showDatePicker && (
            <View style={styles.webDatePickerBackdrop}>
              <View style={styles.webDatePickerContainer}>
                <DateTimePicker
                  testID="datePicker"
                  value={residentFechaNacimiento}
                  mode="date"
                  display="inline"
                  onChange={onChangeDate}
                />
                <TouchableOpacity onPress={() => setShowDatePicker(false)} style={styles.closeDatePickerButton}>
                  <Text style={styles.closeDatePickerButtonText}>Cerrar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <Text style={styles.inputLabel}>Género</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={residentGenero}
              onValueChange={(itemValue) => setResidentGenero(itemValue)}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              <Picker.Item label="Masculino" value="Masculino" />
              <Picker.Item label="Femenino" value="Femenino" />
              <Picker.Item label="Otro" value="Otro" />
            </Picker>
          </View>

          <Text style={styles.inputLabel}>Teléfono</Text>
          <TextInput
            style={styles.input}
            placeholder="Teléfono"
            value={residentTelefono}
            onChangeText={setResidentTelefono}
            keyboardType="phone-pad"
          />

          <Text style={styles.sectionTitle}>Asignación y Estado</Text>

          <Text style={styles.inputLabel}>Dispositivo Asignado</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={residentDispositivoId}
              onValueChange={(itemValue) => setResidentDispositivoId(itemValue)}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              <Picker.Item label="Sin Dispositivo" value={0} />
              {availableDevices.map((device) => (
                <Picker.Item key={device.id_dispositivo} label={`ID: ${device.id_dispositivo} (${device.tipo})`} value={device.id_dispositivo} />
              ))}
            </Picker>
          </View>

          <View style={styles.switchContainer}>
            <Text style={styles.inputLabel}>Estado Activo</Text>
            <Switch
              trackColor={{ false: COLORS.lightGray, true: COLORS.lightGreen }}
              thumbColor={residentActivo ? COLORS.primaryGreen : COLORS.mediumGray}
              onValueChange={setResidentActivo}
              value={residentActivo}
            />
          </View>

          <Text style={styles.sectionTitle}>Promedios de Ritmo Cardíaco</Text>

          <Text style={styles.inputLabel}>Promedio Reposo</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: 60"
            value={residentPromedioReposo}
            onChangeText={setResidentPromedioReposo}
            keyboardType="numeric"
          />

          <Text style={styles.inputLabel}>Promedio Activo</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: 120"
            value={residentPromedioActivo}
            onChangeText={setResidentPromedioActivo}
            keyboardType="numeric"
          />

          <Text style={styles.inputLabel}>Promedio Agitado</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: 150"
            value={residentPromedioAgitado}
            onChangeText={setResidentPromedioAgitado}
            keyboardType="numeric"
          />

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.saveButtonText}>Guardar Cambios</Text>
            )}
          </TouchableOpacity>
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
  scrollContainer: {
    flexGrow: 1,
    padding: IS_LARGE_SCREEN ? 30 : 20,
    alignItems: 'center',
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
    color: COLORS.darkText,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 800,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: IS_LARGE_SCREEN ? 26 : 22,
    fontWeight: 'bold',
    color: COLORS.darkText,
    marginLeft: 15,
  },
  formContainer: {
    width: '100%',
    maxWidth: 800,
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: IS_LARGE_SCREEN ? 30 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: IS_LARGE_SCREEN ? 20 : 18,
    fontWeight: 'bold',
    color: COLORS.primaryGreen,
    marginBottom: 15,
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.veryLightGray,
    paddingBottom: 8,
  },
  inputLabel: {
    fontSize: IS_LARGE_SCREEN ? 16 : 14,
    color: COLORS.darkText,
    marginBottom: 5,
    marginTop: 10,
    fontWeight: '600',
  },
  input: {
    height: 45,
    borderColor: COLORS.inputBorder,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: IS_LARGE_SCREEN ? 16 : 14,
    color: COLORS.darkText,
    backgroundColor: COLORS.inputBackground,
    marginBottom: 15,
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 45,
    borderColor: COLORS.inputBorder,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: COLORS.inputBackground,
    marginBottom: 15,
  },
  dateInputText: {
    flex: 1,
    fontSize: IS_LARGE_SCREEN ? 16 : 14,
    color: COLORS.darkText,
  },
  webDatePickerBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  webDatePickerContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 20,
    maxWidth: 400,
    width: '90%',
  },
  closeDatePickerButton: {
    marginTop: 15,
    padding: 10,
    backgroundColor: COLORS.primaryGreen,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeDatePickerButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  pickerContainer: {
    borderColor: COLORS.inputBorder,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: COLORS.inputBackground,
  },
  picker: {
    height: 45,
    width: '100%',
    color: COLORS.darkText,
  },
  pickerItem: {
    fontSize: IS_LARGE_SCREEN ? 16 : 14,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingVertical: 5,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
    marginBottom: 15,
    borderColor: COLORS.primaryGreen,
    borderWidth: 2,
  },
  profileImagePlaceholder: {
    alignSelf: 'center',
    marginBottom: 15,
  },
  imagePickerButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.accentBlue, // A distinct color for image picker
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
    gap: 10,
  },
  imagePickerButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: COLORS.primaryGreen,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: IS_LARGE_SCREEN ? 18 : 16,
    fontWeight: 'bold',
  },
});