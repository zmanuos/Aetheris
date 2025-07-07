import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useIsFocused } from '@react-navigation/native';
import ResidentCard from '../../components/shared/ResidentCard';
import Config from '../../config/config';
import { useNotification } from '../../src/context/NotificationContext';

const API_URL = Config.API_BASE_URL;
const GRID_CONTAINER_PADDING = 10;
const POLLING_INTERVAL_MS = 3000;

export default function ResidentsScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [residents, setResidents] = useState([]);
  const [searchText, setSearchText] = useState('');

  const { showNotification } = useNotification();
  const route = useRoute();
  const isFocused = useIsFocused();

  const residentsRef = useRef(residents);
  useEffect(() => {
    residentsRef.current = residents;
  }, [residents]);

  const fetchResidentsData = useCallback(async (initialLoad = false) => {
    if (initialLoad) setIsLoading(true);
    setFetchError('');

    try {
      let currentResidentsData = residentsRef.current;
      
      if (initialLoad || currentResidentsData.length === 0) {
        const residentsResponse = await fetch(`${API_URL}/Residente`);
        if (!residentsResponse.ok) {
          throw new Error(`HTTP error! status: ${residentsResponse.status}`);
        }
        const residentsJson = await residentsResponse.json();

        if (Array.isArray(residentsJson)) {
          currentResidentsData = residentsJson;
        } else if (residentsJson && (residentsJson.data || residentsJson.items || residentsJson.residents)) {
          currentResidentsData = residentsJson.data || residentsJson.items || residentsJson.residents;
          if (!Array.isArray(currentResidentsData)) {
              console.warn('Se esperaba un array en data/items/residents, pero se obtuvo:', currentResidentsData);
              currentResidentsData = [];
          }
        } else {
          console.warn('La respuesta de la API de residentes no es un array y no contiene la propiedad data/items/residents. Respuesta:', residentsJson);
          currentResidentsData = [];
        }
      }

      const baseStaticUrl = API_URL.replace('/api', '');

      const residentsWithDynamicData = await Promise.all(currentResidentsData.map(async (resident) => {
        let heartRateHistory = [];
        let latestHeartRate = null;

        try {
          const heartRateResponse = await fetch(`${API_URL}/LecturaResidente/${resident.id_residente}`);
          if (heartRateResponse.ok) {
            const heartRateData = await heartRateResponse.json();
            if (Array.isArray(heartRateData)) {
              const sortedData = heartRateData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
              
              heartRateHistory = sortedData.map(record => record.ritmoCardiaco);
              if (sortedData.length > 0) {
                latestHeartRate = sortedData[0].ritmoCardiaco;
              }
            }
          } else {
            console.warn(`No se pudo obtener la frecuencia cardíaca para el residente ${resident.id_residente}: ${heartRateResponse.statusText}`);
          }
        } catch (error) {
          console.error(`Error al obtener la frecuencia cardíaca para el residente ${resident.id_residente}:`, error);
        }

        return {
          ...resident,
          foto_url: resident.foto && resident.foto !== 'nophoto.png' ? `${baseStaticUrl}/images/residents/${resident.foto}` : null,
          historial_frecuencia_cardiaca: heartRateHistory,
          ultima_frecuencia_cardiaca: latestHeartRate,
        };
      }));

      setResidents(residentsWithDynamicData);
    } catch (error) {
      console.error('Error al obtener residentes:', error);
      setFetchError('No se pudieron cargar los residentes. Intenta de nuevo más tarde.');
      if (initialLoad) showNotification('Error al cargar residentes.', 'error');
    } finally {
      if (initialLoad) setIsLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    let pollingInterval;
    if (isFocused) {
      fetchResidentsData(true);
      pollingInterval = setInterval(() => {
        fetchResidentsData(false);
      }, POLLING_INTERVAL_MS);
    }

    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [isFocused, fetchResidentsData]);

  useEffect(() => {
    if (route.params?.registrationSuccess) {
      showNotification('Residente registrado exitosamente!', 'success');
      navigation.setParams({ registrationSuccess: undefined });
    }
  }, [route.params?.registrationSuccess, showNotification, navigation]);

  const handleAddNewResident = () => {
    navigation.navigate('RegisterResidentAndFamiliar');
  };

  const handleViewProfile = (id) => {
    showNotification(`Navegando a perfil del residente con ID: ${id}`, 'info');
    // navigation.navigate('ResidentProfile', { residentId: id });
  };

  const handleHistory = (id) => {
    showNotification(`Navegando a historial médico del residente con ID: ${id}`, 'info');
    // navigation.navigate('ResidentHistory', { residentId: id });
  };

  const handleEditResident = (id) => {
    showNotification(`Navegando a edición del residente con ID: ${id}`, 'info');
    // navigation.navigate('EditResident', { residentId: id });
  };

  const handleDeleteResident = (id) => {
    Alert.alert(
      'Confirmar Eliminación',
      '¿Estás seguro de que quieres eliminar a este residente? Esta acción es irreversible.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          onPress: async () => {
            setIsLoading(true);
            try {
              const response = await fetch(`${API_URL}/Residente/${id}`, {
                method: 'DELETE',
              });

              if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error al eliminar residente: ${errorText || response.statusText}`);
              }

              showNotification('Residente eliminado exitosamente.', 'success');
              fetchResidentsData(true); 
            } catch (error) {
              console.error('Error deleting resident:', error);
              showNotification(`Error al eliminar: ${error.message}`, 'error');
            } finally {
              setIsLoading(false);
            }
          },
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };

  const filteredResidents = residents.filter(resident =>
    resident.nombre.toLowerCase().includes(searchText.toLowerCase()) ||
    resident.apellido.toLowerCase().includes(searchText.toLowerCase()) ||
    (resident.nombre_area && resident.nombre_area.toLowerCase().includes(searchText.toLowerCase()))
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.createButton} onPress={handleAddNewResident}>
          <Ionicons name="person-add" size={20} color={styles.createButtonText.color} />
          <Text style={styles.createButtonText}>NUEVO RESIDENTE</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchFilterContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar residente..."
            placeholderTextColor="#9CA3AF"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterButtonText}>Filtros</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#10B981" style={styles.loadingIndicator} />
      ) : fetchError ? (
        <Text style={styles.errorText}>{fetchError}</Text>
      ) : filteredResidents.length === 0 ? (
        <Text style={styles.noResidentsText}>No hay residentes registrados que coincidan con la búsqueda.</Text>
      ) : (
        <ScrollView style={styles.scrollView}>
          <View style={styles.residentsGrid}>
            {filteredResidents.map((resident) => (
              <ResidentCard
                key={resident.id_residente}
                resident={resident}
                onEdit={handleEditResident}
                onDelete={handleDeleteResident}
                onViewProfile={handleViewProfile}
                onHistory={handleHistory}
                gridContainerPadding={GRID_CONTAINER_PADDING}
              />
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  createButton: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#10B981',
    shadowColor: 'transparent',
    elevation: 0,
  },
  createButtonText: {
    color: '#10B981',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
  },
  searchFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginRight: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  filterButton: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  filterButtonText: {
    color: '#4B5563',
    fontSize: 15,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  residentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: GRID_CONTAINER_PADDING,
  },
  loadingIndicator: {
    marginTop: 50,
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  noResidentsText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#6B7280',
  },
});