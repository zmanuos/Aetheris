import React, { useState, useRef, useEffect, useMemo } from "react";
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
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useSession } from '../../src/context/SessionContext';
import { useNotification } from '../../src/context/NotificationContext';
// Import the global configuration
import Config from '../../config/config';

// Color constants from the design code
const PRIMARY_GREEN = "#6BB240";
const LIGHT_GREEN = "#9CD275";
const ACCENT_GREEN_BACKGROUND = "#EEF7E8";
const DARK_GRAY = "#333";
const MEDIUM_GRAY = "#555";
const LIGHT_GRAY = "#888";
const VERY_LIGHT_GRAY = "#eee";
const BACKGROUND_LIGHT = "#fcfcfc";
const WHITE = "#fff";
const BUTTON_HOVER_COLOR = "#5aa130";

const { width } = Dimensions.get("window");
const IS_LARGE_SCREEN = width > 900;
const AUTO_CAPTURE_DELAY = 3000; // milisegundos (3 segundos)

const API_BASE_URL = Config.API_BASE_URL;


const url = new URL(Config.API_BASE_URL);
const WS_IP = url.hostname;
const WS_PORT = url.port;

export default function CreateConsultaScreen({ route, navigation }) {
  const { pacienteId } = route.params;
  const { session } = useSession();
  const { showNotification } = useNotification();

  // Form states
  const [frecuencia, setFrecuencia] = useState("");
  const [oxigeno, setOxigeno] = useState("");
  const [temperatura, setTemperatura] = useState("");
  const [peso, setPeso] = useState("");
  const [estatura, setEstatura] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const [loading, setLoading] = useState(false);
  const [autoFillEnabled, setAutoFillEnabled] = useState(true);

  // Real-time sensor data state
  const [sensorData, setSensorData] = useState({
    Spo2: "",
    Pulso: "",
    TemperaturaCorporal: "",
    Peso: "",
    Altura: "",
  });

  // Frozen values states
  const [frozenSpo2, setFrozenSpo2] = useState(null);
  const [frozenPulso, setFrozenPulso] = useState(null);
  const [frozenTemp, setFrozenTemp] = useState(null);
  const [frozenPeso, setFrozenPeso] = useState(null);
  const [frozenAltura, setFrozenAltura] = useState(null);

  // Auto-capture timers and last value refs
  const spo2Timer = useRef(null);
  const pulsoTimer = useRef(null);
  const tempTimer = useRef(null);
  const pesoTimer = useRef(null);
  const alturaTimer = useRef(null);
  const lastSpo2 = useRef("");
  const lastPulso = useRef("");
  const lastTemp = useRef("");
  const lastPeso = useRef("");
  const lastAltura = useRef("");
  const ws = useRef(null);

  // State for residents and current date/time from the design code
  const [idResidente, setIdResidente] = useState("");
  const [currentDateTime, setCurrentDateTime] = useState("");
  const [residentes, setResidentes] = useState([]);

  // IMC calculation from the design code
  const imc = useMemo(() => {
    const parsedPeso = parseFloat(peso);
    const parsedEstaturaCm = parseFloat(estatura);
    if (isNaN(parsedPeso) || isNaN(parsedEstaturaCm) || parsedEstaturaCm === 0) {
      return "";
    }
    const estaturaM = parsedEstaturaCm / 100;
    const calculatedIMC = parsedPeso / (estaturaM * estaturaM);
    return calculatedIMC.toFixed(2);
  }, [peso, estatura]);

  // WebSocket and auto-capture logic from the original file
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

    clearTimeout(timers[type].current);
    timers[type].current = setTimeout(() => {
      if (setFrozen[type] !== null) {
        setFrozen[type](value);
        setForm[type](String(value));
      }
    }, AUTO_CAPTURE_DELAY);
  };

  useEffect(() => {
    // Lógica para obtener la fecha y hora actual
    const now = new Date();
    const formattedDate = now.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    setCurrentDateTime(formattedDate);

    // Lógica para obtener los residentes de la API
    const fetchResidentes = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/Residente`);
        if (!response.ok) {
          throw new Error("Error al cargar la lista de residentes.");
        }
        
        const jsonResponse = await response.json();
        const residentData = jsonResponse.data;

        if (!residentData || !Array.isArray(residentData)) {
            throw new Error("Formato de respuesta de la API incorrecto. Se esperaba un array en la propiedad 'data'.");
        }

        const residentesActivos = residentData.filter(residente => residente.activo);
        setResidentes(residentesActivos);

        // Si se recibe un pacienteId desde otra pantalla, seleccionarlo
        if (pacienteId) {
            const residenteInicial = residentesActivos.find(res => res.id_residente === pacienteId);
            if (residenteInicial) {
                setIdResidente(pacienteId);
            }
        }

      } catch (err) {
        console.error("Error fetching residentes:", err);
        showNotification("No se pudo cargar la lista de residentes activos.", 'error');
      }
    };

    fetchResidentes();

    // Lógica para el WebSocket
    if (!autoFillEnabled) {
      if (ws.current) ws.current.close();
      clearTimeout(spo2Timer.current);
      clearTimeout(pulsoTimer.current);
      clearTimeout(tempTimer.current);
      clearTimeout(pesoTimer.current);
      clearTimeout(alturaTimer.current);
      return;
    }

    ws.current = new WebSocket(`ws://${WS_IP}:${WS_PORT}/ws/sensor_data`);

    ws.current.onopen = () => console.log("WebSocket Connected");

    ws.current.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setSensorData((prevData) => ({
          ...prevData,
          Spo2: data.Spo2 !== undefined ? String(data.Spo2) : prevData.Spo2,
          Pulso: data.Pulso !== undefined ? String(data.Pulso) : prevData.Pulso,
          TemperaturaCorporal:
            data.TemperaturaCorporal !== undefined ? String(data.TemperaturaCorporal) : prevData.TemperaturaCorporal,
          Peso: data.Peso !== undefined ? String(data.Peso) : prevData.Peso,
          Altura: data.Altura !== undefined ? String(data.Altura) : prevData.Altura,
        }));

        if (frozenSpo2 === null && data.Spo2 !== undefined && String(data.Spo2) !== lastSpo2.current) {
          lastSpo2.current = String(data.Spo2);
          startOrResetTimer("Spo2", String(data.Spo2));
        }
        if (frozenPulso === null && data.Pulso !== undefined && String(data.Pulso) !== lastPulso.current) {
          lastPulso.current = String(data.Pulso);
          startOrResetTimer("Pulso", String(data.Pulso));
        }
        if (frozenTemp === null && data.TemperaturaCorporal !== undefined && String(data.TemperaturaCorporal) !== lastTemp.current) {
          lastTemp.current = String(data.TemperaturaCorporal);
          startOrResetTimer("Temp", String(data.TemperaturaCorporal));
        }
        if (frozenPeso === null && data.Peso !== undefined && String(data.Peso) !== lastPeso.current) {
          lastPeso.current = String(data.Peso);
          startOrResetTimer("Peso", String(data.Peso));
        }
        if (frozenAltura === null && data.Altura !== undefined && String(data.Altura) !== lastAltura.current) {
          lastAltura.current = String(data.Altura);
          startOrResetTimer("Altura", String(data.Altura));
        }
      } catch (error) {
        console.error("Error al parsear el mensaje WebSocket:", error);
      }
    };

    ws.current.onerror = (e) => {
      console.error("WebSocket Error:", e.message);
      showNotification("No se pudo establecer conexión con el servidor de sensores.", 'error');
    };

    ws.current.onclose = (e) => console.log("WebSocket Disconnected:", e.code, e.reason);

    return () => {
      if (ws.current) ws.current.close();
      clearTimeout(spo2Timer.current);
      clearTimeout(pulsoTimer.current);
      clearTimeout(tempTimer.current);
      clearTimeout(pesoTimer.current);
      clearTimeout(alturaTimer.current);
    };
  }, [autoFillEnabled, frozenSpo2, frozenPulso, frozenTemp, frozenPeso, frozenAltura, showNotification]);

  // Capture/release functions from the original file
  const handleCapture = (type) => {
    switch (type) {
      case "Spo2":
        setFrozenSpo2(sensorData.Spo2);
        setOxigeno(sensorData.Spo2);
        clearTimeout(spo2Timer.current);
        break;
      case "Pulso":
        setFrozenPulso(sensorData.Pulso);
        setFrecuencia(sensorData.Pulso);
        clearTimeout(pulsoTimer.current);
        break;
      case "Temp":
        setFrozenTemp(sensorData.TemperaturaCorporal);
        setTemperatura(sensorData.TemperaturaCorporal);
        clearTimeout(tempTimer.current);
        break;
      case "Peso":
        setFrozenPeso(sensorData.Peso);
        setPeso(sensorData.Peso);
        clearTimeout(pesoTimer.current);
        break;
      case "Altura":
        setFrozenAltura(sensorData.Altura);
        setEstatura(sensorData.Altura);
        clearTimeout(alturaTimer.current);
        break;
      default:
        break;
    }
  };

  const handleRelease = (type) => {
    switch (type) {
      case "Spo2":
        setFrozenSpo2(null);
        setOxigeno("");
        lastSpo2.current = "";
        break;
      case "Pulso":
        setFrozenPulso(null);
        setFrecuencia("");
        lastPulso.current = "";
        break;
      case "Temp":
        setFrozenTemp(null);
        setTemperatura("");
        lastTemp.current = "";
        break;
      case "Peso":
        setFrozenPeso(null);
        setPeso("");
        lastPeso.current = "";
        break;
      case "Altura":
        setFrozenAltura(null);
        setEstatura("");
        lastAltura.current = "";
        break;
      default:
        break;
    }
  };

  // Submit function from the original file
  const handleSubmit = async () => {
    const personalId = session?.apiUserId ?? 0;
    
    // --- VALIDACIONES FINALES ANTES DE ENVIAR ---
    const errors = [];
    if (!idResidente) errors.push("El ID del residente es obligatorio.");
    // La validación para personalId se ha eliminado para permitir el envío de 0
    if (!frecuencia || isNaN(parseInt(frecuencia))) errors.push("La frecuencia cardíaca debe ser un número entero válido.");
    if (!oxigeno || isNaN(parseInt(oxigeno))) errors.push("La oxigenación (SpO2) debe ser un número entero válido.");
    if (!temperatura || isNaN(parseFloat(temperatura))) errors.push("La temperatura corporal debe ser un número válido.");
    if (!peso || isNaN(parseFloat(peso))) errors.push("El peso debe ser un número válido.");
    if (!estatura || isNaN(parseFloat(estatura))) errors.push("La estatura debe ser un número válido.");
    if (imc === "") errors.push("El IMC no se pudo calcular. Verifique el peso y la estatura.");
    if (!observaciones) errors.push("Las observaciones son obligatorias.");
    
    if (errors.length > 0) {
      showNotification(errors.join("\n"), 'error');
      return;
    }
    // --- FIN DE VALIDACIONES FINALES ---
    
    setLoading(true);

    // Crear el objeto con los datos que se van a enviar
    const postData = {
        ResidenteId: idResidente,
        PersonalId: String(personalId),
        FechaChequeo: new Date().toISOString(),
        Spo2: parseInt(oxigeno),
        Pulso: parseInt(frecuencia),
        TemperaturaCorporal: parseFloat(temperatura),
        Peso: parseFloat(peso),
        Altura: parseFloat(estatura),
        Imc: parseFloat(imc),
        Observaciones: observaciones,
    };

    console.log("Datos a enviar al API:", postData);

    try {
      // Usar FormData para replicar el comportamiento de 'multipart/form-data'
      const formData = new FormData();
      for (const key in postData) {
        formData.append(key, postData[key]);
      }

      console.log("FormData preparado:", formData);

      const response = await fetch(`${API_BASE_URL}/ChequeoSemanal`, {
        method: "POST",
        headers: {
          // No necesitamos 'Content-Type' aquí, fetch lo establece automáticamente para FormData
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al enviar la consulta.");
      }

      const data = await response.json();
      console.log("Respuesta del API:", data);
      showNotification("Consulta enviada correctamente.", 'success');
      navigation.goBack();
    } catch (err) {
      console.error("Error al enviar la consulta:", err);
      showNotification("Hubo un problema al enviar la consulta: " + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Render a single sensor box
  const renderSensorBox = (
    label,
    value,
    frozenValue,
    onCapture,
    onRelease,
    unit,
    icon
  ) => (
    <View style={styles.sensorMiniBox}>
      <Ionicons name={icon} size={16} color={PRIMARY_GREEN} />
      <Text style={styles.sensorMiniLabel}>{label}</Text>
      <Text style={styles.sensorMiniValue}>
        {frozenValue !== null ? frozenValue : value || "--"} {unit}
      </Text>
      {autoFillEnabled && (
        <TouchableOpacity style={styles.miniButton} onPress={frozenValue === null ? onCapture : onRelease}>
          <Text style={styles.miniButtonText}>
            {frozenValue === null ? "Capturar" : "Liberar"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const residenteSeleccionado = residentes.find((r) => r.id_residente === idResidente);

  // Función de validación en tiempo real para números
  const handleNumericChange = (setter, text, isInteger = false) => {
    if (text === '') {
      setter('');
      return;
    }
  
    // Regex para números enteros (con signo negativo opcional)
    if (isInteger) {
      const regex = /^-?\d*$/;
      if (regex.test(text)) {
        setter(text);
      }
      return;
    }
    
    // Regex para números con decimales (con signo negativo opcional)
    // Se permite un solo punto decimal y solo después de un dígito
    const regex = /^-?\d*\.?\d*$/;
    if (regex.test(text)) {
      setter(text);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.dateTimeContainer}>
        <Ionicons name="calendar-outline" size={16} color={PRIMARY_GREEN} style={styles.dateTimeIcon} />
        <Text style={styles.dateTimeText}>{currentDateTime}</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.mainContentArea}>
            {/* Switch and sensor boxes */}
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Autocompletar con sensores</Text>
              <Switch
                value={autoFillEnabled}
                onValueChange={(newValue) => {
                  setAutoFillEnabled(newValue);
                  if (!newValue) {
                    setFrecuencia("");
                    setOxigeno("");
                    setTemperatura("");
                    setPeso("");
                    setEstatura("");
                    setFrozenSpo2(null);
                    setFrozenPulso(null);
                    setFrozenTemp(null);
                    setFrozenPeso(null);
                    setFrozenAltura(null);
                  }
                }}
                thumbColor={autoFillEnabled ? PRIMARY_GREEN : "#ccc"}
                trackColor={{ false: "#ccc", true: LIGHT_GREEN }}
              />
            </View>

            {autoFillEnabled && (
              <View style={styles.sensorMiniBoxContainer}>
                {renderSensorBox("SpO2", sensorData.Spo2, frozenSpo2, () => handleCapture("Spo2"), () => handleRelease("Spo2"), "%", "water-outline")}
                {renderSensorBox("Pulso", sensorData.Pulso, frozenPulso, () => handleCapture("Pulso"), () => handleRelease("Pulso"), "lpm", "heart-outline")}
                {renderSensorBox("Temp.", sensorData.TemperaturaCorporal, frozenTemp, () => handleCapture("Temp"), () => handleRelease("Temp"), "°C", "thermometer-outline")}
                {renderSensorBox("Peso", sensorData.Peso, frozenPeso, () => handleCapture("Peso"), () => handleRelease("Peso"), "kg", "body-outline")}
                {renderSensorBox("Altura", sensorData.Altura, frozenAltura, () => handleCapture("Altura"), () => handleRelease("Altura"), "cm", "resize-outline")}
              </View>
            )}

            {/* Form */}
            <View style={styles.formBox}>
              {/* Resident Picker */}
              <View style={styles.fieldWrapper}>
                <Text style={styles.inputLabel}>Residente</Text>
                <View style={styles.inputContainerWithIcon}>
                  <Ionicons name="people-outline" size={18} color={MEDIUM_GRAY} style={styles.inputIcon} />
                  <Picker
                    selectedValue={idResidente}
                    onValueChange={(itemValue) => setIdResidente(itemValue)}
                    style={styles.picker}
                  >
                    <Picker.Item label="-- Selecciona un residente --" value="" color={LIGHT_GRAY} />
                    {residentes.map((res) => (
                      <Picker.Item key={res.id_residente} label={`${res.nombre} ${res.apellido}`} value={res.id_residente} />
                    ))}
                  </Picker>
                </View>
              </View>

              {/* Resident Info Box */}
              {residenteSeleccionado && (
                <View style={styles.infoBox}>
                  <Text style={styles.infoText}><Text style={styles.infoLabel}>Nombre:</Text> {residenteSeleccionado.nombre} {residenteSeleccionado.apellido}</Text>
                  <Text style={styles.infoText}><Text style={styles.infoLabel}>Edad:</Text> {new Date().getFullYear() - new Date(residenteSeleccionado.fecha_nacimiento).getFullYear()} años</Text>
                  <Text style={styles.infoText}><Text style={styles.infoLabel}>Teléfono:</Text> {residenteSeleccionado.telefono}</Text>
                </View>
              )}

              {/* Frecuencia Cardíaca */}
              <View style={styles.fieldWrapper}>
                <Text style={styles.inputLabel}>Frecuencia cardíaca (lpm)</Text>
                <View style={styles.inputContainerWithIcon}>
                  <Ionicons name="heart-outline" size={18} color={MEDIUM_GRAY} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={frozenPulso !== null ? frozenPulso : frecuencia}
                    onChangeText={(text) => handleNumericChange(setFrecuencia, text, true)}
                    keyboardType="numeric"
                    placeholder="Ej: 80"
                    placeholderTextColor={LIGHT_GRAY}
                    editable={frozenPulso === null}
                  />
                </View>
              </View>

              {/* SpO2 */}
              <View style={styles.fieldWrapper}>
                <Text style={styles.inputLabel}>Oxigenación (%)</Text>
                <View style={styles.inputContainerWithIcon}>
                  <Ionicons name="water-outline" size={18} color={MEDIUM_GRAY} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={frozenSpo2 !== null ? frozenSpo2 : oxigeno}
                    onChangeText={(text) => handleNumericChange(setOxigeno, text, true)}
                    keyboardType="numeric"
                    placeholder="Ej: 98"
                    placeholderTextColor={LIGHT_GRAY}
                    editable={frozenSpo2 === null}
                  />
                </View>
              </View>

              {/* Temperatura */}
              <View style={styles.fieldWrapper}>
                <Text style={styles.inputLabel}>Temperatura (°C)</Text>
                <View style={styles.inputContainerWithIcon}>
                  <Ionicons name="thermometer-outline" size={18} color={MEDIUM_GRAY} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={frozenTemp !== null ? frozenTemp : temperatura}
                    onChangeText={(text) => handleNumericChange(setTemperatura, text)}
                    keyboardType="numeric"
                    placeholder="Ej: 36.5"
                    placeholderTextColor={LIGHT_GRAY}
                    editable={frozenTemp === null}
                  />
                </View>
              </View>

              {/* Peso */}
              <View style={styles.fieldWrapper}>
                <Text style={styles.inputLabel}>Peso (kg)</Text>
                <View style={styles.inputContainerWithIcon}>
                  <Ionicons name="body-outline" size={18} color={MEDIUM_GRAY} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={frozenPeso !== null ? frozenPeso : peso}
                    onChangeText={(text) => handleNumericChange(setPeso, text)}
                    keyboardType="numeric"
                    placeholder="Ej: 70"
                    placeholderTextColor={LIGHT_GRAY}
                    editable={frozenPeso === null}
                  />
                </View>
              </View>

              {/* Estatura */}
              <View style={styles.fieldWrapper}>
                <Text style={styles.inputLabel}>Estatura (cm)</Text>
                <View style={styles.inputContainerWithIcon}>
                  <Ionicons name="resize-outline" size={18} color={MEDIUM_GRAY} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={frozenAltura !== null ? frozenAltura : estatura}
                    onChangeText={(text) => handleNumericChange(setEstatura, text)}
                    keyboardType="numeric"
                    placeholder="Ej: 170"
                    placeholderTextColor={LIGHT_GRAY}
                    editable={frozenAltura === null}
                  />
                </View>
              </View>

              {/* IMC */}
              <View style={styles.fieldWrapper}>
                <Text style={styles.inputLabel}>Índice de Masa Corporal (IMC)</Text>
                <View style={[styles.inputContainerWithIcon, styles.uneditableInput]}>
                  <Ionicons name="body-outline" size={18} color={MEDIUM_GRAY} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input]}
                    value={imc}
                    editable={false}
                    placeholder="Calculado automáticamente"
                    placeholderTextColor={LIGHT_GRAY}
                  />
                </View>
              </View>

              {/* Observaciones */}
              <View style={styles.fieldWrapper}>
                <Text style={styles.inputLabel}>Observaciones</Text>
                <View style={[styles.inputContainerWithIcon, styles.textAreaContainer]}>
                  <Ionicons name="document-text-outline" size={18} color={MEDIUM_GRAY} style={[styles.inputIcon, styles.textAreaIcon]} />
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={observaciones}
                    onChangeText={(text) => setObservaciones(text.slice(0, 200))}
                    maxLength={200}
                    multiline
                    placeholder="Añade cualquier observación relevante aquí..."
                    placeholderTextColor={LIGHT_GRAY}
                    textAlignVertical="top"
                  />
                </View>
                <Text style={styles.charCounter}>{observaciones.length}/200</Text>
              </View>

              {/* Submit Button */}
              <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color={WHITE} />
                ) : (
                  <Text style={styles.primaryButtonText}>GUARDAR CONSULTA</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Styles from the design code, with some modifications for layout
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BACKGROUND_LIGHT,
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  dateTimeContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 15,
    backgroundColor: WHITE,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: VERY_LIGHT_GRAY,
    ...Platform.select({
      ios: {
        shadowColor: DARK_GRAY,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: `0 2px 4px rgba(51, 51, 51, 0.1)`,
      },
    }),
  },
  dateTimeIcon: {
    marginRight: 8,
    color: PRIMARY_GREEN,
  },
  dateTimeText: {
    fontSize: 13,
    color: DARK_GRAY,
    fontWeight: '700',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 10,
    alignItems: 'center',
  },
  mainContentArea: {
    width: '90%',
    maxWidth: 500,
    backgroundColor: WHITE,
    borderRadius: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderTopWidth: 4,
    borderTopColor: PRIMARY_GREEN,
    padding: 10,
    borderWidth: 1,
    borderColor: VERY_LIGHT_GRAY,
    ...Platform.select({
      ios: {
        shadowColor: DARK_GRAY,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: `0 3px 6px rgba(51, 51, 51, 0.08)`,
      },
    }),
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: DARK_GRAY,
    marginBottom: 10,
    textAlign: 'center',
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    paddingVertical: 8,
    backgroundColor: ACCENT_GREEN_BACKGROUND,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: LIGHT_GREEN,
    paddingHorizontal: 15,
  },
  switchLabel: {
    marginRight: 10,
    color: DARK_GRAY,
    fontWeight: "600",
    fontSize: 15,
  },
  sensorMiniBoxContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    gap: 6,
  },
  sensorMiniBox: {
    backgroundColor: ACCENT_GREEN_BACKGROUND,
    borderRadius: 8,
    padding: 6,
    borderWidth: 1,
    borderColor: LIGHT_GREEN,
    alignItems: "center",
    flex: 1,
  },
  sensorMiniLabel: {
    fontWeight: "bold",
    color: PRIMARY_GREEN,
    fontSize: 11,
    marginBottom: 2,
    marginTop: 2,
  },
  sensorMiniValue: {
    color: DARK_GRAY,
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 4,
  },
  miniButton: {
    backgroundColor: PRIMARY_GREEN,
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 2,
  },
  miniButtonText: {
    color: WHITE,
    fontWeight: "bold",
    fontSize: 10,
  },
  formBox: {
    marginTop: 8,
  },
  fieldWrapper: {
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 12,
    color: MEDIUM_GRAY,
    marginBottom: 4,
    fontWeight: '600',
  },
  inputContainerWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: VERY_LIGHT_GRAY,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: WHITE,
    height: 36,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 13,
    color: DARK_GRAY,
    paddingVertical: 0,
    ...Platform.select({
      web: {
        outline: 'none',
      },
    }),
  },
  textAreaContainer: {
    height: 80,
    alignItems: 'flex-start',
    paddingVertical: 6,
  },
  textArea: {
    height: '100%',
    paddingVertical: 0,
    textAlignVertical: 'top',
  },
  textAreaIcon: {
    paddingTop: 3,
  },
  picker: {
    flex: 1,
    color: DARK_GRAY,
    fontSize: 13,
    ...Platform.select({
      web: {
        outline: 'none',
      },
    }),
  },
  infoBox: {
    backgroundColor: ACCENT_GREEN_BACKGROUND,
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: LIGHT_GREEN,
  },
  infoText: {
    fontSize: 12,
    marginBottom: 2,
    color: MEDIUM_GRAY,
  },
  infoLabel: {
    fontWeight: 'bold',
    color: DARK_GRAY,
  },
  primaryButton: {
    backgroundColor: PRIMARY_GREEN,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: PRIMARY_GREEN,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
      web: {
        cursor: 'pointer',
        transitionDuration: '0.2s',
        transitionProperty: 'background-color, transform, box-shadow',
        boxShadow: `0 4px 8px rgba(107, 178, 64, 0.2)`,
        ':hover': {
          backgroundColor: BUTTON_HOVER_COLOR,
          transform: 'translateY(-2px)',
          boxShadow: `0 6px 12px rgba(107, 178, 64, 0.3)`,
        },
        ':active': {
          transform: 'translateY(0)',
          boxShadow: `0 3px 6px rgba(107, 178, 64, 0.2)`,
        },
      },
    }),
  },
  primaryButtonText: {
    color: WHITE,
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  uneditableInput: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ccc',
  },
  charCounter: {
    fontSize: 10,
    color: LIGHT_GRAY,
    textAlign: 'right',
    marginTop: 2,
  },
});
