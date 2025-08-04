// AETHERIS/screens/auth/LoginScreen.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import LoginForm from '../../components/shared/LoginForm';

export default function LoginScreen({ navigation, onLoginSuccess }) {
  return (
    <View style={styles.container}>
      <LoginForm navigation={navigation} onLoginSuccess={onLoginSuccess} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
});
