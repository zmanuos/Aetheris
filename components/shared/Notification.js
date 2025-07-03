// Notification.js
import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// --- COLORES (asegúrate de que estos coincidan con tus constantes de color globales) ---
const SUCCESS_GREEN = '#6BB240'; // Tu PRIMARY_GREEN
const ERROR_RED = '#DC3545';
const INFO_BLUE = '#007BFF';
const WARNING_ORANGE = '#FFC107';
const WHITE = '#FFFFFF';
const DARK_GRAY = '#333'; // Usado para sombras
const LIGHT_BORDER_GRAY = '#ddd'; // Un gris más claro para bordes sutiles

const Notification = forwardRef((props, ref) => {
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState('success'); // 'success', 'error', 'info', 'warning'
  // Volvemos a un solo Animated.Value para translateY
  const slideAnim = useState(new Animated.Value(Platform.OS === 'web' ? -50 : -100))[0];
  const fadeAnim = useState(new Animated.Value(0))[0]; // Para la animación de opacidad

  useImperativeHandle(ref, () => ({
    show: (msg, type = 'success', duration = 3000) => {
      setMessage(msg);
      setType(type);
      setIsVisible(true);

      // Valor final de la posición de la notificación al aparecer
      let slideToValue;
      if (Platform.OS === 'web') {
        slideToValue = 20; // En web, se desliza hasta 20px del top
      } else if (Platform.OS === 'ios') {
        slideToValue = 0; // Ajuste para iOS SafeArea
      } else {
        slideToValue = 20; // Android
      }

      // Iniciar animaciones
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: slideToValue,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (duration > 0) {
          setTimeout(() => {
            hide();
          }, duration);
        }
      });
    },
    hide: () => {
      hide();
    }
  }));

  const hide = () => {
    // Valor final de la posición para ocultar la notificación
    // En web, se desliza hacia arriba, no lateralmente.
    const slideToValue = Platform.OS === 'web' ? -50 : -100;

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: slideToValue, // Se desliza hacia arriba fuera de la vista
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsVisible(false);
      setMessage('');
      setType('success');
    });
  };

  if (!isVisible) {
    return null;
  }

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return SUCCESS_GREEN;
      case 'error':
        return ERROR_RED;
      case 'info':
        return INFO_BLUE;
      case 'warning':
        return WARNING_ORANGE;
      default:
        return SUCCESS_GREEN;
    }
  };

  const getIconName = () => {
    switch (type) {
      case 'success':
        return 'checkmark-circle-outline';
      case 'error':
        return 'close-circle-outline';
      case 'info':
        return 'information-circle-outline';
      case 'warning':
        return 'warning-outline';
      default:
        return 'information-circle-outline';
    }
  };

  return (
    <Animated.View
      style={[
        styles.notificationContainer,
        { backgroundColor: getBackgroundColor() },
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }, // Solo translateY
        // Estilos específicos para web aquí
        Platform.OS === 'web' && styles.notificationContainerWeb,
      ]}
    >
      <View style={styles.contentWrapper}>
        <Ionicons name={getIconName()} size={20} color={WHITE} style={styles.icon} />
        <Text style={styles.messageText}>{message}</Text>
      </View>
      <TouchableOpacity onPress={hide} style={styles.closeButton}>
        <Ionicons name="close" size={16} color={WHITE} />
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  notificationContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20, // Ajuste para iOS SafeArea y Android
    width: width * 0.9, // 90% del ancho de la pantalla para móvil
    maxWidth: 400, // Limita el ancho máximo incluso en pantallas grandes de móvil
    alignSelf: 'center', // Centra horizontalmente para móvil
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 9999,
    shadowColor: DARK_GRAY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 5,
    borderWidth: 0.5,
    borderColor: LIGHT_BORDER_GRAY,
  },
  // Estilos específicos para Web (top-center)
  notificationContainerWeb: {
    top: 20, // Posición desde arriba
    width: 320, // Ancho fijo para web, se ve mejor que un porcentaje
    left: '50%', // Empieza en el 50%
    right: 'auto', // Asegura que `right` no interfiera
    transform: [{ translateX: -160 }], // Ajusta para centrar el ancho fijo (ancho / 2 = 320 / 2 = 160)
    marginHorizontal: 'auto', // Esto ayuda a centrar si el width no es fijo o para asegurar
    alignSelf: 'auto', // Sobrescribir alignSelf: 'center' que es más para móvil
  },
  contentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  icon: {
    marginRight: 8,
  },
  messageText: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
  },
  closeButton: {
    padding: 3,
  },
});

export default Notification;