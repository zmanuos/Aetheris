// AETHERIS/screens/employee/ResidentRegistrationScreen.js
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
import * as ImagePicker from 'expo-image-picker'; 

// Ajusta la ruta de config si es necesario
import Config from '../../config/config'; 
const API_URL = Config.API_BASE_URL;

export default function ResidentRegistrationScreen({ navigation }) {
  const [residentName, setResidentName] = useState('');
  const [residentApellido, setResidentApellido] = useState('');
  const [residentFechaNacimiento, setResidentFechaNacimiento] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [residentGenero, setResidentGenero] = useState('');
  const [residentTelefono, setResidentTelefono] = useState('');
  
  const residentPhotoDataRef = useRef(null); 
  const [residentFotoPreview, setResidentFotoPreview] = useState(null);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    console.log('*** [useEffect] Cambio en residentFotoPreview:', residentFotoPreview);
    if (residentFotoPreview) {
      console.log('*** [useEffect] URI de residentFotoPreview:', residentFotoPreview);
    }
  }, [residentFotoPreview]);

  const onChangeResidentDate = (event, selectedDate) => {
    const currentDate = selectedDate || residentFechaNacimiento;
    setShowDatePicker(Platform.OS === 'ios');
    setResidentFechaNacimiento(currentDate);
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
        try {
          const response = await fetch(assetUri);
          const blob = await response.blob();
          
          const match = assetUri.match(/^data:(.*?);base64,/);
          const mimeType = match ? match[1] : 'image/jpeg';
          let extension = mimeType.split('/')[1] || 'jpeg';

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
        let filename = assetUri.split('/').pop();
        let type = 'image/jpeg';
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
      setResidentFotoPreview(previewUri);
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

            // <-- ESTA LÍNEA NAVEGA AL FORMULARIO DEL FAMILIAR -->
            navigation.navigate('FamiliarRegistrationScreen', { // <-- Nombre de ruta crucial
              residentId: newResidentId,
              residentSummary: {
                name: residentName,
                apellido: residentApellido,
                fechaNacimiento: residentFechaNacimiento.toLocaleDateString(),
                genero: residentGenero,
                telefono: residentTelefono,
                fotoPreview: residentFotoPreview,
              },
            });

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
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Registrar Residente y Continuar</Text>
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