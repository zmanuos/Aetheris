import React, { useState, useRef, useEffect } from "react";
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
  Alert, // Added for alerts
  ActivityIndicator, // Added for loading indicator
} from "react-native";
import Config from "../../config/config"; // Adjust the path if necessary

// Define the colors based on the provided constants
const PRIMARY_GREEN = "#6BB240";
const LIGHT_GREEN = "#9CD275";
const ACCENT_GREEN_BACKGROUND = "#EEF7E8";
const DARK_GRAY = "#333";
const MEDIUM_GRAY = "#555";
const LIGHT_GRAY = "#888";
const VERY_LIGHT_GRAY = "#eee";
const BACKGROUND_LIGHT = "#fcfcfc";
const WHITE = "#fff";

const { width } = Dimensions.get("window");
const IS_LARGE_SCREEN = width > 900;
const AUTO_CAPTURE_DELAY = 3000; // milisegundos (3 segundos)

// Component receives route and navigation props for navigation and params
export default function CreateConsultaScreen({ route, navigation }) {
  const { pacienteId } = route.params; // Re-added pacienteId from route.params

  // Estados para los campos del formulario (these will be the final values sent)
  const [frecuencia, setFrecuencia] = useState("");
  const [oxigeno, setOxigeno] = useState("");
  const [temperatura, setTemperatura] = useState("");
  const [peso, setPeso] = useState("");
  const [estatura, setEstatura] = useState("");
  const [observaciones, setObservaciones] = useState("");

  // General form states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Estado para el switch global de autocaptura
  const [autoFillEnabled, setAutoFillEnabled] = useState(true);

  // Estado para los datos en tiempo real (what the WebSocket is currently receiving)
  const [sensorData, setSensorData] = useState({
    Spo2: "",
    Pulso: "",
    TemperaturaCorporal: "",
    Peso: "",
    Altura: "",
  });

  // Estados para los valores congelados (values that have been captured/autocaptured)
  // Initialized to null to indicate they are not yet captured/frozen
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

  // Guardar el último valor recibido para cada sensor para evitar procesamiento repetido
  const lastSpo2 = useRef("");
  const lastPulso = useRef("");
  const lastTemp = useRef("");
  const lastPeso = useRef("");
  const lastAltura = useRef("");

  // WebSocket instance ref
  const ws = useRef(null);

  // Hardcode the IP and Port directly in this file
  // as they are not being exported from your Config.js
  const ip = "192.168.84.142";
  const port = 5214;

  // Function to start/reset the timer for each sensor data point
  const startOrResetTimer = (type, value) => {
    // Mappings for state setters and timers
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

    // Clear any existing timer for this type
    clearTimeout(timers[type].current);

    // Start a new timer
    timers[type].current = setTimeout(() => {
      // If the value hasn't been manually captured (frozen), then auto-capture it
      if (setFrozen[type] !== null) {
        // Check if it's not manually frozen
        setFrozen[type](value); // Freeze the value
        setForm[type](String(value)); // Set it to the form input state
      }
    }, AUTO_CAPTURE_DELAY);
  };

  // Effect to manage WebSocket connection and auto-capture logic
  useEffect(() => {
    // If auto-fill is disabled, close any existing WebSocket connection
    if (!autoFillEnabled) {
      if (ws.current) {
        ws.current.close();
      }
      // Also clear all timers if autofill is disabled
      clearTimeout(spo2Timer.current);
      clearTimeout(pulsoTimer.current);
      clearTimeout(tempTimer.current);
      clearTimeout(pesoTimer.current);
      clearTimeout(alturaTimer.current);
      return; // Exit if autofill is not enabled
    }

    // Connect to WebSocket only if autoFillEnabled is true
    // Using hardcoded IP and port as per the requirement not to change Config.js
    ws.current = new WebSocket(`ws://${ip}:${port}/ws/sensor_data`);

    ws.current.onopen = () => {
      console.log("WebSocket Connected");
      // Potentially send a message to request initial data here
    };

    ws.current.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        // console.log('Received WebSocket data:', data); // For debugging

        // Update sensorData state with latest real-time values
        setSensorData((prevData) => ({
          ...prevData,
          Spo2: data.Spo2 !== undefined ? String(data.Spo2) : prevData.Spo2,
          Pulso: data.Pulso !== undefined ? String(data.Pulso) : prevData.Pulso,
          TemperaturaCorporal:
            data.TemperaturaCorporal !== undefined
              ? String(data.TemperaturaCorporal)
              : prevData.TemperaturaCorporal,
          Peso: data.Peso !== undefined ? String(data.Peso) : prevData.Peso,
          Altura:
            data.Altura !== undefined ? String(data.Altura) : prevData.Altura,
        }));

        // Auto-capture logic: Start/reset timer if value is not manually frozen
        // and a new different value is received.
        if (
          frozenSpo2 === null &&
          data.Spo2 !== undefined &&
          String(data.Spo2) !== lastSpo2.current
        ) {
          lastSpo2.current = String(data.Spo2);
          startOrResetTimer("Spo2", String(data.Spo2));
        }
        if (
          frozenPulso === null &&
          data.Pulso !== undefined &&
          String(data.Pulso) !== lastPulso.current
        ) {
          lastPulso.current = String(data.Pulso);
          startOrResetTimer("Pulso", String(data.Pulso));
        }
        if (
          frozenTemp === null &&
          data.TemperaturaCorporal !== undefined &&
          String(data.TemperaturaCorporal) !== lastTemp.current
        ) {
          lastTemp.current = String(data.TemperaturaCorporal);
          startOrResetTimer("Temp", String(data.TemperaturaCorporal));
        }
        if (
          frozenPeso === null &&
          data.Peso !== undefined &&
          String(data.Peso) !== lastPeso.current
        ) {
          lastPeso.current = String(data.Peso);
          startOrResetTimer("Peso", String(data.Peso));
        }
        if (
          frozenAltura === null &&
          data.Altura !== undefined &&
          String(data.Altura) !== lastAltura.current
        ) {
          lastAltura.current = String(data.Altura);
          startOrResetTimer("Altura", String(data.Altura));
        }
      } catch (error) {
        console.error("Error al parsear el mensaje WebSocket:", error);
      }
    };

    ws.current.onerror = (e) => {
      console.error("WebSocket Error:", e.message);
      if (
        e.message &&
        e.message.includes("An invalid or illegal string was specified")
      ) {
        Alert.alert(
          "Error de Conexión",
          "La URL del WebSocket es inválida. Por favor, verifique la configuración de IP y Puerto."
        );
      } else {
        Alert.alert(
          "Error de Conexión",
          "No se pudo establecer conexión con el servidor de sensores. Intente de nuevo más tarde."
        );
      }
    };

    ws.current.onclose = (e) => {
      console.log("WebSocket Disconnected:", e.code, e.reason);
      // Re-attempt connection or show a message if needed
    };

    // Cleanup function for useEffect
    return () => {
      if (ws.current) {
        ws.current.close();
      }
      // Clear all timers on component unmount or when autoFillEnabled changes to false
      clearTimeout(spo2Timer.current);
      clearTimeout(pulsoTimer.current);
      clearTimeout(tempTimer.current);
      clearTimeout(pesoTimer.current);
      clearTimeout(alturaTimer.current);
    };
  }, [
    autoFillEnabled,
    frozenSpo2,
    frozenPulso,
    frozenTemp,
    frozenPeso,
    frozenAltura,
  ]); // Dependencies to re-run effect

  // Functions to manually capture/release each value
  const handleCapture = (type) => {
    switch (type) {
      case "Spo2":
        setFrozenSpo2(sensorData.Spo2);
        setOxigeno(sensorData.Spo2);
        clearTimeout(spo2Timer.current); // Stop auto-capture timer
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
        setFrozenSpo2(null); // Unfreeze the value
        setOxigeno(""); // Clear the form field
        lastSpo2.current = ""; // Reset last received value for auto-capture
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

  // Renderiza un cuadro individual para cada sensor
  const renderSensorBox = (
    label,
    value,
    frozenValue,
    onCapture,
    onRelease,
    unit
  ) => (
    <View style={styles.sensorMiniBox}>
      <Text style={styles.sensorMiniLabel}>{label}</Text>
      <Text style={styles.sensorMiniValue}>
        {frozenValue !== null ? frozenValue : value || "--"} {unit}
      </Text>
      {autoFillEnabled && ( // Only show capture/release buttons if autofill is enabled
        <TouchableOpacity
          style={styles.miniButton}
          onPress={frozenValue === null ? onCapture : onRelease}
        >
          <Text style={styles.miniButtonText}>
            {frozenValue === null ? "Capturar" : "Liberar"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Función para enviar el formulario (POST a /api/ChequeoSemanal)
  const handleSubmit = async () => {
    if (!frecuencia || !oxigeno || !temperatura || !peso || !estatura) {
      Alert.alert(
        "Campos Obligatorios",
        "Por favor, complete todos los campos de datos de sensores y las observaciones."
      );
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`${Config.API_BASE_URL}/ChequeoSemanal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paciente_id: pacienteId, // Use the pacienteId from route.params
          frecuencia_cardiaca: frecuencia,
          spo2: oxigeno,
          temperatura_corporal: temperatura,
          peso: peso,
          estatura: estatura,
          observaciones: observaciones,
          // You might also want to include the captured_at timestamp if your API supports it
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al enviar la consulta.");
      }

      const data = await response.json();
      console.log("Consulta enviada:", data);
      setSuccess(true);
      Alert.alert("Éxito", "Consulta enviada correctamente.");
      navigation.goBack(); // Navigate back after success
    } catch (err) {
      console.error("Error al enviar la consulta:", err);
      setError(err.message);
      Alert.alert(
        "Error",
        "Hubo un problema al enviar la consulta: " + err.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.mainContentArea}>
            <Text style={styles.title}>Nueva Consulta</Text>

            {/* Switch global para autocaptura */}
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Autocompletar con sensores</Text>
              <Switch
                value={autoFillEnabled}
                onValueChange={(newValue) => {
                  setAutoFillEnabled(newValue);
                  // Optionally clear inputs when toggling off autofill
                  if (!newValue) {
                    setFrecuencia("");
                    setOxigeno("");
                    setTemperatura("");
                    setPeso("");
                    setEstatura("");
                    // Also reset frozen values if autoFillEnabled is turned off
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

            {/* Cuadros individuales de sensores (visible if autofill is enabled) */}
            {autoFillEnabled && (
              <View style={styles.sensorMiniBoxContainer}>
                {renderSensorBox(
                  "SpO2",
                  sensorData.Spo2,
                  frozenSpo2,
                  () => handleCapture("Spo2"),
                  () => handleRelease("Spo2"),
                  "%"
                )}
                {renderSensorBox(
                  "Pulso",
                  sensorData.Pulso,
                  frozenPulso,
                  () => handleCapture("Pulso"),
                  () => handleRelease("Pulso"),
                  "lpm"
                )}
                {renderSensorBox(
                  "Temp.",
                  sensorData.TemperaturaCorporal,
                  frozenTemp,
                  () => handleCapture("Temp"),
                  () => handleRelease("Temp"),
                  "°C"
                )}
                {renderSensorBox(
                  "Peso",
                  sensorData.Peso,
                  frozenPeso,
                  () => handleCapture("Peso"),
                  () => handleRelease("Peso"),
                  "kg"
                )}
                {renderSensorBox(
                  "Altura",
                  sensorData.Altura,
                  frozenAltura,
                  () => handleCapture("Altura"),
                  () => handleRelease("Altura"),
                  "cm"
                )}
              </View>
            )}

            {/* Formulario */}
            <View style={styles.formBox}>
              <Text style={styles.label}>Frecuencia Cardíaca (lpm)</Text>
              <TextInput
                style={styles.input}
                value={frozenPulso !== null ? frozenPulso : frecuencia} // Use frozen if available
                onChangeText={setFrecuencia}
                keyboardType="numeric"
                placeholder="Ej: 80"
                editable={frozenPulso === null} // Not editable if frozen
              />

              <Text style={styles.label}>SpO2 (%)</Text>
              <TextInput
                style={styles.input}
                value={frozenSpo2 !== null ? frozenSpo2 : oxigeno} // Use frozen if available
                onChangeText={setOxigeno}
                keyboardType="numeric"
                placeholder="Ej: 98"
                editable={frozenSpo2 === null} // Not editable if frozen
              />

              <Text style={styles.label}>Temperatura Corporal (°C)</Text>
              <TextInput
                style={styles.input}
                value={frozenTemp !== null ? frozenTemp : temperatura} // Use frozen if available
                onChangeText={setTemperatura}
                keyboardType="numeric"
                placeholder="Ej: 36.5"
                editable={frozenTemp === null} // Not editable if frozen
              />

              <Text style={styles.label}>Peso (kg)</Text>
              <TextInput
                style={styles.input}
                value={frozenPeso !== null ? frozenPeso : peso} // Use frozen if available
                onChangeText={setPeso}
                keyboardType="numeric"
                placeholder="Ej: 70"
                editable={frozenPeso === null} // Not editable if frozen
              />

              <Text style={styles.label}>Estatura (cm)</Text>
              <TextInput
                style={styles.input}
                value={frozenAltura !== null ? frozenAltura : estatura} // Use frozen if available
                onChangeText={setEstatura}
                keyboardType="numeric"
                placeholder="Ej: 170"
                editable={frozenAltura === null} // Not editable if frozen
              />

              <Text style={styles.label}>Observaciones</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]} // Apply multiline styles
                value={observaciones}
                onChangeText={setObservaciones}
                multiline
                placeholder="Observaciones adicionales"
              />

              {error && <Text style={styles.errorText}>{error}</Text>}
              {success && (
                <Text style={styles.successText}>
                  Consulta enviada correctamente.
                </Text>
              )}

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={WHITE} />
                ) : (
                  <Text style={styles.submitButtonText}>Enviar Consulta</Text>
                )}
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
    marginTop: IS_LARGE_SCREEN? 0 : 60,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: IS_LARGE_SCREEN ? 40 : 16,
    backgroundColor: BACKGROUND_LIGHT,
  },
  mainContentArea: {
    width: IS_LARGE_SCREEN ? 600 : "100%",
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    marginTop: 24,
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: PRIMARY_GREEN,
    marginBottom: 18,
    alignSelf: "center",
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center", // Centered horizontally
    marginBottom: 15,
    paddingVertical: 10,
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
    fontSize: 16,
  },
  sensorMiniBoxContainer: {
    flexDirection: "row",
    justifyContent: "center", // Changed to center the boxes
    marginBottom: 18,
    flexWrap: "wrap",
    gap: 8, // Using gap for spacing between flex items
  },
  sensorMiniBox: {
    backgroundColor: ACCENT_GREEN_BACKGROUND,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: LIGHT_GREEN,
    alignItems: "center",
    minWidth: 90, // Adjusted minWidth for better spacing
    flexGrow: 1, // Allow boxes to grow
    maxWidth: "48%", // Approx half width for two columns on smaller screens
  },
  sensorMiniLabel: {
    fontWeight: "bold",
    color: PRIMARY_GREEN,
    fontSize: 13,
    marginBottom: 2,
  },
  sensorMiniValue: {
    color: DARK_GRAY,
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  miniButton: {
    backgroundColor: PRIMARY_GREEN,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  miniButtonText: {
    color: WHITE,
    fontWeight: "bold",
    fontSize: 13,
  },
  formBox: {
    marginTop: 10,
  },
  label: {
    color: MEDIUM_GRAY,
    fontWeight: "600",
    marginBottom: 4,
    marginTop: 10,
    fontSize: 16,
  },
  input: {
    backgroundColor: VERY_LIGHT_GRAY,
    borderRadius: 6,
    padding: 10,
    fontSize: 15,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: LIGHT_GRAY,
    color: DARK_GRAY, // Ensure text is visible
  },
  multilineInput: {
    height: 80,
    textAlignVertical: "top", // For Android
  },
  submitButton: {
    backgroundColor: PRIMARY_GREEN,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 18,
  },
  submitButtonText: {
    color: WHITE,
    fontWeight: "bold",
    fontSize: 17,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 10,
    fontSize: 14,
  },
  successText: {
    color: PRIMARY_GREEN,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 10,
    fontSize: 14,
    fontWeight: "bold",
  },
});
