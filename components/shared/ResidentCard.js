// AETHERIS/components/shared/ResidentCard.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Definimos la constante del gap deseado entre las tarjetas
const GAP_BETWEEN_CARDS = 2; // Espacio deseado entre las dos tarjetas

// La constante para el padding del contenedor ahora se recibe como prop
// para asegurar que el cálculo sea siempre consistente.

const getHealthStatusColor = (status) => {
  switch (status.toLowerCase()) {
    case 'alta':
      return '#22C55E'; // Green
    case 'media':
    case 'moderada': // Agregamos 'moderada' por si acaso
      return '#F59E0B'; // Yellow/Orange
    case 'baja':
      return '#EF4444'; // Red
    default:
      return '#9CA3AF'; // Gray
  }
};

const ResidentCard = ({ resident, onEdit, onDelete, onViewProfile, onHistory, gridContainerPadding }) => {

  const availableWidthForContent = width - (3 * gridContainerPadding);
  const cardWidth = (availableWidthForContent - GAP_BETWEEN_CARDS) / 3;


  const age = resident.fecha_nacimiento ? new Date().getFullYear() - new Date(resident.fecha_nacimiento).getFullYear() : 'N/A';

  const renderHeartRateGraph = (data) => {
    if (!data || data.length === 0) {
      return <Text style={styles.noGraphData}>Sin datos.</Text>;
    }
    return (
      <View style={styles.heartRateGraphContainer}>
        {data.slice(-7).map((value, index) => (
          <View
            key={index}
            style={[
              styles.heartRateBar,
              { height: Math.max(2, value / 4) }, // Altura mínima de 2px para que se vea
              { backgroundColor: value > 90 || value < 60 ? '#EF4444' : '#10B981' }
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    // No aplicamos marginHorizontal a la tarjeta, ya que justifyContent: 'space-between'
    // en el contenedor manejará el espacio entre las dos tarjetas.
    <View style={[styles.card, { width: cardWidth }]}>
      <View style={styles.cardHeader}>
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="person-circle-outline" size={30} color="#9CA3AF" />
        </View>
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
          {resident.ultima_frecuencia_cardiaca && (
            <Text style={styles.heartRateValue}>{resident.ultima_frecuencia_cardiaca}<Text style={styles.heartRateUnit}>bpm</Text></Text>
          )}
        </View>
        {renderHeartRateGraph(resident.historial_frecuencia_cardiaca)}
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
    marginVertical: 6, // Margen vertical para espacio entre filas
    // marginHorizontal ya no es necesario aquí, lo maneja justifyContent del padre
    overflow: 'hidden',
    borderWidth: 0,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
  },
  avatarPlaceholder: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  headerInfo: {
    flex: 1,
  },
  residentName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  residentDetails: {
    fontSize: 9,
    color: '#6B7280',
    marginTop: 1,
  },
  healthStatusTag: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 15,
    marginLeft: 5,
  },
  healthStatusText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
  },
  cardBody: {
    padding: 8,
  },
  heartRateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 3,
  },
  heartRateText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 4,
  },
  heartRateValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#EF4444',
    marginLeft: 'auto',
  },
  heartRateUnit: {
    fontSize: 9,
    color: '#EF4444',
  },
  heartRateGraphContainer: {
    flexDirection: 'row',
    height: 20,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 1,
    marginTop: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E0E0E0',
  },
  heartRateBar: {
    width: 2,
    borderRadius: 1,
    marginHorizontal: 0.5,
  },
  noGraphData: {
    textAlign: 'center',
    color: '#9CA3AF',
    marginTop: 5,
    fontSize: 9,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 0.5,
    borderTopColor: '#F9FAFB',
    paddingVertical: 6,
    backgroundColor: '#FDFDFD',
  },
  actionButtonIcon: {
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 5,
  },
});

export default ResidentCard;