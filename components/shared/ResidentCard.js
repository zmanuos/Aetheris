// ResidentCard.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';


const { width } = Dimensions.get('window');
const GAP_BETWEEN_CARDS = 10;

// Color palette definitions
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
const ACCENT_BLUE = '#2563EB'; // New blue color


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

const getHeartRateRange = (heartRate) => {
  if (heartRate >= 60 && heartRate <= 100) {
    return { text: 'Normal', color: PRIMARY_GREEN };
  } else if (heartRate > 100) {
    return { text: 'Alto', color: ERROR_RED };
  } else if (heartRate < 60 && heartRate !== 0) {
    return { text: 'Bajo', color: '#F59E0B' };
  }
  return { text: 'N/A', color: LIGHT_GRAY };
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

const ResidentCard = ({ resident, onEdit, onDelete, onViewProfile, onHistory, onAssignDevice, gridContainerPadding }) => {
  const [imageLoadError, setImageLoadError] = useState(false);
  const [selectedBPMValue, setSelectedBPMValue] = useState(null);

  useEffect(() => {
    setImageLoadError(false);
  }, [resident.foto_url]);

  const totalHorizontalPadding = gridContainerPadding * 2;
  const cardWidth = Platform.select({
    web: (width - totalHorizontalPadding - (GAP_BETWEEN_CARDS * 2)) / 2.5, 
    default: (width - totalHorizontalPadding - GAP_BETWEEN_CARDS) / 2,
  });


  const age = resident.fecha_nacimiento ? new Date().getFullYear() - new Date(resident.fecha_nacimiento).getFullYear() : 'N/A';

  const heartData = resident.historial_frecuencia_cardiaca.slice(-7);
  const average = heartData.length ? (heartData.reduce((a, b) => a + b, 0) / heartData.length) : 0;
  const healthColor = getHealthStatusColor(resident.estado_salud_general);
  const heartRateRange = getHeartRateRange(resident.ultima_frecuencia_cardiaca);


  const heartRateDataPoints = resident.historial_frecuencia_cardiaca || [];

  const numberOfPointsToShow = 7;
  const recentHeartRateData = heartRateDataPoints.slice(0, numberOfPointsToShow).reverse();

  const heartRateChartData = {
    labels: recentHeartRateData.map((_, index) => (index + 1).toString()),
    datasets: [
      {
        data: recentHeartRateData,
        color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
        strokeWidth: 2
      },
      {
        data: new Array(heartData.length).fill(average),
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
      r: "4",
      strokeWidth: "2",
      stroke: ERROR_RED
    },
    fillShadowGradientFrom: '#FF6384',
    fillShadowGradientTo: WHITE,
    fillShadowGradientFromOpacity: 0.3,
    fillShadowGradientToOpacity: 0,
  };

  const initialsBackgroundColor = stringToHslColor(
    `${resident.nombre || ''}${resident.apellido || ''}`,
    70,
    50
  );

  return (
    <View style={[styles.card, { width: cardWidth, marginHorizontal: GAP_BETWEEN_CARDS / 2 }]}>
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
          // Button is back in the header as an absolutely positioned element
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
          {resident.dispositivo && resident.ultima_frecuencia_cardiaca && (
            <View style={styles.heartRateValueContainer}>
              <View style={[styles.heartRateRangeTag, { backgroundColor: heartRateRange.color }]}>
                <Text style={styles.heartRateRangeText}>{heartRateRange.text}</Text>
              </View>
              <Text style={styles.heartRateValue}>
                {selectedBPMValue !== null ? selectedBPMValue : resident.ultima_frecuencia_cardiaca}
                <Text style={styles.heartRateUnit}> bpm</Text>
              </Text>
            </View>
          )}
        </View>
        <View style={styles.chartContainer}>
          {resident.dispositivo && recentHeartRateData && recentHeartRateData.length > 0 ? (
            <LineChart
              data={heartRateChartData}
              width={cardWidth - 16}
              height={80}
              chartConfig={chartConfig}
              bezier
              style={styles.chartStyle}
              withVerticalLabels={true}
              withHorizontalLabels={false}
              withDots={true}
              withInnerLines={false}
              withOuterLines={false}
              segments={3}
              onDataPointClick={(data) => {
                setSelectedBPMValue(data.value);
                setTimeout(() => setSelectedBPMValue(null), 3000);
              }}
            />
          ) : (
            // Only the message remains here when no device is assigned
            <Text style={styles.noGraphData}>El residente no cuenta con un dispositivo asignado.</Text>
          )}
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => onViewProfile(resident.id_residente)}>
          <Ionicons name="eye-outline" size={16} color={WHITE} style={styles.iconLeft} />
          <Text style={styles.actionButtonText}>Perfil</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => onHistory(resident.id_residente)}>
          <Ionicons name="analytics-outline" size={16} color={WHITE} style={styles.iconLeft} />
          <Text style={styles.actionButtonText}>Historial</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => onEdit(resident.id_residente)}>
          <Ionicons name="create-outline" size={16} color={WHITE} style={styles.iconLeft} />
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
  addDeviceButton: { // Re-added and adjusted styles for absolute positioning
    position: 'absolute',
    top: 15, // Maintain space above
    right: 8,
    backgroundColor: ACCENT_BLUE, // Blue background
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addDeviceButtonText: { // Re-added styles
    color: WHITE, // White text
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  cardBody: {
    padding: 8,
    paddingBottom: 22,
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
  chartContainer: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 0,
    borderRadius: 5,
    alignSelf: 'center',
    marginTop: 5,
  },
  chartStyle: {
    // Styles for chart container are handled by chartContainer
  },
  // Removed noDeviceContent, addDeviceButtonNoDevice, addDeviceButtonTextNoDevice styles
  noGraphData: {
    textAlign: 'center',
    color: LIGHT_GRAY,
    marginTop: 10,
    fontSize: 13,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginHorizontal: 2,
    flexShrink: 1,
    shadowColor: 'transparent',
    elevation: 0,
  },
  actionButtonText: {
    color: WHITE,
    fontSize: 12,
    fontWeight: '500',
  },
  iconLeft: {
    marginRight: 4,
  },
});

export default ResidentCard;