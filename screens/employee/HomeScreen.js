import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, useWindowDimensions, TouchableOpacity, Animated, Easing, ActivityIndicator } from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import Config from '../../config/config';
import MaquetaSVG from '../../assets/images/maqueta';
import { useSession } from '../../src/context/SessionContext';

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

const API_ENDPOINT = `${Config.API_BASE_URL}/Dashboard`;
const RESIDENT_LOCATION_API_ENDPOINT = `${Config.API_BASE_URL.replace('/api', '')}/LecturasUbicacion/residentes`;
const CHECKUP_API_ENDPOINT = `${Config.API_BASE_URL}/ChequeoSemanal`;
const RESIDENT_DETAIL_API_ENDPOINT_BASE = `${Config.API_BASE_URL}/Residente`;
const PERSONAL_DETAIL_API_ENDPOINT_BASE = `${Config.API_BASE_URL}/Personal`;

const AREA_COORDINATES = {
    "patio": { x: 544.95, y: 545.13 },
    "sala medica": { x: 351.89, y: 345.6 },
    "comedor": { x: 689.35, y: 409.58 },
    "dormitorio": { x: 352.68, y: 735.63 },
};

const SVG_MAP_HEIGHT = 400;
const SVG_MAP_CARD_TOTAL_HEIGHT = SVG_MAP_HEIGHT + 50;

const REFRESH_INTERVAL = 15000; // 15 segundos

const HomeScreen = () => {
    const { width: screenWidth } = useWindowDimensions();
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0, visible: false, value: 0 });
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const [chartCardWidth, setChartCardWidth] = useState(screenWidth * 0.9 * 0.65 - 10);
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [residentLocationCounts, setResidentLocationCounts] = useState({});
    const [areaHeatmapColors, setAreaHeatmapColors] = useState({});
    const [weeklyCheckupsData, setWeeklyCheckupsData] = useState([]);
    const [svgRenderedSize, setSvgRenderedSize] = useState({ width: 0, height: 0 });
    const [pieChartCardWidth, setPieChartCardWidth] = useState(0);

    const { session } = useSession();
    const isAdmin = session.userRole === 'admin';

    const isMobile = screenWidth < 768;

    const getHeatmapColor = (count) => {
        if (count === 0) return `rgba(240, 240, 240, 0.3)`;
        if (count <= 2) return `rgba(180, 220, 180, 0.5)`;
        if (count <= 5) return `rgba(255, 255, 150, 0.6)`;
        if (count <= 9) return `rgba(255, 200, 100, 0.7)`;
        if (count <= 14) return `rgba(221, 123, 44, 0.9)`;
        return `rgba(232, 51, 51, 0.9)`;
    };

    const fetchData = async () => {
        try {
            const dashboardResponse = await fetch(API_ENDPOINT);
            if (!dashboardResponse.ok) {
                throw new Error(`HTTP error! status: ${dashboardResponse.status} from Dashboard API`);
            }
            const dashboardJson = await dashboardResponse.json();
            setDashboardData(dashboardJson);

            const locationResponse = await fetch(RESIDENT_LOCATION_API_ENDPOINT);
            if (!locationResponse.ok) {
                throw new Error(`HTTP error! status: ${locationResponse.status} from Resident Location API`);
            }
            const locationJson = await locationResponse.json();

            // Usamos un objeto para almacenar la última ubicación de cada residente.
            const latestLocations = {};
            locationJson.forEach(resident => {
                const residentId = resident.residenteId;
                const timestamp = new Date(resident.timestamp);

                // Si el residente no está en el objeto o si la lectura actual es más reciente, la guardamos.
                if (!latestLocations[residentId] || timestamp > new Date(latestLocations[residentId].timestamp)) {
                    latestLocations[residentId] = resident;
                }
            });

            // Ahora, contamos las ubicaciones únicas y más recientes.
            const counts = {};
            Object.values(latestLocations).forEach(resident => {
                const area = resident.area?.toLowerCase() || "desconocido";
                counts[area] = (counts[area] || 0) + 1;
            });
            setResidentLocationCounts(counts);

            const colors = {};
            Object.keys(AREA_COORDINATES).forEach(area => {
                const count = counts[area] || 0;
                colors[area] = getHeatmapColor(count);
            });
            setAreaHeatmapColors(colors);

            const checkupResponse = await fetch(CHECKUP_API_ENDPOINT);
            if (!checkupResponse.ok) {
                throw new Error(`HTTP error! status: ${checkupResponse.status} from Checkup API`);
            }
            const checkupJson = await checkupResponse.json();

            const enrichedCheckups = await Promise.all(checkupJson.map(async (checkup) => {
                const residentDetailUrl = `${RESIDENT_DETAIL_API_ENDPOINT_BASE}/${checkup.residenteId}`;
                let residentName = `ID: ${checkup.residenteId} (Desconocido)`;
                try {
                    const residentResponse = await fetch(residentDetailUrl);
                    if (!residentResponse.ok) {
                        console.warn(`Could not fetch resident details for ID: ${checkup.residenteId}, status: ${residentResponse.status}`);
                    } else {
                        const residentData = await residentResponse.json();
                        residentName = residentData.residente ? `${residentData.residente.nombre} ${residentData.residente.apellido}` : `ID: ${checkup.residenteId} (Desconocido)`;
                    }
                } catch (residentError) {
                    console.error(`Error fetching resident ID ${checkup.residenteId}:`, residentError);
                }

                const personalDetailUrl = `${PERSONAL_DETAIL_API_ENDPOINT_BASE}/${checkup.personalId}`;
                let personalName = `ID: ${checkup.personalId} (Desconocido)`;
                try {
                    const personalResponse = await fetch(personalDetailUrl);
                    if (!personalResponse.ok) {
                        console.warn(`Could not fetch personal details for ID: ${checkup.personalId}, status: ${personalResponse.status}`);
                    } else {
                        const personalData = await personalResponse.json();
                        personalName = personalData.personal ? `${personalData.personal.nombre} ${personalData.personal.apellido}` : `ID: ${checkup.personalId} (Desconocido)`;
                    }
                } catch (personalError) {
                    console.error(`Error fetching personal ID ${checkup.personalId}:`, personalError);
                }

                return { ...checkup, residenteNombreCompleto: residentName, personalNombreCompleto: personalName };
            }));

            setWeeklyCheckupsData(enrichedCheckups.slice(0, 3));

        } catch (err) {
            console.error("Error fetching data:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchData();
        const intervalId = setInterval(fetchData, REFRESH_INTERVAL);
        return () => clearInterval(intervalId);
    }, []);

    const onChartCardLayout = (event) => {
        const { width } = event.nativeEvent.layout;
        if (Math.abs(width - chartCardWidth) > 1) {
            setChartCardWidth(width);
        }
    };

    const onSvgLayout = (event) => {
        const { width, height } = event.nativeEvent.layout;
        if (width !== svgRenderedSize.width || height !== svgRenderedSize.height) {
            setSvgRenderedSize({ width, height });
        }
    };

    const onPieChartCardLayout = (event) => {
        const { width } = event.nativeEvent.layout;
        if (width !== pieChartCardWidth) {
            setPieChartCardWidth(width);
        }
    };

    const getKpiCardStyle = (status) => {
        switch (status) {
            case 'ok':
                return { borderColor: SECONDARY_ACCENT, backgroundColor: CARD_BACKGROUND };
            case 'warning':
                return { borderColor: WARNING_COLOR, backgroundColor: `${WARNING_COLOR}1A` };
            case 'critical':
                return { borderColor: DANGER_COLOR, backgroundColor: `${DANGER_COLOR}1A` };
            default:
                return { borderColor: NEUTRAL_MEDIUM, backgroundColor: CARD_BACKGROUND };
        }
    };

    const getCheckupStatus = (pulso) => {
        if (pulso <= 0 || pulso < 60 || pulso > 100) return "critical";
        if ((pulso >= 60 && pulso <= 70) || (pulso >= 90 && pulso <= 100)) return "warning";
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

    const getAreaCountColor = (count) => {
        if (count >= 10) return DANGER_COLOR;
        if (count >= 5) return WARNING_COLOR;
        return SECONDARY_ACCENT;
    };

    const datosAlertasPorTipoPastel = dashboardData ?
        dashboardData.tiposAlertaMasComunes.map(item => {
            let color;
            switch (item.tipoAlerta) {
                case 'Bradicardia':
                    color = DANGER_COLOR;
                    break;
                case 'Taquicardia':
                    color = WARNING_COLOR;
                    break;
                case 'Arritmia':
                    color = PRIMARY_ACCENT;
                    break;
                default:
                    color = NEUTRAL_MEDIUM;
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
        paddingLeft: 0,
        center: [0, 0],
    };

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
                <Text style={styles.errorTextSmall}>Asegúrate de que los backends estén corriendo en {API_ENDPOINT}, {RESIDENT_LOCATION_API_ENDPOINT} y {CHECKUP_API_ENDPOINT}</Text>
            </View>
        );
    }

    const kpiCardFlexBasis = isAdmin ? '31%' : '48%';

    const svgWidth = isMobile ? screenWidth * 0.9 - 20 : chartCardWidth * 0.65;
    const pieChartWidth = isMobile ? screenWidth * 0.7 - 20 : pieChartCardWidth - 10;

    return (
        <ScrollView style={styles.container}>
            <View style={styles.mainContent}>
                <View style={isMobile ? styles.dashboardTopSectionMobile : styles.dashboardTopSection}>
                    <View style={isMobile ? styles.fullWidthColumn : styles.svgMapColumn} onLayout={onChartCardLayout}>
                        <View style={[styles.chartCard, isMobile ? styles.svgMapCardHeightMobile : styles.svgMapCardHeight]}>
                            <Text style={styles.chartTitle}>Ubicación de Residentes</Text>
                            <View style={isMobile ? styles.svgAndLegendContainerMobile : styles.svgAndLegendContainer}>
                                <View style={isMobile ? styles.svgWrapperMobile : styles.svgWrapper} onLayout={onSvgLayout}>
                                    <MaquetaSVG
                                        width={"100%"}
                                        height={"100%"}
                                        areaColors={areaHeatmapColors}
                                    />
                                </View>
                                <View style={isMobile ? styles.legendContainerMobile : styles.legendContainer}>
                                    <Text style={styles.legendTitle}>Cant. Residentes</Text>
                                    <View style={styles.heatmapLegend}>
                                        <View style={styles.heatmapItem}>
                                            <View style={[styles.heatmapColor, { backgroundColor: 'rgba(240, 240, 240, 0.3)' }]} />
                                            <Text style={styles.heatmapText}>0</Text>
                                        </View>
                                        <View style={styles.heatmapItem}>
                                            <View style={[styles.heatmapColor, { backgroundColor: 'rgba(180, 220, 180, 0.5)' }]} />
                                            <Text style={styles.heatmapText}>1-2</Text>
                                        </View>
                                        <View style={styles.heatmapItem}>
                                            <View style={[styles.heatmapColor, { backgroundColor: 'rgba(255, 255, 150, 0.6)' }]} />
                                            <Text style={styles.heatmapText}>3-5</Text>
                                        </View>
                                        <View style={styles.heatmapItem}>
                                            <View style={[styles.heatmapColor, { backgroundColor: 'rgba(255, 200, 100, 0.7)' }]} />
                                            <Text style={styles.heatmapText}>6-9</Text>
                                        </View>
                                        <View style={styles.heatmapItem}>
                                            <View style={[styles.heatmapColor, { backgroundColor: 'rgba(255, 150, 100, 0.8)' }]} />
                                            <Text style={styles.heatmapText}>10-14</Text>
                                        </View>
                                        <View style={styles.heatmapItem}>
                                            <View style={[styles.heatmapColor, { backgroundColor: 'rgba(232,51,51,0.9)' }]} />
                                            <Text style={styles.heatmapText}>15+</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                    <View style={isMobile ? styles.fullWidthColumn : styles.kpisAndPieChartColumn}>
                        <View style={styles.kpiContainerNewPlacement}>
                            {isAdmin && (
                                <View style={[styles.kpiCard, styles.kpiCardStacked, getKpiCardStyle(dashboardData.cantidadEmpleadosActivos.status), { flexBasis: kpiCardFlexBasis }]}>
                                    <Ionicons name="briefcase-outline" size={32} color={NEUTRAL_DARK} />
                                    <Text style={styles.kpiNumber}>{dashboardData.cantidadEmpleadosActivos.value}</Text>
                                    <Text style={styles.kpiLabel}>Personal</Text>
                                </View>
                            )}
                            <View style={[styles.kpiCard, styles.kpiCardStacked, getKpiCardStyle(dashboardData.cantidadResidentesActivos.status), { flexBasis: kpiCardFlexBasis }]}>
                                <Ionicons name="people-outline" size={32} color={NEUTRAL_DARK} />
                                <Text style={styles.kpiNumber}>{dashboardData.cantidadResidentesActivos.value}</Text>
                                <Text style={styles.kpiLabel}>Residentes</Text>
                            </View>
                            <View style={[styles.kpiCard, styles.kpiCardStacked, getKpiCardStyle(dashboardData.ultimaTemperaturaAsilo.status), { flexBasis: kpiCardFlexBasis }]}>
                                <Ionicons name="thermometer-outline" size={32} color={NEUTRAL_DARK} />
                                <Text style={styles.kpiNumber}>{dashboardData.ultimaTemperaturaAsilo.value}°C</Text>
                                <Text style={styles.kpiLabel}>Temp. del Asilo</Text>
                            </View>
                        </View>
                        <View style={[styles.chartCard, isMobile ? styles.pieChartCardHeightMobile : styles.pieChartCardHeight]} onLayout={onPieChartCardLayout}>
                            <Text style={styles.chartTitle}>Tendencia de tipo de alerta (Ultima semana)</Text>
                            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                {datosAlertasPorTipoPastel.length > 0 && pieChartCardWidth > 0 ? (
                                    <PieChart
                                        width={isMobile ? screenWidth * 0.7 : pieChartCardWidth - 10}
                                        height={180}
                                        data={datosAlertasPorTipoPastel}
                                        chartConfig={chartConfig}
                                        accessor={'population'}
                                        backgroundColor={'transparent'}
                                        absolute
                                        renderDecorator={({ data, width, height, ...rest }) => {
                                            const total = data.reduce((sum, item) => sum + item.population, 0);
                                            let currentAngle = 0;

                                            return data.map((item, index) => {
                                                const percentage = ((item.population / total) * 100).toFixed(0);
                                                const angle = (item.population / total) * 2 * Math.PI;
                                                const midAngle = currentAngle + angle / 2;

                                                const textRadius = (Math.min(width, height) / 2) * 0.8;
                                                const x = (width / 2) + textRadius * Math.cos(midAngle - Math.PI / 2);
                                                const y = (height / 2) + textRadius * Math.sin(midAngle - Math.PI / 2);

                                                currentAngle += angle;

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
                <View style={isMobile ? styles.listsSectionMobile : styles.listsSection}>
                    <View style={isMobile ? styles.fullWidthColumn : styles.leftColumn}>
                        <View style={styles.compactListCard}>
                            <Text style={styles.chartTitle}>Alertas Recientes</Text>
                            <ScrollView nestedScrollEnabled={true} style={{ flex: 1 }}>
                                {dashboardData.ultimasAlertas.slice(0, 3).length > 0 ? (
                                    dashboardData.ultimasAlertas.slice(0, 3).map((item) => (
                                        <View
                                            key={item.id}
                                            style={[
                                                styles.activityItem,
                                                {
                                                    borderLeftColor: item.tipoAlertaNombre === 'Crítica' ? DANGER_COLOR : PRIMARY_ACCENT,
                                                    backgroundColor: item.tipoAlertaNombre === 'Crítica' ? `${DANGER_COLOR}1A` : CARD_BACKGROUND
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
                    <View style={isMobile ? styles.fullWidthColumn : styles.rightColumn}>
                        <View style={styles.compactListCard}>
                            <Text style={styles.chartTitle}>Consultas Recientes</Text>
                            <ScrollView nestedScrollEnabled={true} style={{ flex: 1 }}>
                                {weeklyCheckupsData.length > 0 ? (
                                    weeklyCheckupsData.map((item) => {
                                        const checkupStatus = getCheckupStatus(item.pulso);
                                        const { name: iconName, color: iconColor } = getCheckupIconAndColor(checkupStatus);
                                        return (
                                            <View key={item.id} style={[styles.activityItem, { borderLeftColor: iconColor }]}>
                                                <Ionicons name={iconName} size={20} color={iconColor} style={styles.activityIcon} />
                                                <View style={styles.activityTextContent}>
                                                    <Text style={styles.activityDescription}>
                                                        <Text style={{ fontWeight: 'bold' }}>Residente:</Text> <Text style={{ fontWeight: 'bold' }}>{item.residenteNombreCompleto || `ID: ${item.residenteId}`}</Text>
                                                    </Text>
                                                    <Text style={styles.activityDetails}>
                                                        <Text style={{ fontWeight: 'bold' }}>Realizada por:</Text> {item.personalNombreCompleto || `ID: ${item.personalId}`}
                                                    </Text>
                                                    <Text style={styles.activityDetails}>
                                                        <Text style={{ fontWeight: 'bold' }}>Pulso:</Text> {item.pulso} bpm
                                                    </Text>
                                                    <Text style={styles.activityDetails}>
                                                        <Text style={{ fontWeight: 'bold' }}>Temperatura:</Text> {item.temperaturaCorporal}°C
                                                    </Text>
                                                    <Text style={styles.activityDetails}>
                                                        <Text style={{ fontWeight: 'bold' }}>Observaciones:</Text> {item.observaciones}
                                                    </Text>
                                                    <Text style={styles.activityDate}>
                                                        {new Date(item.fechaChequeo).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
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
        </ScrollView>
    );
};

const lineChartConfig = {
    propsForDots: {
        r: '5',
        strokeWidth: '2',
        stroke: PURPLE,
        fill: CARD_BACKGROUND,
    },
    fillShadowGradientFrom: PURPLE,
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
        color: NEUTRAL_DARK,
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
        maxWidth: 1200,
        alignSelf: 'center',
        flex: 1,
    },
    kpiCard: {
        backgroundColor: CARD_BACKGROUND,
        borderRadius: 8,
        padding: 15,
        alignItems: 'center',
        flexGrow: 1,
        minWidth: 120,
        margin: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: NEUTRAL_LIGHT,
    },
    kpiCardStacked: {
        flex: 1,
        marginBottom: 10,
    },
    kpiNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: NEUTRAL_DARK,
        marginTop: 5,
    },
    kpiLabel: {
        marginTop: 2,
        fontSize: 12,
        color: NEUTRAL_MEDIUM,
        textAlign: 'center',
    },
    dashboardTopSection: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 15,
        width: '100%',
    },
    dashboardTopSectionMobile: {
        flexDirection: 'column',
        justifyContent: 'flex-start',
        marginBottom: 15,
        width: '100%',
    },
    svgMapColumn: {
        flex: 1,
        flexBasis: '49%',
        marginRight: 10,
        minWidth: 400,
    },
    kpisAndPieChartColumn: {
        flex: 1,
        flexBasis: '49%',
        marginLeft: 10,
        minWidth: 280,
        justifyContent: 'flex-start',
    },
    kpiContainerNewPlacement: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 15,
        width: '100%',
    },
    listsSection: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        width: '100%',
        flex: 1,
        marginBottom: 15,
    },
    listsSectionMobile: {
        flexDirection: 'column',
        width: '100%',
        flex: 1,
        marginBottom: 15,
    },
    leftColumn: {
        flex: 1,
        minWidth: 300,
        marginRight: 10,
        flexGrow: 1,
        flexBasis: '48%',
    },
    rightColumn: {
        flex: 1,
        minWidth: 300,
        marginLeft: 10,
        flexGrow: 1,
        flexBasis: '48%',
    },
    fullWidthColumn: {
        flex: 1,
        width: '100%',
        marginBottom: 15,
        marginRight: 0,
        marginLeft: 0,
    },
    compactListCard: {
        backgroundColor: CARD_BACKGROUND,
        borderRadius: 8,
        padding: 10,
        height: 250,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 15,
    },
    chartCard: {
        backgroundColor: CARD_BACKGROUND,
        borderRadius: 8,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 15,
    },
    svgMapCardHeight: {
        height: SVG_MAP_CARD_TOTAL_HEIGHT,
    },
    svgMapCardHeightMobile: {
        height: Dimensions.get('window').width * 0.9 + 50,
        marginTop: 100,
    },
    pieChartCardHeight: {
        height: 300,
    },
    pieChartCardHeightMobile: {
        height: 250,
    },
    chartTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: NEUTRAL_DARK,
        marginBottom: 10,
        textAlign: 'center',
    },
    svgAndLegendContainer: {
        flexDirection: 'row',
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'stretch',
        paddingVertical: 10,
    },
    svgAndLegendContainerMobile: {
        flexDirection: 'row',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 10,
    },
    svgWrapper: {
        flex: 3,
        height: SVG_MAP_HEIGHT,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    svgWrapperMobile: {
        width: '65%',
        height: Dimensions.get('window').width * 1,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    legendContainer: {
        flex: 1,
        paddingLeft: 15,
        justifyContent: 'center',
        alignSelf: 'stretch',
    },
    legendContainerMobile: {
        width: '35%',
        paddingTop: 15,
        paddingLeft: 5,
        justifyContent: 'center',
        alignItems: 'flex-start',
        alignSelf: 'stretch',
    },
    legendTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: NEUTRAL_DARK,
        marginBottom: 8,
        textAlign: 'left',
    },
    heatmapLegend: {
        marginBottom: 15,
    },
    heatmapItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    heatmapColor: {
        width: 16,
        height: 16,
        borderRadius: 3,
        marginRight: 6,
        borderWidth: 1,
        borderColor: NEUTRAL_LIGHT,
    },
    heatmapText: {
        fontSize: 11,
        color: NEUTRAL_MEDIUM,
        fontWeight: '500',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    legendColorBox: {
        width: 18,
        height: 18,
        borderRadius: 4,
        marginRight: 6,
        borderWidth: 1,
        borderColor: NEUTRAL_LIGHT,
    },
    legendText: {
        fontSize: 12,
        color: NEUTRAL_DARK,
        fontWeight: '500',
        flex: 1,
    },
    legendCount: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    chartStyle: {
        borderRadius: 8,
    },
    tooltip: {
        position: 'absolute',
        backgroundColor: 'rgba(0,0,0,0.7)',
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
        backgroundColor: CARD_BACKGROUND,
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