// AETHERIS/screens/admin/CreateConsultaScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';

const PRIMARY_GREEN = '#6BB240';
const LIGHT_GRAY = '#ccc';
const DARK_GRAY = '#333';
const BACKGROUND_LIGHT = '#f9f9f9';
const WHITE = '#fff';

const { width, height } = Dimensions.get('window');
const IS_LARGE_SCREEN = width > 900;

export default function CreateConsultaScreen() {
  const [idResidente, setIdResidente] = useState('');
  const [frecuencia, setFrecuencia] = useState('');
  const [oxigeno, setOxigeno] = useState('');
  const [temperatura, setTemperatura] = useState('');
  const [peso, setPeso] = useState('');
  const [estatura, setEstatura] = useState('');

  const [residentes, setResidentes] = useState([
    { id: 1, nombre: 'María González' },
    { id: 2, nombre: 'Jorge Martínez' },
    { id: 3, nombre: 'Luz Ramírez' },
  ]);

  const handleGuardar = () => {
    // Aquí puedes agregar lógica de validación o enviar los datos al backend más adelante
    console.log({
      idResidente,
      frecuencia,
      oxigeno,
      temperatura,
      peso,
      estatura,
    });
  };

  const residenteSeleccionado = residentes.find((r) => r.id === idResidente);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Nueva Consulta</Text>

      {/* Selector de residente */}
      <View style={styles.fieldWrapper}>
        <Text style={styles.inputLabel}>Residente</Text>
        <View style={styles.pickerInputContainer}>
          <Ionicons name="people-outline" size={18} color={DARK_GRAY} style={styles.inputIcon} />
          <Picker
            selectedValue={idResidente}
            onValueChange={(itemValue) => setIdResidente(Number(itemValue))}
            style={styles.picker}
          >
            <Picker.Item label="-- Selecciona un residente --" value="" />
            {residentes.map((res) => (
              <Picker.Item key={res.id} label={res.nombre} value={res.id} />
            ))}
          </Picker>
        </View>
      </View>

      {/* Info del residente (simulada) */}
      {residenteSeleccionado && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}> <Text style={styles.infoLabel}>Nombre:</Text> {residenteSeleccionado.nombre}</Text>
          <Text style={styles.infoText}> <Text style={styles.infoLabel}>Edad:</Text> 82 años</Text>
          <Text style={styles.infoText}> <Text style={styles.infoLabel}>Teléfono:</Text> 664-123-4567</Text>
          <Text style={styles.infoText}> <Text style={styles.infoLabel}>Área asignada:</Text> Dormitorio</Text>
        </View>
      )}

      {/* Campos clínicos */}
      <View style={styles.fieldWrapper}>
        <Text style={styles.inputLabel}>Frecuencia cardíaca (lpm)</Text>
        <TextInput
          style={styles.input}
          value={frecuencia}
          onChangeText={setFrecuencia}
          placeholder="Ej: 75"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.fieldWrapper}>
        <Text style={styles.inputLabel}>Oxigenación (%)</Text>
        <TextInput
          style={styles.input}
          value={oxigeno}
          onChangeText={setOxigeno}
          placeholder="Ej: 96.5"
          keyboardType="decimal-pad"
        />
      </View>

      <View style={styles.fieldWrapper}>
        <Text style={styles.inputLabel}>Temperatura (°C)</Text>
        <TextInput
          style={styles.input}
          value={temperatura}
          onChangeText={setTemperatura}
          placeholder="Ej: 36.5"
          keyboardType="decimal-pad"
        />
      </View>

      <View style={styles.fieldWrapper}>
        <Text style={styles.inputLabel}>Peso (kg)</Text>
        <TextInput
          style={styles.input}
          value={peso}
          onChangeText={setPeso}
          placeholder="Ej: 60.2"
          keyboardType="decimal-pad"
        />
      </View>

      <View style={styles.fieldWrapper}>
        <Text style={styles.inputLabel}>Estatura (cm)</Text>
        <TextInput
          style={styles.input}
          value={estatura}
          onChangeText={setEstatura}
          placeholder="Ej: 158"
          keyboardType="numeric"
        />
      </View>

      {/* Botón Guardar */}
      <TouchableOpacity style={styles.primaryButton} onPress={handleGuardar}>
        <Text style={styles.primaryButtonText}>GUARDAR CONSULTA</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: WHITE,
    paddingVertical: 30,
    paddingHorizontal: 18,
    borderRadius: 15,
    marginTop: 20,
    marginHorizontal: '5%',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: DARK_GRAY,
    marginBottom: 20,
    textAlign: 'center',
  },
  fieldWrapper: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: DARK_GRAY,
    marginBottom: 4,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1.5,
    borderColor: LIGHT_GRAY,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: BACKGROUND_LIGHT,
    height: 45,
    fontSize: 15,
    color: DARK_GRAY,
  },
  pickerInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: BACKGROUND_LIGHT,
    borderWidth: 1.5,
    borderColor: LIGHT_GRAY,
    paddingHorizontal: 10,
    height: 45,
  },
  inputIcon: {
    marginRight: 8,
  },
  picker: {
    flex: 1,
    color: DARK_GRAY,
    fontSize: 15,
  },
  infoBox: {
    backgroundColor: '#F3F9EE',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: PRIMARY_GREEN,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#444',
  },
  infoLabel: {
    fontWeight: 'bold',
  },
  primaryButton: {
    backgroundColor: PRIMARY_GREEN,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 25,
    marginBottom: 10,
  },
  primaryButtonText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
