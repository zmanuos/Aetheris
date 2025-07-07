import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

const GAP_BETWEEN_CARDS = 5;

const getHealthStatusColor = (status) => {
  if (!status) return '#9CA3AF';
  switch (status.toLowerCase()) {
    case 'alta':
      return '#22C55E';
    case 'media':
    case 'moderada':
      return '#F59E0B';
    case 'baja':
      return '#EF4444';
    default:
      return '#9CA3AF';
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

const ResidentCard = ({ resident, onEdit, onDelete, onViewProfile, onHistory, gridContainerPadding }) => {
  const [imageLoadError, setImageLoadError] = useState(false);

  useEffect(() => {
    setImageLoadError(false);
  }, [resident.foto_url]);

  const totalHorizontalPadding = gridContainerPadding * 2;
  const totalGapWidth = GAP_BETWEEN_CARDS * 2;
  const cardWidth = (width - totalHorizontalPadding - totalGapWidth) / 3;

  const age = resident.fecha_nacimiento ? new Date().getFullYear() - new Date(resident.fecha_nacimiento).getFullYear() : 'N/A';

  const heartRateDataPoints = resident.historial_frecuencia_cardiaca || [];
  
  const numberOfPointsToShow = 7;
  const recentHeartRateData = heartRateDataPoints.slice(0, numberOfPointsToShow).reverse();

  const heartRateChartData = {
    labels: recentHeartRateData.map((_, index) => (index + 1).toString()), 
    datasets: [
      {
        data: recentHeartRateData,
        color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
        strokeWidth: 2 
      }
    ]
  };

  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientFromOpacity: 0,
    backgroundGradientTo: "#ffffff",
    backgroundGradientToOpacity: 0,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity * 0.5})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    propsForDots: {
      r: "3",
      strokeWidth: "1",
      stroke: "#FF6384"
    },
    fillShadowGradientFrom: '#FF6384',
    fillShadowGradientTo: '#ffffff',
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
          {resident.ultima_frecuencia_cardiaca !== null ? (
            <Text style={styles.heartRateValue}>{resident.ultima_frecuencia_cardiaca}<Text style={styles.heartRateUnit}>bpm</Text></Text>
          ) : (
            <Text style={styles.heartRateValue}>N/A</Text>
          )}
        </View>
        {recentHeartRateData && recentHeartRateData.length > 0 ? (
            <LineChart
              data={heartRateChartData}
              width={cardWidth - 16}
              height={80}
              chartConfig={chartConfig}
              bezier
              style={styles.chartStyle}
              withVerticalLabels={false}
              withHorizontalLabels={false}
              withDots={true}
              withInnerLines={false}
              withOuterLines={false}
              segments={3}
            />
        ) : (
            <Text style={styles.noGraphData}>Sin historial de FC disponible.</Text>
        )}
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionButtonIcon} onPress={() => onViewProfile(resident.id_residente)}>
          <Ionicons name="eye-outline" size={18} color="#6B7280" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButtonIcon} onPress={() => onHistory(resident.id_residente)}>
          <Ionicons name="analytics-outline" size={18} color="#6B7280" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButtonIcon} onPress={() => onEdit(resident.id_residente)}>
          <Ionicons name="create-outline" size={18} color="#6B7280" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButtonIcon} onPress={() => onDelete(resident.id_residente)}>
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
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
    padding: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F3F4F6',
  },
  initialsContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#A0A0A0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerInfo: {
    flex: 1,
  },
  residentName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  residentDetails: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
  healthStatusTag: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 20,
    marginLeft: 8,
  },
  healthStatusText: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
  },
  cardBody: {
    padding: 8,
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
  heartRateValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#EF4444',
    marginLeft: 'auto',
  },
  heartRateUnit: {
    fontSize: 10,
    color: '#EF4444',
  },
  chartStyle: {
    marginVertical: 0,
    borderRadius: 5,
    alignSelf: 'center',
    marginTop: 5,
  },
  noGraphData: {
    textAlign: 'center',
    color: '#9CA3AF',
    marginTop: 10,
    fontSize: 11,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 0.5,
    borderTopColor: '#F9FAFB',
    paddingVertical: 8,
    backgroundColor: '#FDFDFD',
  },
  actionButtonIcon: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#EAEAEA',
  },
});

export default ResidentCard;