// AETHERIS/screens/admin/ResidentManagementScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Platform,
  TextInput, // Necesario para la barra de búsqueda (aunque solo placeholder por ahora)
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Config from '../../config/config';
import ResidentCard from '../../components/ResidentCard';

export default function ResidentManagementScreen() {
  // Estados para la carga y errores (aún se mantienen para la estructura, pero no se usarán con datos estáticos)
  const [isLoading, setIsLoading] = useState(false); // No cargamos, así que falso
  const [fetchError, setFetchError] = useState(''); // No hay error de fetch con datos estáticos

  // Datos estáticos de residentes
  const [residents, setResidents] = useState([
    {
      id_residente: 101,
      nombre: 'Sofía',
      apellido: 'Ramírez',
      fecha_nacimiento: '1945-03-10T00:00:00Z',
      genero: 'Femenino',
      telefono: '5511223344',
      activo: true,
      nombre_area: 'Ala A - Hab. 1',
      ultima_frecuencia_cardiaca: 75,
      historial_frecuencia_cardiaca: [70, 72, 75, 73, 76, 74, 75],
      estado_salud_general: 'Alta',
      fecha_ingreso: '2020-01-15T00:00:00Z',
      ubicacion_actual: 'Planta Baja, cerca de la ventana',
      contacto_familiar_nombre: 'Laura Ramírez',
      contacto_familiar_parentesco: 'Hija',
      contacto_familiar_telefono: '5598765432',
    },
    {
      id_residente: 102,
      nombre: 'Roberto',
      apellido: 'Castro',
      fecha_nacimiento: '1938-07-22T00:00:00Z',
      genero: 'Masculino',
      telefono: '5522334455',
      activo: true,
      nombre_area: 'Ala B - Hab. 5',
      ultima_frecuencia_cardiaca: 95, // Un poco alta para simular "Media"
      historial_frecuencia_cardiaca: [88, 92, 95, 90, 93, 94, 95],
      estado_salud_general: 'Media',
      fecha_ingreso: '2019-05-20T00:00:00Z',
      ubicacion_actual: 'Segundo Piso, cerca de la sala común',
      contacto_familiar_nombre: 'Miguel Castro',
      contacto_familiar_parentesco: 'Hijo',
      contacto_familiar_telefono: '5512345678',
    },
    {
      id_residente: 103,
      nombre: 'Isabel',
      apellido: 'Vargas',
      fecha_nacimiento: '1950-01-05T00:00:00Z',
      genero: 'Femenino',
      telefono: '5533445566',
      activo: false, // Inactivo para mostrar un caso
      nombre_area: 'Ala C - Hab. 10',
      ultima_frecuencia_cardiaca: 58, // Baja para simular "Baja"
      historial_frecuencia_cardiaca: [65, 60, 58, 62, 59, 60, 58],
      estado_salud_general: 'Baja',
      fecha_ingreso: '2021-09-01T00:00:00Z',
      ubicacion_actual: 'Primer Piso, patio interior',
      contacto_familiar_nombre: 'Ana Vargas',
      contacto_familiar_parentesco: 'Nieta',
      contacto_familiar_telefono: '5501234567',
    },
    {
      id_residente: 104,
      nombre: 'Fernando',
      apellido: 'López',
      fecha_nacimiento: '1962-11-20T00:00:00Z',
      genero: 'Masculino',
      telefono: '5544556677',
      activo: true,
      nombre_area: 'Ala A - Hab. 3',
      ultima_frecuencia_cardiaca: 80,
      historial_frecuencia_cardiaca: [78, 80, 82, 79, 81, 80, 80],
      estado_salud_general: 'Alta',
      fecha_ingreso: '2022-03-01T00:00:00Z',
      ubicacion_actual: 'Planta Baja, cerca de la entrada principal',
      contacto_familiar_nombre: 'Pablo López',
      contacto_familiar_parentesco: 'Sobrino',
      contacto_familiar_telefono: '5578901234',
    },
    {
      id_residente: 105,
      nombre: 'Carmen',
      apellido: 'Díaz',
      fecha_nacimiento: '1930-02-14T00:00:00Z',
      genero: 'Femenino',
      telefono: '5555667788',
      activo: true,
      nombre_area: 'Ala B - Hab. 7',
      ultima_frecuencia_cardiaca: 70,
      historial_frecuencia_cardiaca: [68, 70, 71, 69, 72, 70, 70],
      estado_salud_general: 'Alta',
      fecha_ingreso: '2018-08-10T00:00:00Z',
      ubicacion_actual: 'Segundo Piso, balcón sur',
      contacto_familiar_nombre: 'Elena Díaz',
      contacto_familiar_parentesco: 'Hija',
      contacto_familiar_telefono: '5534567890',
    },
  ]);

  // Las funciones fetchResidents y useEffect ya no son necesarias para datos estáticos
  // pero las mantengo comentadas para cuando quieras volver a la carga real.
  // const API_URL = Config.API_BASE_URL;
  // const fetchResidents = async () => {
  //   setIsLoading(true);
  //   setFetchError('');
  //   try {
  //     const response = await fetch(`${API_URL}/Residente`);
  //     if (!response.ok) {
  //       const errorData = await response.json();
  //       throw new Error(errorData.message || 'Error al cargar residentes del backend.');
  //     }
  //     const data = await response.json();
  //     if (data && data.residents) {
  //       setResidents(data.residents);
  //     } else {
  //       setResidents(data.data || data);
  //     }
  //     console.log("Residentes cargados:", data);
  //   } catch (error) {
  //     console.error("Error al cargar residentes:", error.message);
  //     setFetchError('No se pudieron cargar los residentes. Intenta de nuevo más tarde.');
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };
  // useEffect(() => {
  //   // fetchResidents(); // Comenta esta línea para usar datos estáticos
  // }, []);

  const handleAddNewResident = () => {
    Alert.alert('Funcionalidad', 'Navegar a la pantalla de añadir nuevo residente.');
  };

  const handleViewProfile = (id) => {
    Alert.alert('Ver Perfil', `Ver perfil del residente con ID: ${id}`);
  };

  const handleHistory = (id) => {
    Alert.alert('Ver Historial', `Ver historial médico del residente con ID: ${id}`);
  };

  const handleEditResident = (id) => {
    Alert.alert('Editar Residente', `Editar residente con ID: ${id}`);
  };

  const handleDeleteResident = (id) => {
    Alert.alert(
      'Confirmar Eliminación',
      `¿Estás seguro de que quieres eliminar al residente con ID: ${id}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          onPress: () => {
            Alert.alert('Eliminado', `Residente ${id} eliminado (simulado).`);
            // Aquí podrías filtrar los datos estáticos para simular la eliminación
            // setResidents(prevResidents => prevResidents.filter(r => r.id_residente !== id));
          },
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Gestión de Residentes</Text>
        <TouchableOpacity style={styles.createButton} onPress={handleAddNewResident}>
          <Ionicons name="person-add" size={20} color={styles.createButtonText.color} />
          <Text style={styles.createButtonText}>NUEVO RESIDENTE</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchFilterContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput // Usamos TextInput para la búsqueda
            style={styles.searchInput}
            placeholder="Buscar residente..."
            placeholderTextColor="#9CA3AF"
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
      ) : residents.length === 0 ? (
        <Text style={styles.noResidentsText}>No hay residentes registrados.</Text>
      ) : (
        <ScrollView style={styles.scrollView}>
          <View style={styles.residentsGrid}>
            {residents.map((resident) => (
              <ResidentCard
                key={resident.id_residente}
                resident={resident}
                onEdit={handleEditResident}
                onDelete={handleDeleteResident}
                onViewProfile={handleViewProfile}
                onHistory={handleHistory}
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
  searchInput: { // Estilo para el TextInput de búsqueda
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
    padding: 10,
  },
  residentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
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