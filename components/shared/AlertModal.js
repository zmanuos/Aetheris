// fileName: AlertModal.js
import React, { useState, useEffect, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Platform, Image, Animated, Easing } from 'react-native';

// URL base de la nueva API para la ubicación.
const RESIDENT_LOCATION_API_ENDPOINT_BASE = 'http://localhost:5214/LecturasUbicacion/residente';
const residentPhotoBaseUrl = 'http://localhost:5214/images/residents'; 

// Función auxiliar para convertir a "Title Case"
const toTitleCase = (str) => {
  return str.replace(
    /\w\S*/g,
    function(txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    }
  );
};

const AlertModal = ({ isVisible, alertData, onConfirm }) => {
  const [residenteLocation, setResidenteLocation] = useState(null);

  // Animación para el pulso de escala del modal
  const modalScalePulseAnim = useRef(new Animated.Value(1)).current;

  // Animación para el pulso del borde del modal (grosor y color)
  const modalBorderPulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let modalScalePulse;
    let modalBorderPulse;

    const fetchResidentLocation = async (residenteId) => {
        try {
            const response = await fetch(`${RESIDENT_LOCATION_API_ENDPOINT_BASE}/${residenteId}`);
            if (response.ok) {
                const data = await response.json();
                setResidenteLocation(data);
            } else {
                console.error("Failed to fetch resident location:", response.status);
                setResidenteLocation(null);
            }
        } catch (error) {
            console.error("Error fetching resident location:", error);
            setResidenteLocation(null);
        }
    };

    if (isVisible) {
      modalScalePulse = Animated.loop(
        Animated.sequence([
          Animated.timing(modalScalePulseAnim, {
            toValue: 1.05,
            duration: 500,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(modalScalePulseAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      modalScalePulse.start();

      modalBorderPulse = Animated.loop(
        Animated.sequence([
          Animated.timing(modalBorderPulseAnim, {
            toValue: 1,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(modalBorderPulseAnim, {
            toValue: 0,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ])
      );
      modalBorderPulse.start();

      const residenteIdToFetch = alertData?.residente?.Id_residente;

      if (residenteIdToFetch) {
        fetchResidentLocation(residenteIdToFetch);
      } else {
        console.warn("No se pudo encontrar el ID del residente en los datos de la alerta.");
        setResidenteLocation(null);
      }
    } else {
      if (modalScalePulse) modalScalePulse.stop();
      if (modalBorderPulse) modalBorderPulse.stop();
      setResidenteLocation(null);
    }

    return () => {
      if (modalScalePulse) modalScalePulse.stop();
      if (modalBorderPulse) modalBorderPulse.stop();
    };
  }, [isVisible, alertData, modalScalePulseAnim, modalBorderPulseAnim]);

  if (!alertData) {
    return null;
  }

  const residenteNombre = alertData?.residente?.Nombre || "Residente";
  const residenteApellido = alertData?.residente?.Apellido || "Desconocido";

  const photoUrl = alertData?.residente?.Foto
    ? `${residentPhotoBaseUrl}/${alertData.residente.Foto}`
    : null;

  const title = `${residenteNombre} ${residenteApellido}`;
  const subtitle = alertData?.alerta_tipo?.nombre || "Alerta";
  const message = alertData?.mensaje || "Se ha recibido una nueva alerta.";
  
  // Se usa la función toTitleCase para formatear el texto de la ubicación
  const locationText = residenteLocation?.area 
    ? `Última ubicación: ${toTitleCase(residenteLocation.area)}` 
    : 'Ubicación no disponible';

  // Interpolación para el grosor del borde del modal
  const animatedModalBorderWidth = modalBorderPulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 8],
  });

  // Interpolación para el color del borde del modal (de un rojo más claro a uno más oscuro)
  const animatedModalBorderColor = modalBorderPulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255, 0, 0, 0.5)', 'rgba(255, 0, 0, 1)'],
  });

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onConfirm}
    >
      <View style={styles.centeredView}>
        <Animated.View
          style={[
            styles.modalView,
            {
              transform: [{ scale: modalScalePulseAnim }],
              borderWidth: animatedModalBorderWidth,
              borderColor: animatedModalBorderColor,
            },
          ]}
        >
          <Text style={styles.alertIndicator}>¡ALERTA!</Text>
          {photoUrl && (
            <Image
              source={{ uri: photoUrl }}
              style={styles.residentImage}
            />
          )}
          <Text style={styles.alertTitle}>{title}</Text>
          <Text style={styles.alertSubtitle}>{subtitle}</Text>
          <Text style={styles.alertMessage}>{message}</Text>
          <Text style={styles.alertLocation}>{locationText}</Text>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={onConfirm}
          >
            <Text style={styles.confirmButtonText}>CONFIRMAR</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: 400,
    height: 480,
    justifyContent: 'center',
  },
  alertIndicator: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'red',
    marginBottom: 15,
    textTransform: 'uppercase',
  },
  residentImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
    borderColor: '#ff0000',
    borderWidth: 2,
  },
  alertTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ff0000',
    marginBottom: 5,
    textAlign: 'center',
  },
  alertSubtitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ff0000',
    marginBottom: 10,
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: 18,
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  alertLocation: {
    fontSize: 20, // Se aumentó el tamaño de la fuente
    fontWeight: '900', // Se hizo más negrita
    color: '#333', // Se oscureció el color para que destaque más
    marginTop: 10, // Se añadió más espacio arriba
    marginBottom: 20,
    textAlign: 'center',
  },
  confirmButton: {
    backgroundColor: '#ff0000',
    borderRadius: 50,
    paddingVertical: 12,
    paddingHorizontal: 30,
    elevation: 2,
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default AlertModal;