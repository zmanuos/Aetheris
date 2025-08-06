// ResidentsScreen.js
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
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useIsFocused } from '@react-navigation/native';
import ResidentCard from '../../components/shared/ResidentCard';
import Config from '../../config/config';
import { useNotification } from '../../src/context/NotificationContext';

const API_URL = Config.API_BASE_URL;
const GRID_CONTAINER_PADDING = 10;
const POLLING_INTERVAL_MS = 3000;
const { width } = Dimensions.get('window');
const IS_LARGE_SCREEN = width > 900;

export default function ResidentsScreen({ navigation, currentUserRole, currentUserId }) {
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
      let residentLocations = {};

      if (initialLoad || currentResidentsData.length === 0) {
        console.log('LOG: Fetching initial residents data...');
        const residentsResponse = await fetch(`${API_URL}/Residente`);
        if (!residentsResponse.ok) {
          throw new Error(`HTTP error! status: ${residentsResponse.status}`);
        }
        const residentsJson = await residentsResponse.json();

        if (residentsJson && Array.isArray(residentsJson.data)) {
          currentResidentsData = residentsJson.data;
        } else {
          console.warn('LOG: API de residentes no contiene un array en la propiedad "data". Respuesta:', residentsJson);
          currentResidentsData = [];
        }
      }

      // CORRECCIÓN Y LOGS: Fetch de ubicaciones
      try {
        const baseStaticUrl = API_URL.replace('/api', '');
        const locationsUrl = `${baseStaticUrl}/LecturasUbicacion/residentes`;
        console.log(`LOG: Fetching resident locations from URL: ${locationsUrl}`);
        const locationsResponse = await fetch(locationsUrl);

        console.log(`LOG: Locations fetch response status: ${locationsResponse.status}, OK: ${locationsResponse.ok}`);

        if (locationsResponse.ok) {
          const locationsData = await locationsResponse.json();
          console.log('LOG: Locations API response data:', locationsData);

          residentLocations = locationsData.reduce((acc, location) => {
            acc[location.residenteId] = location.area;
            return acc;
          }, {});
          console.log('LOG: Mapped resident locations object:', residentLocations);

        } else {
          console.warn(`LOG: No se pudo obtener la ubicación de los residentes: ${locationsResponse.statusText}`);
        }
      } catch (error) {
        console.error('LOG: Error al obtener las ubicaciones:', error);
      }
      
      const residentsWithDynamicData = await Promise.all(currentResidentsData.map(async (resident) => {
        let heartRateHistory = [];
        let latestHeartRate = null;

        try {
          const heartRateResponse = await fetch(`${API_URL}/LecturaResidente/${resident.id_residente}`);
          if (heartRateResponse.ok) {
            const heartRateData = await heartRateResponse.json();
            if (Array.isArray(heartRateData) && heartRateData.length > 0) {
              const sortedData = heartRateData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
              heartRateHistory = sortedData.map(record => record.ritmoCardiaco);
              if (sortedData.length > 0) {
                latestHeartRate = sortedData[0];
              }
            }
          } else {
            console.warn(`LOG: No se pudo obtener la frecuencia cardíaca para el residente ${resident.id_residente}: ${heartRateResponse.statusText}`);
          }
        } catch (error) {
          console.error(`LOG: Error al obtener la frecuencia cardíaca para el residente ${resident.id_residente}:`, error);
        }

        const baseStaticUrl = API_URL.replace('/api', '');
        const residentData = {
          ...resident,
          foto_url: resident.foto && resident.foto !== 'nophoto.png' ? `${baseStaticUrl}/images/residents/${resident.foto}` : null,
          historial_frecuencia_cardiaca: heartRateHistory,
          latestHeartRateData: latestHeartRate,
          ubicacion: residentLocations[resident.id_residente] || 'N/A', 
        };

        console.log(`LOG: Processed resident ${resident.id_residente} with location: ${residentData.ubicacion}`);
        return residentData;
      }));

      setResidents(residentsWithDynamicData);
      console.log('LOG: Residents state updated.');
    } catch (error) {
      console.error('LOG: Error general al obtener residentes:', error);
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
    if (route.params?.updateSuccess) {
      showNotification('Residente actualizado exitosamente!', 'success');
      navigation.setParams({ updateSuccess: undefined });
      fetchResidentsData(true);
    }
  }, [route.params?.registrationSuccess, route.params?.updateSuccess, showNotification, navigation, fetchResidentsData]);

  const handleAddNewResident = () => {
    navigation.navigate('RegisterResidentAndFamiliar');
  };

  const handleViewProfile = (id) => {
    navigation.navigate('ResidentProfile', {
      residentId: id,
      currentUserRole: currentUserRole,
      currentUserId: currentUserId,
    });
  };

  const handleHistory = (id) => {};

  const handleEditResident = (id) => {
    navigation.navigate('ResidentEditScreen', { residentId: id });
  };

  const handleAssignDevice = (residentId) => {};

  const filteredResidents = residents.filter(resident =>
    resident.nombre.toLowerCase().includes(searchText.toLowerCase()) ||
    resident.apellido.toLowerCase().includes(searchText.toLowerCase()) ||
    (resident.nombre_area && resident.nombre_area.toLowerCase().includes(searchText.toLowerCase()))
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.headerContainer}>
          <View style={styles.topControlsGroup}>
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
              <View style={{ marginTop: IS_LARGE_SCREEN ? 0 : 2 }}>
                <TouchableOpacity style={styles.filterButton}>
                  <Text style={styles.filterButtonText}>Filtros</Text>
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity style={styles.createButton} onPress={handleAddNewResident}>
              <Ionicons name="person-add" size={20} color={styles.createButtonText.color} />
              <Text style={styles.createButtonText}>NUEVO RESIDENTE</Text>
            </TouchableOpacity>
          </View>
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
                <View
                  key={resident.id_residente}
                  style={{
                    flexBasis: IS_LARGE_SCREEN ? '48%' : '100%',
                    maxWidth: IS_LARGE_SCREEN ? 800 : '100%',
                    paddingHorizontal: 8,
                    marginBottom: 15,
                  }}
                >
                  <ResidentCard
                    resident={resident}
                    onEdit={handleEditResident}
                    onViewProfile={handleViewProfile}
                    onHistory={handleHistory}
                    onAssignDevice={handleAssignDevice}
                    gridContainerPadding={GRID_CONTAINER_PADDING}
                  />
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    flexDirection: IS_LARGE_SCREEN ? 'row' : 'column',
    justifyContent: IS_LARGE_SCREEN ? 'space-between' : 'flex-start',
    alignItems: IS_LARGE_SCREEN ? 'center' : 'stretch',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 30 : 10,
    paddingBottom: 15,
    backgroundColor: '#fff',
  },

  topControlsGroup: {
    flexDirection: IS_LARGE_SCREEN ? 'row' : 'column',
    justifyContent: IS_LARGE_SCREEN ? 'space-between' : 'flex-start',
    alignItems: IS_LARGE_SCREEN ? 'center' : 'stretch',
    width: '100%',
    gap: 0,
  },
  createButton: {
    marginTop: IS_LARGE_SCREEN ? 0 : 10,
    flexDirection: 'row',
    backgroundColor: '#6BB240',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    width: IS_LARGE_SCREEN ? 'auto' : '100%',
  },

  createButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
  },
  searchFilterContainer: {
    flexDirection: IS_LARGE_SCREEN ? 'row' : 'column',
    alignItems: IS_LARGE_SCREEN ? 'center' : 'stretch',
    flex: 1,
    width: '100%',
    marginBottom: IS_LARGE_SCREEN ? 0 : 5,
    marginTop: IS_LARGE_SCREEN ? 0 : 80,
    gap: 0,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: IS_LARGE_SCREEN ? 8 : 2,
    marginRight: IS_LARGE_SCREEN ? 10 : 0,
    maxWidth: IS_LARGE_SCREEN ? 300 : '100%',
    width: IS_LARGE_SCREEN ? 'auto' : '100%',
    flexShrink: 1,
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
    marginTop: IS_LARGE_SCREEN ? 0 : 10,
    marginLeft: IS_LARGE_SCREEN ? 0 : 0,
    width: IS_LARGE_SCREEN ? 'auto' : '100%',
    alignItems: 'center',
    flexShrink: 1,
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
    paddingHorizontal: 24,
    gap: 10,
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