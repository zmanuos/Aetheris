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

import Config from '../../config/config';
const API_URL = Config.API_BASE_URL;

export default function RegisterResidentScreen({ navigation }) {
  const [residentName, setResidentName] = useState('');
  const [residentApellido, setResidentApellido] = useState('');
  const [residentFechaNacimiento, setResidentFechaNacimiento] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [residentGenero, setResidentGenero] = useState('');
  const [residentTelefono, setResidentTelefono] = useState('');
  
  // residentPhotoDataRef ahora guardará el objeto Blob/File listo para FormData
  const residentPhotoDataRef = useRef(null); 
  const [residentFotoPreview, setResidentFotoPreview] = useState(null);

  const [familiarName, setFamiliarName] = useState('');
  const [familiarApellido, setFamiliarApellido] = useState('');
  const [familiarFechaNacimiento, setFamiliarFechaNacimiento] = useState(new Date());
  const [showFamiliarDatePicker, setShowFamiliarDatePicker] = useState(false);
  const [familiarGenero, setFamiliarGenero] = useState('');
  const [familiarTelefono, setFamiliarTelefono] = useState('');
  const [familiarParentesco, setFamiliarParentesco] = useState('');
  const [familiarFirebaseEmail, setFamiliarFirebaseEmail] = useState('');
  const [familiarFirebasePassword, setFamiliarFirebasePassword] = useState('');

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [residentId, setResidentId] = useState(null);

  const [parentescos, setParentescos] = useState([]);

  useEffect(() => {
    console.log('*** [useEffect] Cambio en residentFotoPreview:', residentFotoPreview);
    if (residentFotoPreview) {
      console.log('*** [useEffect] URI de residentFotoPreview:', residentFotoPreview);
    }
  }, [residentFotoPreview]);

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

  const onChangeResidentDate = (event, selectedDate) => {
    const currentDate = selectedDate || residentFechaNacimiento;
    setShowDatePicker(Platform.OS === 'ios');
    setResidentFechaNacimiento(currentDate);
  };

  const onChangeFamiliarDate = (event, selectedDate) => {
    const currentDate = selectedDate || familiarFechaNacimiento;
    setShowFamiliarDatePicker(Platform.OS === 'ios');
    setFamiliarFechaNacimiento(currentDate);
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
      console.log('Imagen seleccionada URI (desde pickImage):', assetUri);

      let imageDataForUpload = null;
      let previewUri = assetUri;

      if (assetUri.startsWith('data:')) {
        // Es un data URI, necesitamos convertirlo a Blob
        try {
          const response = await fetch(assetUri);
          const blob = await response.blob();
          
          const match = assetUri.match(/^data:(.*?);base64,/);
          const mimeType = match ? match[1] : 'image/jpeg';
          let extension = mimeType.split('/')[1] || 'jpeg'; // Extrae la extensión del tipo MIME

          imageDataForUpload = { blob, name: `photo.${extension}`, type: mimeType };
          console.log('Convertido data URI a Blob:', imageDataForUpload);
        } catch (blobError) {
          console.error('Error al convertir data URI a Blob:', blobError);
          Alert.alert('Error', 'No se pudo procesar la imagen seleccionada.');
          residentPhotoDataRef.current = null;
          setResidentFotoPreview(null);
          return;
        }
      } else {
        // Es un URI de archivo normal (file:// o assets-library://), puede usarse directamente
        // Aseguramos que tenemos nombre y tipo correctos
        let filename = assetUri.split('/').pop();
        let type = 'image/jpeg'; // Default, you might want to infer more robustly
        const extensionMatch = filename.match(/\.([0-9a-z]+)(?:[\?#]|$)/i);
        if (extensionMatch) {
            const ext = extensionMatch[1].toLowerCase();
            switch(ext) {
                case 'png': type = 'image/png'; break;
                case 'jpg':
                case 'jpeg': type = 'image/jpeg'; break;
                case 'gif': type = 'image/gif'; break;
                default: type = 'application/octet-stream';
            }
        }
        imageDataForUpload = { uri: assetUri, name: filename, type: type };
        console.log('Usando URI de archivo:', imageDataForUpload);
      }
      
      residentPhotoDataRef.current = imageDataForUpload;
      setResidentFotoPreview(previewUri); // Siempre usamos el URI original para la vista previa
    } else {
      console.log('Selección de imagen cancelada (desde pickImage).');
      residentPhotoDataRef.current = null;
      setResidentFotoPreview(null);
    }
  };

  const handleRegisterResident = async () => {
    const currentResidentPhotoData = residentPhotoDataRef.current;
    console.log('*** [handleRegisterResident] Valor de residentPhotoDataRef.current al inicio de la función:', currentResidentPhotoData);

    if (!residentName || !residentApellido || !residentGenero || !residentTelefono) {
      Alert.alert('Error', 'Por favor, completa todos los campos obligatorios del residente.');
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('nombre', residentName);
    formData.append('apellido', residentApellido);

    const year = residentFechaNacimiento.getFullYear();
    const month = String(residentFechaNacimiento.getMonth() + 1).padStart(2, '0');
    const day = String(residentFechaNacimiento.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`; 
    formData.append('fechaNacimiento', formattedDate);

    formData.append('genero', residentGenero);
    formData.append('telefono', residentTelefono);

    let newResidentId = null;

    console.log('Datos del residente a enviar (FormData):');
    for (let pair of formData.entries()) {
      console.log(pair[0] + ': ' + pair[1]);
    }

    try {
      const response = await fetch(`${API_URL}/Residente`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      console.log('Respuesta de la API al registrar residente:', data);

        if (response.ok && data && data.status === 0)  { 
        newResidentId = data.data?.id_residente || null; 
        console.log('ID de nuevo residente extraído (valor y tipo):', newResidentId, typeof newResidentId); 

        if (newResidentId) { 
            setResidentId(newResidentId);

            console.log('Valor actual de currentResidentPhotoData ANTES de la subida dentro del IF:', currentResidentPhotoData);
            console.log('¿La lógica de subida de foto se ejecutará? (basado en currentResidentPhotoData dentro del IF)', !!currentResidentPhotoData);

            if (currentResidentPhotoData) {
                console.log('Iniciando subida de foto para residente ID:', newResidentId);
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
                
                console.log('Datos de la foto a enviar (FormData para foto):');
                for (let pair of photoUploadFormData.entries()) {
                  console.log(pair[0] + ': ' + (typeof pair[1] === 'object' ? '[Object Blob/File]' : pair[1]));
                }

                try {
                    const photoUploadResponse = await fetch(`${API_URL}/Residente/UploadPhoto`, {
                        method: 'POST',
                        body: photoUploadFormData,
                    });

                    console.log('Estado de la respuesta de subida de foto:', photoUploadResponse.status);

                    if (photoUploadResponse.ok) {
                        console.log('Foto subida exitosamente.');
                    } else {
                        const errorText = await photoUploadResponse.text();
                        console.error('Error al subir la foto. Código de estado:', photoUploadResponse.status, 'Respuesta:', errorText);
                        
                        try {
                            const errorData = JSON.parse(errorText);
                            Alert.alert('Error al subir foto', errorData.message || 'Ocurrió un error al subir la imagen.');
                        } catch (parseError) {
                            Alert.alert('Error al subir foto', `Ocurrió un error inesperado al subir la imagen: ${errorText}`);
                        }
                    }
                } catch (photoError) {
                    console.error('Error de conexión al subir la foto:', photoError);
                    Alert.alert('Error de Conexión', 'No se pudo conectar con el servidor para subir la foto.');
                }
            } else {
                console.log('No se seleccionó foto, la subida de foto fue omitida.');
            }

            Alert.alert('Éxito', 'Residente registrado exitosamente. Ahora registra al familiar.');
            setCurrentStep(2);
        } else {
            Alert.alert('Advertencia', 'Residente registrado, pero no se recibió el ID. No se puede continuar al siguiente paso.');
            console.error('ID del residente no recibido en la respuesta (verifica la estructura del JSON):', data);
        }
      } else {
        Alert.alert('Error al Registrar Residente', data.message || 'Ocurrió un error inesperado.');
      }
    } catch (error) {
      console.error('Error registrando residente:', error);
      Alert.alert('Error de Conexión', 'No se pudo conectar con el servidor para registrar al residente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterFamiliar = async () => {
    if (!familiarName || !familiarApellido || !familiarGenero || !familiarTelefono || !familiarParentesco || !familiarFirebaseEmail || !familiarFirebasePassword) {
      Alert.alert('Error', 'Por favor, completa todos los campos obligatorios del familiar, incluyendo email y contraseña para el acceso.');
      return;
    }
    if (!residentId) {
        Alert.alert('Error', 'Primero debes registrar al residente.');
        return;
    }

    setIsLoading(true);
    let firebaseUid = null;

    try {
        console.log("Simulando creación de usuario Firebase con:", familiarFirebaseEmail, familiarFirebasePassword);
        firebaseUid = `mock_${Math.random().toString(36).substring(2, 15)}`; 
        console.log("UID de Firebase simulado:", firebaseUid);
        Alert.alert('Firebase', 'Usuario Firebase simulado creado exitosamente. ID: ' + firebaseUid);

    } catch (firebaseError) {
        console.error("Error al crear usuario Firebase:", firebaseError);
        Alert.alert("Error Firebase", `No se pudo crear el usuario en Firebase: ${firebaseError.message}`);
        setIsLoading(false);
        return;
    }

    const formDataFamiliar = new FormData();
    formDataFamiliar.append('nombre', familiarName);
    formDataFamiliar.append('apellido', familiarApellido);
    
    const familiarYear = familiarFechaNacimiento.getFullYear();
    const familiarMonth = String(familiarFechaNacimiento.getMonth() + 1).padStart(2, '0');
    const familiarDay = String(familiarFechaNacimiento.getDate()).padStart(2, '0');
    const formattedFamiliarDate = `${familiarYear}-${familiarMonth}-${familiarDay}`;
    formDataFamiliar.append('fechaNacimiento', formattedFamiliarDate);

    formDataFamiliar.append('genero', familiarGenero);
    formDataFamiliar.append('telefono', familiarTelefono);
    formDataFamiliar.append('id_residente', residentId.toString());
    formDataFamiliar.append('id_parentesco', familiarParentesco);
    formDataFamiliar.append('firebase_uid', firebaseUid);

    formDataFamiliar.append('email', familiarFirebaseEmail);
    formDataFamiliar.append('contra', familiarFirebasePassword);

    console.log('Datos del familiar a enviar (FormData):');
    for (let pair of formDataFamiliar.entries()) {
      console.log(pair[0] + ': ' + pair[1]);
    }

    try {
      const response = await fetch(`${API_URL}/Familiar`, {
        method: 'POST',
        body: formDataFamiliar,
      });

      const data = await response.json();
      console.log('Respuesta de la API al registrar familiar:', data);

      if (response.ok && data.code === 0) { 
        Alert.alert('Éxito', 'Familiar registrado exitosamente en la base de datos SQL.');
        navigation.goBack();
      } else {
        if (data.errors) {
            let errorMessages = Object.values(data.errors).map(errArray => errArray.join(', ')).join('\n');
            Alert.alert('Error de Validación', `Por favor, corrige los siguientes errores:\n${errorMessages}`);
        } else {
            Alert.alert('Error al Registrar Familiar', data.message || 'Ocurrió un error inesperado al guardar datos personales.');
        }
      }
    } catch (error) {
      console.error('Error registrando familiar en SQL:', error);
      Alert.alert('Error de Conexión', 'No se pudo conectar con el servidor para registrar al familiar en SQL.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Nuevo Residente</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.container}>
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>1. Datos del Residente</Text>
          <TextInput style={styles.input} placeholder="Nombre" value={residentName} onChangeText={setResidentName} />
          <TextInput style={styles.input} placeholder="Apellido" value={residentApellido} onChangeText={setResidentApellido} />
          <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.dateInputText}>
              Fecha de Nacimiento: {residentFechaNacimiento.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              testID="residentDatePicker"
              value={residentFechaNacimiento}
              mode="date"
              display="default"
              onChange={onChangeResidentDate}
            />
          )}
          <TextInput style={styles.input} placeholder="Género (Ej: Masculino, Femenino)" value={residentGenero} onChangeText={setResidentGenero} />
          <TextInput style={styles.input} placeholder="Teléfono (Ej: 5512345678)" value={residentTelefono} onChangeText={setResidentTelefono} keyboardType="phone-pad" />
          
          <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
            <Ionicons name="camera-outline" size={24} color="#FFF" />
            <Text style={styles.imagePickerButtonText}>Seleccionar Foto</Text>
          </TouchableOpacity>
          {residentFotoPreview && (
            <Image source={{ uri: residentFotoPreview }} style={styles.residentPhotoPreview} />
          )}

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleRegisterResident}
            disabled={isLoading || currentStep === 2}
          >
            {isLoading && currentStep === 1 ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {currentStep === 1 ? 'Registrar Residente y Continuar' : 'Residente Registrado'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {currentStep === 2 && (
          <View style={[styles.formSection, styles.familiarSection]}>
            <Text style={styles.sectionTitle}>2. Datos del Familiar</Text>
            <Text style={styles.infoText}>Asociado al Residente ID: {residentId}</Text>
            <TextInput style={styles.input} placeholder="Nombre Familiar" value={familiarName} onChangeText={setFamiliarName} />
            <TextInput style={styles.input} placeholder="Apellido Familiar" value={familiarApellido} onChangeText={setFamiliarApellido} />
            <TouchableOpacity style={styles.input} onPress={() => setShowFamiliarDatePicker(true)}>
                <Text style={styles.dateInputText}>
                    Fecha de Nacimiento Familiar: {familiarFechaNacimiento.toLocaleDateString()}
                </Text>
            </TouchableOpacity>
            {showFamiliarDatePicker && (
                <DateTimePicker
                testID="familiarDatePicker"
                value={familiarFechaNacimiento}
                mode="date"
                display="default"
                onChange={onChangeFamiliarDate}
                />
            )}
            <TextInput style={styles.input} placeholder="Género Familiar (Ej: Masculino, Femenino)" value={familiarGenero} onChangeText={setFamiliarGenero} />
            <TextInput style={styles.input} placeholder="Teléfono Familiar" value={familiarTelefono} onChangeText={setFamiliarTelefono} keyboardType="phone-pad" />

            <Text style={styles.sectionSubtitle}>Credenciales de Acceso para el Familiar</Text>
            <TextInput
              style={styles.input}
              placeholder="Email (para acceso Firebase)"
              value={familiarFirebaseEmail}
              onChangeText={setFamiliarFirebaseEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Contraseña (para acceso Firebase)"
              value={familiarFirebasePassword}
              onChangeText={setFamiliarFirebasePassword}
              secureTextEntry={true}
            />

            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Parentesco:</Text>
              {Platform.OS === 'ios' ? (
                <Picker
                  selectedValue={familiarParentesco}
                  onValueChange={(itemValue) => setFamiliarParentesco(itemValue)}
                  style={styles.picker}
                >
                  <Picker.Item label="Selecciona un parentesco" value="" />
                  {parentescos.map((p) => (
                    <Picker.Item key={p.id} label={p.nombre} value={p.id.toString()} />
                  ))}
                </Picker>
              ) : (
                <View style={styles.androidPicker}>
                  <Picker
                    selectedValue={familiarParentesco}
                    onValueChange={(itemValue) => setFamiliarParentesco(itemValue)}
                  >
                    <Picker.Item label="Selecciona un parentesco" value="" />
                    {parentescos.map((p) => (
                      <Picker.Item key={p.id} label={p.nombre} value={p.id.toString()} />
                    ))}
                  </Picker>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleRegisterFamiliar}
              disabled={isLoading}
            >
              {isLoading && currentStep === 2 ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Registrar Familiar</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  backButton: {
    position: 'absolute',
    left: 15,
    top: Platform.OS === 'android' ? 30 : 15,
    zIndex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  container: {
    flex: 1,
    padding: 15,
  },
  formSection: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#555',
    marginTop: 10,
    marginBottom: 10,
  },
  input: {
    height: 45,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    color: '#333',
    justifyContent: 'center',
  },
  dateInputText: {
    fontSize: 16,
    color: '#333',
  },
  primaryButton: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  familiarSection: {
    borderColor: '#10B981',
    borderWidth: 1,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 15,
    textAlign: 'center',
  },
  pickerContainer: {
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    overflow: 'hidden',
  },
  pickerLabel: {
    fontSize: 12,
    color: '#6B7280',
    paddingHorizontal: 15,
    paddingTop: 5,
  },
  picker: {
    height: 40,
    width: '100%',
    color: '#333',
  },
  androidPicker: {
    height: 45,
    justifyContent: 'center',
  },
  imagePickerButton: {
    flexDirection: 'row',
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  imagePickerButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  residentPhotoPreview: {
    width: 150,
    height: 150,
    borderRadius: 75,
    alignSelf: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
});