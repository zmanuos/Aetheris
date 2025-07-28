import React, { useState, useRef, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Switch,
  Dimensions,
} from 'react-native';

const PRIMARY_GREEN = '#6BB240';
const LIGHT_GREEN = '#9CD275';
const ACCENT_GREEN_BACKGROUND = '#EEF7E8';
const DARK_GRAY = '#333';
const MEDIUM_GRAY = '#555';
const LIGHT_GRAY = '#888';
const VERY_LIGHT_GRAY = '#eee';
const BACKGROUND_LIGHT = '#fcfcfc';
const WHITE = '#fff';

const { width } = Dimensions.get('window');
const IS_LARGE_SCREEN = width > 900;
const AUTO_CAPTURE_DELAY = 3000; // milisegundos (3 segundos)

export default function CreateConsultaScreen() {
  // Estados para los campos del formulario
  const [frecuencia, setFrecuencia] = useState('');
  const [oxigeno, setOxigeno] = useState('');
  const [temperatura, setTemperatura] = useState('');
  const [peso, setPeso] = useState('');
  const [estatura, setEstatura] = useState('');
  const [observaciones, setObservaciones] = useState('');

  // Estado para el switch global
  const [autoFillEnabled, setAutoFillEnabled] = useState(true);

  // Estado para los datos en tiempo real
  const [sensorData, setSensorData] = useState({
    Spo2: '',
    Pulso: '',
    TemperaturaCorporal: '',
    Peso: '',
    Altura: '',
  });

  // Estados para los valores congelados
  const [frozenSpo2, setFrozenSpo2] = useState(null);
  const [frozenPulso, setFrozenPulso] = useState(null);
  const [frozenTemp, setFrozenTemp] = useState(null);
  const [frozenPeso, setFrozenPeso] = useState(null);
  const [frozenAltura, setFrozenAltura] = useState(null);

  // Refs para los temporizadores de autocaptura
  const spo2Timer = useRef(null);
  const pulsoTimer = useRef(null);
  const tempTimer = useRef(null);
  const pesoTimer = useRef(null);
  const alturaTimer = useRef(null);

  // Guardar el último valor recibido para cada sensor
  const lastSpo2 = useRef('');
  const lastPulso = useRef('');
  const lastTemp = useRef('');
  const lastPeso = useRef('');
  const lastAltura = useRef('');

  // WebSocket
  const ws = useRef(null);

  // Función para iniciar/reiniciar el temporizador de cada sensor
  const startOrResetTimer = (type, value) => {
    const setFrozen = {
      Spo2: setFrozenSpo2,
      Pulso: setFrozenPulso,
      Temp: setFrozenTemp,
      Peso: setFrozenPeso,
      Altura: setFrozenAltura,
    };
    const setForm = {
      Spo2: setOxigeno,
      Pulso: setFrecuencia,
      Temp: setTemperatura,
      Peso: setPeso,
      Altura: setEstatura,
    };
    const timers = {
      Spo2: spo2Timer,
      Pulso: pulsoTimer,
      Temp: tempTimer,
      Peso: pesoTimer,
      Altura: alturaTimer,
    };
    // Limpia el temporizador anterior
    clearTimeout(timers[type].current);
    // Inicia uno nuevo
    timers[type].current = setTimeout(() => {
      setFrozen[type](value);
      setForm[type](value);
    }, AUTO_CAPTURE_DELAY);
  };

  // Efecto para manejar WebSocket y autocaptura
  useEffect(() => {
    if (!autoFillEnabled) return;
    ws.current = new WebSocket('ws://localhost:5214/ws/sensor_data');
    ws.current.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);

        // --- SpO2 ---
        if (frozenSpo2 === null) {
          if (data.Spo2 !== undefined && data.Spo2 !== lastSpo2.current) {
            lastSpo2.current = data.Spo2;
            startOrResetTimer('Spo2', data.Spo2);
          }
        }
        // --- Pulso ---
        if (frozenPulso === null) {
          if (data.Pulso !== undefined && data.Pulso !== lastPulso.current) {
            lastPulso.current = data.Pulso;
            startOrResetTimer('Pulso', data.Pulso);
          }
        }
        // --- Temperatura ---
        if (frozenTemp === null) {
          if (data.TemperaturaCorporal !== undefined && data.TemperaturaCorporal !== lastTemp.current) {
            lastTemp.current = data.TemperaturaCorporal;
            startOrResetTimer('Temp', data.TemperaturaCorporal);
          }
        }
        // --- Peso ---
        if (frozenPeso === null) {
          if (data.Peso !== undefined && data.Peso !== lastPeso.current) {
            lastPeso.current = data.Peso;
            startOrResetTimer('Peso', data.Peso);
          }
        }
        // --- Altura ---
        if (frozenAltura === null) {
          if (data.Altura !== undefined && data.Altura !== lastAltura.current) {
            lastAltura.current = data.Altura;
            startOrResetTimer('Altura', data.Altura);
          }
        }

        setSensorData(prevData => ({
          ...prevData,
          Spo2: data.Spo2 !== undefined ? String(data.Spo2) : prevData.Spo2,
          Pulso: data.Pulso !== undefined ? String(data.Pulso) : prevData.Pulso,
          TemperaturaCorporal: data.TemperaturaCorporal !== undefined ? String(data.TemperaturaCorporal) : prevData.TemperaturaCorporal,
          Peso: data.Peso !== undefined ? String(data.Peso) : prevData.Peso,
          Altura: data.Altura !== undefined ? String(data.Altura) : prevData.Altura,
        }));
      } catch (error) {
        console.error('Error al parsear el mensaje WebSocket:', error);
      }
    };
    return () => {
      if (ws.current) ws.current.close();
      clearTimeout(spo2Timer.current);
      clearTimeout(pulsoTimer.current);
      clearTimeout(tempTimer.current);
      clearTimeout(pesoTimer.current);
      clearTimeout(alturaTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFillEnabled, frozenSpo2, frozenPulso, frozenTemp, frozenPeso, frozenAltura]);

  // Si no llegan datos nuevos, los timers seguirán corriendo y se congelarán los valores actuales al pasar 3 segundos.

  // Funciones para capturar/liberar cada valor manualmente
  const handleCapture = (type) => {
    switch (type) {
      case 'Spo2':
        setFrozenSpo2(sensorData.Spo2);
        setOxigeno(sensorData.Spo2);
        clearTimeout(spo2Timer.current);
        break;
      case 'Pulso':
        setFrozenPulso(sensorData.Pulso);
        setFrecuencia(sensorData.Pulso);
        clearTimeout(pulsoTimer.current);
        break;
      case 'Temp':
        setFrozenTemp(sensorData.TemperaturaCorporal);
        setTemperatura(sensorData.TemperaturaCorporal);
        clearTimeout(tempTimer.current);
        break;
      case 'Peso':
        setFrozenPeso(sensorData.Peso);
        setPeso(sensorData.Peso);
        clearTimeout(pesoTimer.current);
        break;
      case 'Altura':
        setFrozenAltura(sensorData.Altura);
        setEstatura(sensorData.Altura);
        clearTimeout(alturaTimer.current);
        break;
      default: break;
    }
  };
  const handleRelease = (type) => {
    switch (type) {
      case 'Spo2':
        setFrozenSpo2(null);
        setOxigeno('');
        lastSpo2.current = '';
        break;
      case 'Pulso':
        setFrozenPulso(null);
        setFrecuencia('');
        lastPulso.current = '';
        break;
      case 'Temp':
        setFrozenTemp(null);
        setTemperatura('');
        lastTemp.current = '';
        break;
      case 'Peso':
        setFrozenPeso(null);
        setPeso('');
        lastPeso.current = '';
        break;
      case 'Altura':
        setFrozenAltura(null);
        setEstatura('');
        lastAltura.current = '';
        break;
      default: break;
    }
  };

  // Renderiza un cuadro individual
  const renderSensorBox = (label, value, frozenValue, onCapture, onRelease, unit) => (
    <View style={styles.sensorMiniBox}>
      <Text style={styles.sensorMiniLabel}>{label}</Text>
      <Text style={styles.sensorMiniValue}>{frozenValue !== null ? frozenValue : value || '--'} {unit}</Text>
      <TouchableOpacity
        style={styles.miniButton}
        onPress={frozenValue === null ? onCapture : onRelease}
      >
        <Text style={styles.miniButtonText}>
          {frozenValue === null ? 'Capturar' : 'Liberar'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Aquí iría tu lógica para enviar el formulario (POST a /api/ChequeoSemanal)
  const handleSubmit = () => {
    // Implementa la lógica de envío aquí
    // ...
    alert('Consulta enviada (simulado)');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.mainContentArea}>
            <Text style={styles.title}>Nueva Consulta</Text>

            {/* Switch global */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, alignSelf: 'center' }}>
              <Text style={{ marginRight: 10, color: '#333', fontWeight: '600' }}>
                Autocompletar con sensores
              </Text>
              <Switch
                value={autoFillEnabled}
                onValueChange={setAutoFillEnabled}
                thumbColor={autoFillEnabled ? PRIMARY_GREEN : '#ccc'}
                trackColor={{ false: '#ccc', true: LIGHT_GREEN }}
              />
            </View>

            {/* Cuadros individuales a la derecha */}
            {autoFillEnabled && (
              <View style={styles.sensorMiniBoxContainer}>
                {renderSensorBox('SpO2', sensorData.Spo2, frozenSpo2, () => handleCapture('Spo2'), () => handleRelease('Spo2'), '%')}
                {renderSensorBox('Pulso', sensorData.Pulso, frozenPulso, () => handleCapture('Pulso'), () => handleRelease('Pulso'), 'lpm')}
                {renderSensorBox('Temp.', sensorData.TemperaturaCorporal, frozenTemp, () => handleCapture('Temp'), () => handleRelease('Temp'), '°C')}
                {renderSensorBox('Peso', sensorData.Peso, frozenPeso, () => handleCapture('Peso'), () => handleRelease('Peso'), 'kg')}
                {renderSensorBox('Altura', sensorData.Altura, frozenAltura, () => handleCapture('Altura'), () => handleRelease('Altura'), 'cm')}
              </View>
            )}

            {/* Formulario */}
            <View style={styles.formBox}>
              <Text style={styles.label}>Frecuencia Cardíaca (lpm)</Text>
              <TextInput
                style={styles.input}
                value={frecuencia}
                onChangeText={setFrecuencia}
                keyboardType="numeric"
                placeholder="Ej: 80"
              />

              <Text style={styles.label}>SpO2 (%)</Text>
              <TextInput
                style={styles.input}
                value={oxigeno}
                onChangeText={setOxigeno}
                keyboardType="numeric"
                placeholder="Ej: 98"
              />

              <Text style={styles.label}>Temperatura Corporal (°C)</Text>
              <TextInput
                style={styles.input}
                value={temperatura}
                onChangeText={setTemperatura}
                keyboardType="numeric"
                placeholder="Ej: 36.5"
              />

              <Text style={styles.label}>Peso (kg)</Text>
              <TextInput
                style={styles.input}
                value={peso}
                onChangeText={setPeso}
                keyboardType="numeric"
                placeholder="Ej: 70"
              />

              <Text style={styles.label}>Estatura (cm)</Text>
              <TextInput
                style={styles.input}
                value={estatura}
                onChangeText={setEstatura}
                keyboardType="numeric"
                placeholder="Ej: 170"
              />

              <Text style={styles.label}>Observaciones</Text>
              <TextInput
                style={[styles.input, { height: 80 }]}
                value={observaciones}
                onChangeText={setObservaciones}
                multiline
                placeholder="Observaciones adicionales"
              />

              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <Text style={styles.submitButtonText}>Enviar Consulta</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BACKGROUND_LIGHT,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: IS_LARGE_SCREEN ? 40 : 16,
    backgroundColor: BACKGROUND_LIGHT,
  },
  mainContentArea: {
    width: IS_LARGE_SCREEN ? 600 : '100%',
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    marginTop: 24,
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: PRIMARY_GREEN,
    marginBottom: 18,
    alignSelf: 'center',
  },
  sensorMiniBoxContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 18,
    flexWrap: 'wrap',
    gap: 8,
  },
  sensorMiniBox: {
    backgroundColor: ACCENT_GREEN_BACKGROUND,
    borderRadius: 8,
    padding: 10,
    marginLeft: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: LIGHT_GREEN,
    alignItems: 'center',
    minWidth: 80,
  },
  sensorMiniLabel: {
    fontWeight: 'bold',
    color: PRIMARY_GREEN,
    fontSize: 13,
    marginBottom: 2,
  },
  sensorMiniValue: {
    color: DARK_GRAY,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  miniButton: {
    backgroundColor: PRIMARY_GREEN,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  miniButtonText: {
    color: WHITE,
    fontWeight: 'bold',
    fontSize: 13,
  },
  formBox: {
    marginTop: 10,
  },
  label: {
    color: MEDIUM_GRAY,
    fontWeight: '600',
    marginBottom: 4,
    marginTop: 10,
  },
  input: {
    backgroundColor: VERY_LIGHT_GRAY,
    borderRadius: 6,
    padding: 10,
    fontSize: 15,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: LIGHT_GRAY,
  },
  submitButton: {
    backgroundColor: PRIMARY_GREEN,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 18,
  },
  submitButtonText: {
    color: WHITE,
    fontWeight: 'bold',
    fontSize: 17,
  },
});