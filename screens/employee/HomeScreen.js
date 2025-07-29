import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, useWindowDimensions, TouchableOpacity, Animated, Easing, ActivityIndicator } from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';

// IMPORTAR EL ARCHIVO DE CONFIGURACIÓN
import Config from '../../config/config'; // <-- ¡Aquí está la importación!

// --- Importar tu componente SVG ---
import MaquetaSVG from '../../assets/images/maqueta'; // ¡Asegúrate de que esta ruta sea correcta!

// --- Definiciones de colores y constantes ---
const PRIMARY_ACCENT = '#4A90E2';
const SECONDARY_ACCENT = '#7ED321';
const WARNING_COLOR = '#F5A623';
const DANGER_COLOR = '#D0021B';
const NEUTRAL_DARK = '#3A4750';
const NEUTRAL_MEDIUM = '#606C76';
const NEUTRAL_LIGHT = '#B0BEC5';
const BACKGROUND_LIGHT = '#F8F9FA';
const CARD_BACKGROUND = '#FFFFFF';
const PURPLE = '#8B5CF6';

// Usar la URL base del archivo de configuración
const API_ENDPOINT = `${Config.API_BASE_URL}/Dashboard`; // <-- ¡Cambiado aquí!

// --- Coordenadas de las áreas en tu mapa SVG ---
// ¡¡¡ESTO ES LO QUE NECESITAS AJUSTAR MEDIANTE PRUEBA Y ERROR!!!
// Las coordenadas son relativas al lienzo del SVG (0,0 es la esquina superior izquierda).
// Estos valores son estimaciones iniciales.
const AREA_COORDINATES = {
    "comedor": { x: 350, y: 350 },     // Ej. Centro del comedor
    "sala medica": { x: 690, y: 410 }, // Ej. Centro de la sala médica
    "patio": { x: 550, y: 550 },      // Ej. Centro del patio (el área verde grande)
    "dormitorio": { x: 350, y: 740 },  // Ej. Centro del dormitorio
    // Agrega o ajusta más áreas según tu maqueta real y los datos de tu API
};


const HomeScreen = () => {
    // --- Hooks y Estado ---
    const { width: screenWidth } = useWindowDimensions();
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0, visible: false, value: 0 });
    const fadeAnim = useRef(new Animated.Value(0)).current;
    // Ya no necesitamos chartCardWidth de la misma manera para el mapa,
    // pero lo dejamos si lo usas en otras partes.
    const [chartCardWidth, setChartCardWidth] = useState(screenWidth * 0.9 / 2 - 10);
    const [dashboardData, setDashboardData] = useState(null); // State for dynamic data
    const [loading, setLoading] = useState(true); // Loading state
    const [error, setError] = useState(null); // Error state

    // --- NUEVO ESTADO PARA CONTEOS DE UBICACIÓN ---
    // Esto debería venir de tu API, por ahora es un mock
    const [residentLocationCounts, setResidentLocationCounts] = useState({
        "comedor": 5,
        "sala medica": 2,
        "patio": 8,
        "dormitorio": 15,
        "desconocido": 0, // Para residentes sin ubicación mapeada
    });
    // Fin NUEVO ESTADO PARA CONTEOS DE UBICACIÓN

    // --- Data Fetching ---
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await fetch(API_ENDPOINT);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setDashboardData(data);

                // --- ACTUALIZAR CONTEOS DE UBICACIÓN SI LA API LOS PROVEE ---
                // Asumo que tu API podría devolver algo como data.ubicacionResidentes
                // Si tu API no tiene este dato, mantén el mock por ahora.
                if (data.ubicacionResidentes) {
                    setResidentLocationCounts(data.ubicacionResidentes);
                }
                // Fin ACTUALIZAR CONTEOS DE UBICACIÓN
            } catch (err) {
                console.error("Error fetching dashboard data:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []); // Empty dependency array means this runs once on mount

    const onChartCardLayout = (event) => {
        const { width } = event.nativeEvent.layout;
        // Ensure width is set only if it significantly changes to prevent re-renders
        if (Math.abs(width - chartCardWidth) > 1) {
            setChartCardWidth(width);
        }
    };

    // --- Helper for KPI Card Styling based on status ---
    const getKpiCardStyle = (status) => {
        switch (status) {
            case 'ok':
                return { borderColor: SECONDARY_ACCENT, backgroundColor: CARD_BACKGROUND }; // White background for 'ok'
            case 'warning':
                return { borderColor: WARNING_COLOR, backgroundColor: `${WARNING_COLOR}1A` };
            case 'critical':
                return { borderColor: DANGER_COLOR, backgroundColor: `${DANGER_COLOR}1A` };
            default:
                return { borderColor: NEUTRAL_LIGHT, backgroundColor: CARD_BACKGROUND };
        }
    };

    // --- Helper to determine Checkup status based on heart rate ---
    const getCheckupStatus = (frecuenciaCardiaca) => {
        if (frecuenciaCardiaca <= 0 || frecuenciaCardiaca < 60 || frecuenciaCardiaca > 100) return "critical";
        if ((frecuenciaCardiaca >= 60 && frecuenciaCardiaca <= 70) || (frecuenciaCardiaca >= 90 && frecuenciaCardiaca <= 100)) return "warning";
        return "ok";
    };

    const getCheckupIconAndColor = (status) => {
        switch (status) {
            case 'ok':
                return { name: "checkmark-circle-outline", color: SECONDARY_ACCENT };
            case 'warning':
                return { name: "warning-outline", color: WARNING_COLOR };
            case 'critical':
                return { name: "warning-outline", color: DANGER_COLOR };
            default:
                return { name: "information-circle-outline", color: NEUTRAL_MEDIUM };
        }
    };

    // --- NUEVA FUNCIÓN: Obtener color de los números según el conteo ---
    const getAreaCountColor = (count) => {
        if (count >= 10) return DANGER_COLOR;   // Muchos residentes
        if (count >= 5) return WARNING_COLOR;   // Cantidad moderada
        return SECONDARY_ACCENT;                // Cantidad baja o ideal
    };
    // Fin NUEVA FUNCIÓN

    // --- Data for Graphs (derived from dashboardData) ---
    // Ritmo cardíaco promedio ya no estará aquí para el LineChart
    const datosAlertasPorTipoPastel = dashboardData ?
        dashboardData.tiposAlertaMasComunes.map(item => {
            let color;
            switch (item.tipoAlerta) {
                case 'Crítica':
                    color = DANGER_COLOR;
                    break;
                case 'Media':
                    color = WARNING_COLOR;
                    break;
                case 'Baja':
                    color = PRIMARY_ACCENT; // Assuming Baja is "ok" equivalent
                    break;
                default:
                    color = NEUTRAL_MEDIUM; // Default for 'Otros' or unmapped
            }
            return {
                name: item.tipoAlerta,
                population: item.cantidad,
                color: color,
                legendFontColor: NEUTRAL_DARK,
                legendFontSize: 14
            };
        }).sort((a, b) => b.population - a.population)
        : [];

    const chartConfig = {
        backgroundGradientFrom: CARD_BACKGROUND,
        backgroundGradientTo: CARD_BACKGROUND,
        color: (opacity = 1) => `rgba(58, 71, 80, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(58, 71, 80, ${opacity})`,
        paddingRight: 5,
    };

    // --- Manejadores de Eventos y Animaciones ---
    // handleDataPointClick ya no es necesario para el mapa, solo para el LineChart
    // Si en el futuro quieres hacer algo al tocar áreas del SVG, necesitarías otra lógica aquí.

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={PRIMARY_ACCENT} />
                <Text style={styles.loadingText}>Cargando datos del dashboard...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={32} color={DANGER_COLOR} />
                <Text style={styles.errorText}>Error al cargar el dashboard: {error}</Text>
                <Text style={styles.errorTextSmall}>Asegúrate de que el backend esté corriendo en {API_ENDPOINT}</Text>
            </View>
        );
    }

    // --- Renderizado del Componente ---
    return (
        <View style={styles.container}>
            <View style={styles.mainContent}>
                {/* --- KPI Cards --- */}
                <View style={styles.kpiContainer}>
                    <View style={[styles.kpiCard, getKpiCardStyle(dashboardData.cantidadEmpleadosActivos.status)]}>
                        <Ionicons name="briefcase-outline" size={32} color={NEUTRAL_DARK} />
                        <Text style={styles.kpiNumber}>{dashboardData.cantidadEmpleadosActivos.value}</Text>
                        <Text style={styles.kpiLabel}>Personal</Text>
                    </View>
                    <View style={[styles.kpiCard, getKpiCardStyle(dashboardData.cantidadResidentesActivos.status)]}>
                        <Ionicons name="people-outline" size={32} color={NEUTRAL_DARK} />
                        <Text style={styles.kpiNumber}>{dashboardData.cantidadResidentesActivos.value}</Text>
                        <Text style={styles.kpiLabel}>Residentes</Text>
                    </View>
                    <View style={[styles.kpiCard, getKpiCardStyle(dashboardData.cantidadNotasActivas.status)]}>
                        <Ionicons name="clipboard-outline" size={32} color={NEUTRAL_DARK} />
                        <Text style={styles.kpiNumber}>{dashboardData.cantidadNotasActivas.value}</Text>
                        <Text style={styles.kpiLabel}>Notas Activas</Text>
                    </View>
                    <View style={[styles.kpiCard, getKpiCardStyle(dashboardData.ultimaTemperaturaAsilo.status)]}>
                        <Ionicons name="thermometer-outline" size={32} color={NEUTRAL_DARK} />
                        <Text style={styles.kpiNumber}>{dashboardData.ultimaTemperaturaAsilo.value}°C</Text>
                        <Text style={styles.kpiLabel}>Temp. del Asilo</Text>
                    </View>
                    <View style={[styles.kpiCard, getKpiCardStyle(dashboardData.cantidadDispositivosDisponibles.status)]}>
                        <Ionicons name="watch-outline" size={32} color={NEUTRAL_DARK} />
                        <Text style={styles.kpiNumber}>{dashboardData.cantidadDispositivosDisponibles.value}</Text>
                        <Text style={styles.kpiLabel}>Dispositivos Disponibles</Text>
                    </View>
                </View>

                {/* --- Gráficas (Ahora el Mapa y la Gráfica de Pastel) --- */}
                <View style={[styles.chartsAndListsContainer, { marginBottom: 40 }]}>
                    <View style={styles.leftColumn} onLayout={onChartCardLayout}>
                        {/* --- INICIO: Mapa de Ubicación de Residentes (reemplaza LineChart) --- */}
                        <View style={styles.chartCard}>
                            <Text style={styles.chartTitle}>Ubicación de Residentes</Text>
                            <View style={styles.svgMapContainer}>
                                {/* Renderiza tu componente SVG */}
                                {/* Ajusta width y height para que la imagen sea más grande */}
                                {/* Aumentamos el multiplicador para el ancho. Podrías necesitar ajustar la altura también */}
                                <MaquetaSVG width={chartCardWidth * 5} height={350} />

                                {/* Overlay para los números de conteo */}
                                {Object.entries(residentLocationCounts).map(([areaName, count]) => {
                                    const coords = AREA_COORDINATES[areaName];
                                    if (!coords) return null; // No renderizar si no hay coordenadas para el área

                                    // Escalar las coordenadas del SVG (1080x1080) al tamaño del contenedor
                                    // Ajusta los multiplicadores para 'scaledX' y 'scaledY'
                                    // Estos valores (0.8 y 0.3) son un punto de partida. Necesitarás ajustarlos manualmente
                                    // hasta que los números se alineen correctamente con las áreas en tu SVG.
                                    const scaledX = (coords.x / 1080) * (chartCardWidth * 0.8);
                                    const scaledY = (coords.y / 1080) * 300; // Ajusta el multiplicador según la nueva altura del SVG (350 en este caso, pero busca un valor que centre el número)

                                    // Ajustar el posicionamiento para centrar el número en la maqueta
                                    // Esto podría requerir un ajuste fino. Aquí resto un valor para moverlo "arriba a la izquierda" del centro.
                                    const offsetX = 10;
                                    const offsetY = 10;

                                    return (
                                        <View
                                            key={areaName}
                                            style={[
                                                styles.areaCountOverlay,
                                                { left: scaledX - offsetX, top: scaledY - offsetY }
                                            ]}
                                        >
                                            <Text style={[styles.areaCountText, { color: getAreaCountColor(count) }]}>
                                                {count}
                                            </Text>
                                        </View>
                                    );
                                })}
                            </View>
                            {/* Puedes agregar un mensaje de error si la ubicación no se encuentra */}
                            {/* {locationError && (
                                <Text style={styles.locationErrorText}>
                                    Error de ubicación: {locationError}
                                </Text>
                            )} */}
                        </View>
                        {/* --- FIN: Mapa de Ubicación de Residentes --- */}
                    </View>

                    <View style={styles.rightColumn}>
                        <View style={styles.chartCard}>
                            <Text style={styles.chartTitle}>Tendencia de tipo de alerta (Últimos 30 dias)</Text>
                            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                {datosAlertasPorTipoPastel.length > 0 ? (
                                    <PieChart
                                        data={datosAlertasPorTipoPastel}
                                        width={screenWidth * 0.9 / 2}
                                        height={220}
                                        chartConfig={chartConfig}
                                        accessor={'population'}
                                        backgroundColor={'transparent'}
                                        paddingLeft={'15'}
                                        center={[10, 0]}
                                        absolute
                                        renderDecorator={({ data, width, height, ...rest }) => {
                                            const total = data.reduce((sum, item) => sum + item.population, 0);
                                            const radius = Math.min(width, height) / 2;
                                            const centerX = width / 2;
                                            const centerY = height / 2;
                                            let currentAngle = 0;

                                            return data.map((item, index) => {
                                                const percentage = ((item.population / total) * 100).toFixed(0);
                                                const angle = (item.population / total) * 2 * Math.PI;
                                                const midAngle = currentAngle + angle / 2;

                                                const textRadius = radius * 0.8;
                                                const x = centerX + textRadius * Math.cos(midAngle - Math.PI / 2);
                                                const y = centerY + textRadius * Math.sin(midAngle - Math.PI / 2);

                                                currentAngle += angle;

                                                // Only render percentage if it's a visible slice (population > 0)
                                                if (item.population > 0) {
                                                    return (
                                                        <Text
                                                            key={index}
                                                            style={{
                                                                position: 'absolute',
                                                                left: x - (percentage.length * 3),
                                                                top: y - 10,
                                                                color: NEUTRAL_DARK,
                                                                fontSize: 14,
                                                                fontWeight: 'bold',
                                                                textAlign: 'center',
                                                            }}
                                                        >
                                                            {percentage}%
                                                        </Text>
                                                    );
                                                }
                                                return null;
                                            });
                                        }}
                                    />
                                ) : (
                                    <Text style={styles.noDataText}>No hay datos de alertas por tipo disponibles.</Text>
                                )}
                            </View>
                        </View>
                    </View>
                </View>

                {/* --- Listas de Alertas y Consultas --- */}
                <View style={styles.chartsAndListsContainer}>
                    <View style={styles.leftColumn}>
                        <View style={styles.compactListCard}>
                            <Text style={styles.chartTitle}>Alertas Recientes</Text>
                            <ScrollView nestedScrollEnabled={true} style={{ flex: 1 }}>
                                {dashboardData.ultimasAlertas.length > 0 ? (
                                    dashboardData.ultimasAlertas.map((item) => (
                                        <View
                                            key={item.id}
                                            style={[
                                                styles.activityItem,
                                                {
                                                    borderLeftColor: item.tipoAlertaNombre === 'Crítica' ? DANGER_COLOR : PRIMARY_ACCENT,
                                                    backgroundColor: item.tipoAlertaNombre === 'Crítica' ? `${DANGER_COLOR}1A` : CARD_BACKGROUND // Red background for critical alerts
                                                }
                                            ]}
                                        >
                                            <Ionicons name="warning-outline" size={20} color={item.tipoAlertaNombre === 'Crítica' ? DANGER_COLOR : PRIMARY_ACCENT} style={styles.activityIcon} />
                                            <View style={styles.activityTextContent}>
                                                <Text style={styles.activityDescription}>
                                                    <Text style={{ fontWeight: 'bold' }}>{item.tipoAlertaNombre}:</Text> {item.mensaje} - Residente <Text style={{ fontWeight: 'bold' }}>{item.residenteNombreCompleto}</Text>
                                                </Text>
                                                <Text style={styles.activityDate}>
                                                    {new Date(item.fecha).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </Text>
                                            </View>
                                        </View>
                                    ))
                                ) : (
                                    <Text style={styles.noDataText}>No hay alertas recientes.</Text>
                                )}
                            </ScrollView>
                        </View>
                    </View>

                    <View style={styles.rightColumn}>
                        <View style={styles.compactListCard}>
                            <Text style={styles.chartTitle}>Consultas Recientes</Text>
                            <ScrollView nestedScrollEnabled={true} style={{ flex: 1 }}>
                                {dashboardData.ultimosChequeos.length > 0 ? (
                                    dashboardData.ultimosChequeos.map((item) => {
                                        const checkupStatus = getCheckupStatus(item.frecuenciaCardiaca);
                                        const { name: iconName, color: iconColor } = getCheckupIconAndColor(checkupStatus);
                                        return (
                                            <View key={item.id} style={[styles.activityItem, { borderLeftColor: iconColor }]}>
                                                <Ionicons name={iconName} size={20} color={iconColor} style={styles.activityIcon} />
                                                <View style={styles.activityTextContent}>
                                                    <Text style={styles.activityDescription}>
                                                        <Text style={{ fontWeight: 'bold' }}>Residente:</Text> <Text style={{ fontWeight: 'bold' }}>{item.residenteNombreCompleto}</Text>
                                                    </Text>
                                                    <Text style={styles.activityDetails}>
                                                        FC: {item.frecuenciaCardiaca} bpm
                                                    </Text>
                                                    <Text style={styles.activityDetails}>Obs: {item.observaciones}</Text>
                                                    <Text style={styles.activityDate}>
                                                        {new Date(item.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                    </Text>
                                                </View>
                                            </View>
                                        );
                                    })
                                ) : (
                                    <Text style={styles.noDataText}>No hay chequeos recientes.</Text>
                                )}
                            </ScrollView>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
};

// --- Configuración Específica de Gráficas (lineChartConfig ya no se usará directamente para el mapa) ---
const lineChartConfig = {
    propsForDots: {
        r: '5',
        strokeWidth: '2',
        stroke: DANGER_COLOR, // Line chart dot color
        fill: CARD_BACKGROUND,
    },
    fillShadowGradientFrom: DANGER_COLOR,
    fillShadowGradientFromOpacity: 0.2,
    propsForBackgroundLines: {
        strokeWidth: 0.5,
        stroke: NEUTRAL_LIGHT,
    },
    propsForLabels: {
        fontSize: 10,
        fill: NEUTRAL_MEDIUM,
    },
    decimalPlaces: 0,
};

// --- Estilos ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BACKGROUND_LIGHT,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: BACKGROUND_LIGHT,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: NEUTRAL_MEDIUM,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: BACKGROUND_LIGHT,
        padding: 20,
    },
    errorText: {
        marginTop: 10,
        fontSize: 16,
        color: DANGER_COLOR,
        textAlign: 'center',
    },
    errorTextSmall: {
        marginTop: 5,
        fontSize: 12,
        color: NEUTRAL_MEDIUM,
        textAlign: 'center',
    },
    mainContent: {
        padding: 15,
        width: '100%',
        maxWidth: 1300,
        alignSelf: 'center',
        flex: 1,
    },
    kpiContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    kpiCard: {
        backgroundColor: CARD_BACKGROUND,
        borderRadius: 12,
        paddingVertical: 18,
        paddingHorizontal: 10,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 3,
        flexGrow: 1,
        flexBasis: '18%', // Approx. 5 cards per row on larger screens
        minWidth: 150,    // Minimum width for smaller screens
        margin: 8,
        justifyContent: 'center',
        borderWidth: 1,
    },
    kpiNumber: {
        fontSize: 28,
        fontWeight: 'bold',
        color: NEUTRAL_DARK,
        marginTop: 8,
    },
    kpiLabel: {
        marginTop: 5,
        fontSize: 13,
        color: NEUTRAL_MEDIUM,
        textAlign: 'center',
    },
    chartsAndListsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap', // Allows items to wrap to the next line on smaller screens
        justifyContent: 'space-between',
        width: '100%',
        flex: 1, // Allows this container to take available vertical space
    },
    leftColumn: {
        flex: 1,
        minWidth: 300, // Minimum width for the column on smaller screens
        marginRight: 10,
        flexGrow: 1,
        flexBasis: '48%', // Approx. half width for two columns
    },
    rightColumn: {
        flex: 1,
        minWidth: 300, // Minimum width for the column on smaller screens
        marginLeft: 10,
        flexGrow: 1,
        flexBasis: '48%', // Approx. half width for two columns
    },
    compactListCard: {
        backgroundColor: CARD_BACKGROUND,
        borderRadius: 12,
        padding: 15,
        marginBottom: 20, // Margin between this and next section if present
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 3,
        height: 255, // Fixed height to prevent scrolling of the overall dashboard
        borderWidth: 1,
        borderColor: NEUTRAL_LIGHT,
    },
    chartCard: {
        backgroundColor: CARD_BACKGROUND,
        borderRadius: 12,
        padding: 15,
        marginBottom: 35, // Margin between this and next section if present
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 3,
        height: 300, // Fixed height para el mapa
        borderWidth: 1,
        borderColor: NEUTRAL_LIGHT,
        // Eliminamos paddingBottom si queremos que el mapa ocupe todo el espacio vertical disponible
        // Si el SVG tiene elementos pegados al borde, el padding podría ser necesario.
    },
    chartTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: NEUTRAL_DARK,
        marginBottom: 15,
        textAlign: 'center',
    },
    // --- NUEVOS ESTILOS PARA EL MAPA SVG ---
    svgMapContainer: {
        flex: 1,
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        paddingVertical: 10, // Añadir padding vertical
    },
    areaCountOverlay: {
        position: 'absolute',
        // Puedes añadir estilos de fondo para los números si quieres que resalten más
        // backgroundColor: 'rgba(0,0,0,0.5)',
        // borderRadius: 5,
        // paddingHorizontal: 5,
        // paddingVertical: 2,
    },
    areaCountText: {
        fontSize: 18, // Tamaño del número
        fontWeight: 'bold',
        textAlign: 'center',
        // El color se asigna dinámicamente
    },
    // Fin NUEVOS ESTILOS

    chartStyle: {
        borderRadius: 8,
    },
    tooltip: {
        position: 'absolute',
        borderRadius: 5,
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    tooltipText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        borderRadius: 8,
        padding: 10,
        marginBottom: 8,
        borderLeftWidth: 5,
        backgroundColor: CARD_BACKGROUND, // Default background for list items
    },
    activityIcon: {
        marginRight: 8,
        marginTop: 2,
    },
    activityTextContent: {
        flex: 1,
    },
    activityDescription: {
        fontSize: 13,
        fontWeight: '600',
        color: NEUTRAL_DARK,
        marginBottom: 2,
    },
    activityDetails: {
        fontSize: 11,
        color: NEUTRAL_MEDIUM,
        marginBottom: 2,
    },
    activityDate: {
        fontSize: 10,
        color: NEUTRAL_MEDIUM,
        alignSelf: 'flex-end',
        marginTop: 3,
    },
    noDataText: {
        textAlign: 'center',
        color: NEUTRAL_MEDIUM,
        marginTop: 20,
        fontSize: 14,
    }
});

export default HomeScreen;