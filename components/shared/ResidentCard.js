import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';


const { width } = Dimensions.get('window');
const GAP_BETWEEN_CARDS = 10;

const PRIMARY_GREEN = '#6BB240';
const LIGHT_GREEN = '#9CD275';
const ACCENT_GREEN_BACKGROUND = '#EEF7E8';
const DARK_GRAY = '#333';
const MEDIUM_GRAY = '#555';
const LIGHT_GRAY = '#888';
const VERY_LIGHT_GRAY = '#eee';
const BACKGROUND_LIGHT = '#fcfcfc';
const WHITE = '#fff';
const ERROR_RED = '#DC3545';
const BUTTON_HOVER_COLOR = '#5aa130';
const ACCENT_BLUE = '#2563EB';


const getHealthStatusColor = (status) => {
  if (!status || typeof status !== 'string') return '#9CA3AF';
  switch (status.toLowerCase()) {
    case 'alta': return '#22C55E';
    case 'media':
    case 'moderada': return '#F59E0B';
    case 'baja': return '#EF4444';
    default: return '#9CA3AF';
  }
};

// New function to determine heart rate status based on reference average
const getHeartRateStatus = (currentHeartRate, referenceAverage) => {
  if (currentHeartRate === 'N/A' || !referenceAverage) return { text: 'N/A', color: LIGHT_GRAY };

  const difference = currentHeartRate - referenceAverage;
  const percentageDifference = (Math.abs(difference) / referenceAverage) * 100;

  if (percentageDifference <= 10) { // Within 10% of reference
    return { text: 'Normal', color: PRIMARY_GREEN };
  } else if (difference > 0) { // Higher than reference
    return { text: 'Alto', color: ERROR_RED };
  } else { // Lower than reference
    return { text: 'Bajo', color: '#F59E0B' };
  }
};

// New function to map activity status to a descriptive string
const getActivityDescription = (status) => {
  if (!status || typeof status !== 'string') return 'Desconocido';
  switch (status.toLowerCase()) {
    case 'reposo': return 'Descansando';
    case 'activo': return 'Caminando';
    case 'agitado': return 'Corriendo';
    default: return 'Desconocido';
  }
};

const getInitials = (nombre, apellido) => {
  let initials = '';
  if (nombre) {
    initials += nombre.charAt(0);
  }
  if (apellido) {
    initials += apellido.charAt(0);
  }
  return initials.toUpperCase();
};

const stringToHslColor = (str, s, l) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, ${s}%, ${l}%)`;
};

// Helper function to calculate a simple moving average
const calculateMovingAverage = (data, windowSize) => {
  if (data.length === 0) return [];
  if (windowSize <= 1) return data;

  const smoothedData = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - Math.floor(windowSize / 2));
    const end = Math.min(data.length - 1, i + Math.ceil(windowSize / 2) - 1);
    let sum = 0;
    let count = 0;
    for (let j = start; j <= end; j++) {
      sum += data[j];
      count++;
    }
    smoothedData.push(Math.round(sum / count)); // Round to nearest integer for BPM
  }
  return smoothedData;
};


const ResidentCard = ({ resident, onEdit, onDelete, onViewProfile, onHistory, onAssignDevice, gridContainerPadding }) => {
  const [imageLoadError, setImageLoadError] = useState(false);
  const [selectedBPMValue, setSelectedBPMValue] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const tooltipTimeoutRef = useRef(null);
  const tooltipOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setImageLoadError(false);
  }, [resident.foto_url]);

  const totalHorizontalPadding = gridContainerPadding * 2;
  const cardWidth = Platform.select({
    web: (width - totalHorizontalPadding - (GAP_BETWEEN_CARDS * 2)) / 2.5,
    default: (width - totalHorizontalPadding - GAP_BETWEEN_CARDS) / 2,
  });

  const age = resident.fecha_nacimiento ? new Date().getFullYear() - new Date(resident.fecha_nacimiento).getFullYear() : 'N/A';

  const numberOfPointsToShow = 7;
  // heartRateHistory is already sorted from most recent to oldest in ResidentsScreen
  const heartRateHistory = resident.historial_frecuencia_cardiaca || [];
  
  // Take the most recent 'numberOfPointsToShow' values.
  // The last element of this array will be the most recent historical value.
  let recentHeartRateDataRaw = heartRateHistory.slice(0, numberOfPointsToShow).reverse(); // Reverse to get oldest to newest for chart

  const latestHeartRateEntry = resident.latestHeartRateData; // Get the latest complete heart rate entry
  const displayedBPM = latestHeartRateEntry ? latestHeartRateEntry.ritmoCardiaco : 'N/A'; //
  const referenceAverageBPM = latestHeartRateEntry ? latestHeartRateEntry.promedioRitmoReferencia : null; //
  const currentActivityStatus = latestHeartRateEntry ? latestHeartRateEntry.estado : 'N/A'; //

  // --- Smoothing the graph data ---
  // Apply a moving average for stability.
  // A window size of 3 is a good starting point for smoothing.
  let smoothedHeartRateData = calculateMovingAverage(recentHeartRateDataRaw, 3);

  // Ensure the very last point of the graph always matches the current displayedBPM.
  // If there are data points, replace the last one with the exact displayedBPM.
  if (smoothedHeartRateData.length > 0 && displayedBPM !== 'N/A') {
    smoothedHeartRateData[smoothedHeartRateData.length - 1] = displayedBPM;
  } else if (displayedBPM !== 'N/A' && smoothedHeartRateData.length === 0) {
    // If no historical data but we have a current BPM, add it as the only point
    smoothedHeartRateData.push(displayedBPM);
  }
  // --- End Smoothing ---

  const averageGraph = smoothedHeartRateData.length ? (smoothedHeartRateData.reduce((a, b) => a + b, 0) / smoothedHeartRateData.length) : 0;
  const healthColor = getHealthStatusColor(resident.estado_salud_general);
  const heartRateStatus = getHeartRateStatus(displayedBPM, referenceAverageBPM);
  const activityDescription = getActivityDescription(currentActivityStatus);


  const heartRateChartData = {
    labels: smoothedHeartRateData.map((_, index) => {
      // Labels should reflect the 'days ago' for the displayed points
      // If we reversed the data, the last element is 'Today' (0 days ago)
      // The first element is 'numberOfPointsToShow - 1' days ago.
      const daysAgo = smoothedHeartRateData.length - 1 - index;
      if (daysAgo === 0) return 'Hoy';
      if (daysAgo < 0) return ''; // Should not happen with correct slicing
      return `D-${daysAgo}`;
    }),
    datasets: [
      {
        data: smoothedHeartRateData,
        color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
        strokeWidth: 2
      },
      {
        data: new Array(smoothedHeartRateData.length).fill(averageGraph),
        color: (opacity = 1) => `rgba(107, 178, 64, ${opacity * 0.6})`,
        strokeWidth: 1,
        withDots: false,
      }
    ]
  };

  const chartConfig = {
    backgroundGradientFrom: WHITE,
    backgroundGradientFromOpacity: 0,
    backgroundGradientTo: WHITE,
    backgroundGradientToOpacity: 0,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity * 0.5})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    propsForDots: {
      r: "5",
      strokeWidth: "2",
      stroke: ERROR_RED
    },
    fillShadowGradientFrom: '#FF6384',
    fillShadowGradientTo: WHITE,
    fillShadowGradientFromOpacity: 0.3,
    fillShadowGradientToOpacity: 0,
    formatYLabel: (label) => `${label} bpm`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity * 0.7})`,
  };

  const initialsBackgroundColor = stringToHslColor(
    `${resident.nombre || ''}${resident.apellido || ''}`,
    70,
    50
  );

  return (
    <View style={[styles.card, { width: '100%' }]}>
      <View style={styles.cardHeader}>
        {resident.foto_url && !imageLoadError ? (
          <Image
            source={{ uri: resident.foto_url }}
            style={styles.avatar}
            onError={() => setImageLoadError(true)}
            accessibilityLabel={`Foto de ${resident.nombre} ${resident.apellido}`}
          />
        ) : (
          <View style={[styles.initialsContainer, { backgroundColor: initialsBackgroundColor }]}>
            <Text style={styles.initialsText}>
              {getInitials(resident.nombre, resident.apellido)}
            </Text>
          </View>
        )}
        <View style={styles.headerInfo}>
          <Text style={styles.residentName}>{resident.nombre} {resident.apellido}</Text>
          <Text style={styles.residentDetails}>{age} años • Hab. {resident.nombre_area || 'N/A'}</Text>
        </View>
        {!resident.dispositivo && (
          <TouchableOpacity style={styles.addDeviceButton} onPress={() => onAssignDevice(resident.id_residente)}>
            <Ionicons name="bluetooth" size={18} color={WHITE} />
            <Text style={styles.addDeviceButtonText}>Agregar dispositivo</Text>
          </TouchableOpacity>
        )}
        {resident.estado_salud_general && (
          <View style={[styles.healthStatusTag, { backgroundColor: getHealthStatusColor(resident.estado_salud_general) }]}>
            <Text style={styles.healthStatusText}>{resident.estado_salud_general}</Text>
          </View>
        )}
      </View>

      <View style={styles.cardBody}>
        <View style={styles.heartRateSection}>
          <Ionicons name="heart-outline" size={14} color="#EF4444" />
          <Text style={styles.heartRateText}>FC:</Text>
          {resident.dispositivo && displayedBPM !== 'N/A' ? (
            <View style={styles.heartRateValueContainer}>
              <View style={[styles.heartRateRangeTag, { backgroundColor: heartRateStatus.color }]}>
                <Text style={styles.heartRateRangeText}>{heartRateStatus.text}</Text>
              </View>
              <Text style={styles.heartRateValue}>
                {displayedBPM}
                <Text style={styles.heartRateUnit}> bpm</Text>
              </Text>
              {referenceAverageBPM !== null && (
                <Text style={styles.referenceBPMText}> (Ref: {referenceAverageBPM} bpm)</Text>
              )}
            </View>
          ) : (
             <Text style={styles.heartRateValue}></Text>
          )}
        </View>

        {resident.dispositivo && currentActivityStatus !== 'N/A' && (
          <View style={styles.activitySection}>
            <Ionicons name="walk-outline" size={14} color={MEDIUM_GRAY} />
            <Text style={styles.activityText}>Actividad: </Text>
            <Text style={styles.activityValue}>{activityDescription}</Text>
          </View>
        )}

        <View style={styles.chartContainer}>
          {resident.dispositivo && smoothedHeartRateData && smoothedHeartRateData.length > 0 ? (
            <>
              <LineChart
                data={heartRateChartData}
                width={cardWidth - 16}
                height={90}
                chartConfig={chartConfig}
                bezier
                style={styles.chartStyle}
                withVerticalLabels={true}
                withHorizontalLabels={true}
                withDots={true}
                withInnerLines={false}
                withOuterLines={false}
                segments={3}
                onDataPointClick={(data) => {
                  if (tooltipTimeoutRef.current) {
                    clearTimeout(tooltipTimeoutRef.current);
                  }

                  tooltipOpacity.setValue(0);
                  setSelectedBPMValue(data.value);
                  setTooltipPosition({ x: data.x - 15, y: data.y - 20 });

                  Animated.timing(tooltipOpacity, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true,
                  }).start();

                  tooltipTimeoutRef.current = setTimeout(() => {
                    Animated.timing(tooltipOpacity, {
                      toValue: 0,
                      duration: 300,
                      useNativeDriver: true,
                    }).start(() => {
                      setSelectedBPMValue(null);
                      setTooltipPosition({ x: 0, y: 0 });
                    });
                  }, 1500);
                }}
              />
              {selectedBPMValue !== null && resident.dispositivo && (
                <Animated.View style={[styles.tooltipContainer, { left: tooltipPosition.x, top: tooltipPosition.y, opacity: tooltipOpacity }]}>
                  <Text style={styles.tooltipText}>{selectedBPMValue} bpm</Text>
                </Animated.View>
              )}
            </>
          ) : (
            <Text style={styles.noGraphData}>El residente no cuenta con un dispositivo asignado o no hay datos históricos.</Text>
          )}
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => onViewProfile(resident.id_residente)}>
          <Ionicons name="eye-outline" size={20} color={WHITE} style={styles.iconLeft} />
          <Text style={styles.actionButtonText}>Perfil</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => onEdit(resident.id_residente)}>
          <Ionicons name="create-outline" size={20} color={WHITE} style={styles.iconLeft} />
          <Text style={styles.actionButtonText}>Editar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: WHITE,
    borderRadius: 8,
    marginVertical: 6,
    overflow: 'hidden',
    borderWidth: 0,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
    position: 'relative',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: VERY_LIGHT_GRAY,
  },
  initialsContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: LIGHT_GRAY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: WHITE,
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerInfo: {
    flex: 1,
  },
  residentName: {
    fontSize: 14,
    fontWeight: '700',
    color: DARK_GRAY,
  },
  residentDetails: {
    fontSize: 10,
    color: LIGHT_GRAY,
    marginTop: 2,
  },
  healthStatusTag: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 20,
    marginLeft: 8,
  },
  healthStatusText: {
    color: WHITE,
    fontSize: 9,
    fontWeight: 'bold',
  },
  addDeviceButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: ACCENT_BLUE,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addDeviceButtonText: {
    color: WHITE,
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  cardBody: {
    padding: 8,
    paddingBottom: 30,
  },
  heartRateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 5,
  },
  heartRateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 4,
  },
  heartRateValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  heartRateValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: ERROR_RED,
  },
  heartRateUnit: {
    fontSize: 10,
    color: ERROR_RED,
  },
  heartRateRangeTag: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 10,
    marginRight: 4,
  },
  heartRateRangeText: {
    color: WHITE,
    fontSize: 9,
    fontWeight: 'bold',
  },
  referenceBPMText: {
    fontSize: 10,
    color: LIGHT_GRAY,
    marginLeft: 5,
  },
  activitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 10,
  },
  activityText: {
    fontSize: 12,
    fontWeight: '600',
    color: MEDIUM_GRAY,
    marginLeft: 4,
  },
  activityValue: {
    fontSize: 12,
    color: DARK_GRAY,
  },
  chartContainer: {
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 0,
    borderRadius: 5,
    alignSelf: 'center',
    marginTop: 5,
    position: 'relative',
  },
  chartStyle: {
  },
  noGraphData: {
    textAlign: 'center',
    color: LIGHT_GRAY,
    marginTop: 10,
    fontSize: 13,
  },
  tooltipContainer: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 5,
    zIndex: 10,
  },
  tooltipText: {
    color: WHITE,
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: VERY_LIGHT_GRAY,
    paddingVertical: 8,
    backgroundColor: BACKGROUND_LIGHT,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_GREEN,
    paddingVertical: 8,
    paddingHorizontal: 22,
    borderRadius: 6,
    marginHorizontal: 8,
    flexShrink: 1,
    shadowColor: 'transparent',
    elevation: 0,
  },
  actionButtonText: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '500',
  },
  iconLeft: {
    marginRight: 4,
  },
});

export default ResidentCard;