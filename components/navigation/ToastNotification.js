import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ToastNotification = ({ message, type, onHide }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current; // Initial value for opacity: 0
  const slideAnim = useRef(new Animated.Value(100)).current; // Initial value for slide: 100 (off-screen)

  useEffect(() => {
    // Animation for appearing
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0, // Slide to 0 (on-screen)
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Animation for disappearing after 3 seconds
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 100, // Slide back off-screen
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => onHide());
      }, 3000);
    });
  }, [fadeAnim, slideAnim, onHide]);

  const backgroundColor = type === 'nota' ? '#4CAF50' : '#F44336'; // Green for 'nota', Red for 'alerta'
  const iconName = type === 'nota' ? 'checkmark-circle' : 'alert-circle';

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          backgroundColor,
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }], // Use translateX for horizontal slide
        },
      ]}
    >
      <Ionicons name={iconName} size={20} color="#fff" style={styles.toastIcon} />
      <Text style={styles.toastMessage}>{message}</Text>
      <Pressable onPress={onHide} style={styles.closeButton}>
        <Ionicons name="close" size={20} color="#fff" />
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginHorizontal: 20, // Add horizontal margin for spacing from edges
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  toastIcon: {
    marginRight: 10,
  },
  toastMessage: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    flexShrink: 1,
  },
  closeButton: {
    marginLeft: 'auto',
    paddingLeft: 10,
  },
});

export default ToastNotification;