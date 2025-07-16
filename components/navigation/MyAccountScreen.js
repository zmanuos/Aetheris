import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const MyAccountScreen = ({ route }) => {
  const { firebaseUid } = route.params; 
  const [adminEmail, setAdminEmail] = useState('Cargando...');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAdminEmail = async () => {
      if (!firebaseUid) {
        setError('UID de Firebase no disponible.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:5214/api/Personal/manage/get-correo/${firebaseUid}`);

        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        if (data && data.email) { 
          setAdminEmail(data.email);
        } else {
          setError('No se encontró correo electrónico para este UID.');
          setAdminEmail('No disponible');
        }
      } catch (err) {
        setError(`Error al obtener el correo: ${err.message}`);
        setAdminEmail('Error al cargar');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminEmail();
  }, [firebaseUid]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="person-circle-outline" size={60} color="#6BB240" />
          <Text style={styles.title}>Mi Cuenta</Text>
        </View>
        <View style={styles.detailsContainer}>
          <Text style={styles.detailText}>
            <Text style={styles.detailLabel}>Nombre de Usuario:</Text> UsuarioEjemplo
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.detailLabel}>ID de Usuario:</Text> {firebaseUid || 'No disponible'}
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.detailLabel}>Rol:</Text> Administrador
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.detailLabel}>Email:</Text> {loading ? <ActivityIndicator size="small" color="#6BB240" /> : adminEmail}
          </Text>
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
        <Text style={styles.infoText}>
          Esta es una pantalla de ejemplo para la configuración de tu cuenta.
          Aquí se mostrarían tus datos personales y opciones de perfil.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  detailsContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '100%',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  detailText: {
    fontSize: 16,
    marginBottom: 10,
    color: '#555',
  },
  detailLabel: {
    fontWeight: 'bold',
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginTop: 10,
  },
});

export default MyAccountScreen;