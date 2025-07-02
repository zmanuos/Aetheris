import React, { useState, useEffect } from 'react';
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
import { StackActions } from '@react-navigation/native'; 

// Ajusta la ruta de config si es necesario, asumo que está a 2 niveles arriba
import Config from '../../config/config'; 
const API_URL = Config.API_BASE_URL;

export default function FamiliarRegistrationScreen({ navigation, route }) {
  const { residentId, residentSummary } = route.params;

  const [familiarName, setFamiliarName] = useState('');
  const [familiarApellido, setFamiliarApellido] = useState('');
  const [familiarFechaNacimiento, setFamiliarFechaNacimiento] = useState(new Date());
  const [showFamiliarDatePicker, setShowFamiliarDatePicker] = useState(false);
  const [familiarGenero, setFamiliarGenero] = useState('');
  const [familiarTelefono, setFamiliarTelefono] = useState('');
  const [familiarParentesco, setFamiliarParentesco] = useState('');
  const [familiarFirebaseEmail, setFamiliarFirebaseEmail] = useState('');
  const [familiarFirebasePassword, setFamiliarFirebasePassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [parentescos, setParentescos] = useState([]);

  useEffect(() => {
    const fetchParentescos = async () => {
      try {
        const response = await fetch(`${API_URL}/Parentesco`);
        const data = await response.json();
        if (response.ok && data.data) {
          setParentescos(data.data);
        } else {
          console.error('Error al cargar parentescos:', data.message || 'Error desconocido');
          // Fallback en caso de error o datos vacíos
          setParentescos([
            { id: 1, nombre: 'Hijo/a' }, { id: 2, nombre: 'Cónyuge' },
            { id: 3, nombre: 'Hermano/a' }, { id: 4, nombre: 'Nieto/a' },
            { id: 5, nombre: 'Sobrino/a' }, { id: 6, nombre: 'Otro' },
          ]);
        }
      } catch (error) {
        console.error('Error de conexión al cargar parentescos:', error);
        // Fallback en caso de error de conexión
        setParentescos([
          { id: 1, nombre: 'Hijo/a' }, { id: 2, nombre: 'Cónyuge' },
          { id: 3, nombre: 'Hermano/a' }, { id: 4, nombre: 'Nieto/a' },
          { id: 5, nombre: 'Sobrino/a' }, { id: 6, nombre: 'Otro' },
        ]);
      }
    };
    fetchParentescos();
  }, []);

  const onChangeFamiliarDate = (event, selectedDate) => {
    const currentDate = selectedDate || familiarFechaNacimiento;
    setShowFamiliarDatePicker(Platform.OS === 'ios');
    setFamiliarFechaNacimiento(currentDate);
  };

  const handleRegisterFamiliar = async () => {
    if (!familiarName || !familiarApellido || !familiarGenero || !familiarTelefono || !familiarParentesco || !familiarFirebaseEmail || !familiarFirebasePassword) {
      Alert.alert('Error', 'Por favor, completa todos los campos obligatorios del familiar, incluyendo email y contraseña para el acceso.');
      return;
    }
    if (!residentId) {
        Alert.alert('Error', 'Error: No se encontró el ID del residente asociado.');
        return;
    }

    setIsLoading(true);
    let firebaseUid = null;

    try {
        console.log("Simulando creación de usuario Firebase con:", familiarFirebaseEmail, familiarFirebasePassword);
        // Aquí iría tu lógica real de creación de usuario en Firebase
        // Por ahora, simulamos un UID para la demostración
        firebaseUid = `mock_${Math.random().toString(36).substring(2, 15)}`; 
        console.log("UID de Firebase simulado:", firebaseUid);
        // Alert.alert('Firebase', 'Usuario Firebase simulado creado exitosamente. ID: ' + firebaseUid); // Descomentar para depurar si es necesario

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

    // Asumiendo que el backend de SQL también necesita estos para crear o vincular al usuario de familiar
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

      if (response.ok && data.status === 0) { 
        console.log("Familiar registrado exitosamente. Procediendo con la redirección."); // Log de depuración
        
        // --- INICIO DEL CAMBIO ---
        // Despacha la acción de navegación INMEDIATAMENTE
        navigation.dispatch(StackActions.popToTop());

        // Muestra la alerta de éxito. En web, puede que no se vea, pero la navegación ya se activó.
        Alert.alert('Éxito', 'Familiar registrado exitosamente en la base de datos SQL.');
        // --- FIN DEL CAMBIO ---
        
      } else {
        if (data.errors) {
            let errorMessages = Object.values(data.errors).map(errArray => errArray.join(', ')).join('\n');
            Alert.alert('Error de Validación', `Por favor, corrige los siguientes errores:\n${errorMessages}`);
        } else {
            // Manejo de errores más específico si data.status no es 0 pero la respuesta fue OK
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
        <Text style={styles.title}>Registro de Familiar</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.container}>
        {residentSummary && (
          <View style={styles.residentSummaryCard}>
            <Text style={styles.summaryTitle}>Resumen del Residente</Text>
            {residentSummary.fotoPreview && (
              <Image source={{ uri: residentSummary.fotoPreview }} style={styles.residentPhotoSummary} />
            )}
            <Text style={styles.summaryText}>**Nombre:** {residentSummary.name} {residentSummary.apellido}</Text>
            <Text style={styles.summaryText}>**Fecha Nac:** {residentSummary.fechaNacimiento}</Text>
            <Text style={styles.summaryText}>**Género:** {residentSummary.genero}</Text>
            <Text style={styles.summaryText}>**Teléfono:** {residentSummary.telefono}</Text>
            <Text style={styles.summaryText}>**ID:** {residentId}</Text>
          </View>
        )}

        <View style={[styles.formSection, styles.familiarSection]}>
          <Text style={styles.sectionTitle}>2. Datos del Familiar</Text>
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
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Registrar Familiar</Text>
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
  residentPhotoPreview: {
    width: 150,
    height: 150,
    borderRadius: 75,
    alignSelf: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  residentSummaryCard: {
    backgroundColor: '#e0f7fa',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#b2ebf2',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007BFF',
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
    lineHeight: 20,
  },
  residentPhotoSummary: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#007BFF',
  },
});