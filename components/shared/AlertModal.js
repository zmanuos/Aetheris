// AlertModal.js

import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Platform, Image, Animated, Easing } from 'react-native';

const AlertModal = ({ isVisible, alertData, onConfirm }) => {
  // Animación para el pulso de escala del modal
  const modalScalePulseAnim = useRef(new Animated.Value(1)).current;

  // Animación para el pulso del borde del modal (grosor y color)
  const modalBorderPulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      // Iniciar la animación de escala del modal
      const modalScalePulse = Animated.loop(
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

      // Iniciar la animación del borde del modal (grosor y color)
      const modalBorderPulse = Animated.loop(
        Animated.sequence([
          Animated.timing(modalBorderPulseAnim, {
            toValue: 1, // Va de 0 a 1
            duration: 700, // Duración del pulso del borde
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false, // Necesario para animar colores y borderWidth
          }),
          Animated.timing(modalBorderPulseAnim, {
            toValue: 0, // Vuelve a 0
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false, // Necesario para animar colores y borderWidth
          }),
        ])
      );
      modalBorderPulse.start();

      // Detener ambas animaciones al desmontar o cuando deja de ser visible
      return () => {
        modalScalePulse.stop();
        modalBorderPulse.stop();
      };
    }
  }, [isVisible, modalScalePulseAnim, modalBorderPulseAnim]);

  if (!alertData) {
    return null;
  }

  const residenteNombre = alertData?.residente?.Nombre || "Residente";
  const residenteApellido = alertData?.residente?.Apellido || "Desconocido";

  const residentPhotoBaseUrl = 'http://localhost:5214/images/residents'; 

  const photoUrl = alertData?.residente?.Foto
    ? `${residentPhotoBaseUrl}/${alertData.residente.Foto}`
    : null;

  const title = `${residenteNombre} ${residenteApellido}`;
  const subtitle = alertData?.alerta_tipo?.nombre || "Alerta";
  const message = alertData?.mensaje || "Se ha recibido una nueva alerta.";

  // Interpolación para el grosor del borde del modal
  const animatedModalBorderWidth = modalBorderPulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 8], // El grosor del borde va de 2px a 8px
  });

  // Interpolación para el color del borde del modal (de un rojo más claro a uno más oscuro)
  const animatedModalBorderColor = modalBorderPulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255, 0, 0, 0.5)', 'rgba(255, 0, 0, 1)'], // De rojo semi-transparente a rojo sólido
  });

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onConfirm}
    >
      <View style={styles.centeredView}>
        {/* El modal interno con su animación de escala y la nueva animación de borde */}
        <Animated.View
          style={[
            styles.modalView,
            {
              transform: [{ scale: modalScalePulseAnim }],
              // Aplicar las animaciones del borde del modal
              borderWidth: animatedModalBorderWidth,
              borderColor: animatedModalBorderColor,
            },
          ]}
        >
          {/* Texto de alerta añadido */}
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
  // screenBorder styles have been removed as requested
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
    height: 450,
    justifyContent: 'center',
    // Los estilos de borde ahora serán animados, por lo que los valores fijos se eliminan de aquí
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
    marginBottom: 25,
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
