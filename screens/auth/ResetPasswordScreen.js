// AETHERIS/screens/auth/ResetPasswordScreen.js
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  useWindowDimensions,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  verifyPasswordResetCode,
  confirmPasswordReset,
} from 'firebase/auth';
import { auth } from '../../config/firebaseConfig';
import { LinearGradient } from 'expo-linear-gradient';

export default function ResetPasswordScreen({ navigation, route }) {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const containerWidth = isWeb ? Math.min(500, width * 0.9) : 350;

  const [oobCode, setOobCode] = useState(null);
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    const params = route?.params || {};
    const codeFromParam =
      params.oobCode ||
      (typeof window !== 'undefined'
        ? new URL(window.location.href).searchParams.get('oobCode')
        : null);
    if (!codeFromParam) {
      setFeedback({ type: 'error', message: 'Código de verificación faltante.' });
      setIsVerifying(false);
      return;
    }
    setOobCode(codeFromParam);

    verifyPasswordResetCode(auth, codeFromParam)
      .then((emailFromCode) => {
        setEmail(emailFromCode);
      })
      .catch((err) => {
        console.error('Error verificando oobCode:', err);
        setFeedback({ type: 'error', message: 'El enlace ya no es válido o expiró.' });
      })
      .finally(() => setIsVerifying(false));
  }, [route]);

  const handleSubmit = async () => {
    if (!newPassword || newPassword.length < 6) {
      setFeedback({ type: 'error', message: 'La contraseña debe tener al menos 6 caracteres.' });
      return;
    }
    if (!oobCode) return;
    setIsSubmitting(true);
    setFeedback(null);
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      Alert.alert(
        'Éxito',
        'Contraseña restablecida. Ahora puedes iniciar sesión con la nueva contraseña.'
      );
      navigation.navigate('Login');
    } catch (err) {
      console.error('Error confirmando nueva contraseña:', err);
      let msg = 'Ocurrió un error al restablecer la contraseña.';
      if (err.code === 'auth/weak-password') {
        msg = 'Contraseña muy débil.';
      } else if (err.code === 'auth/expired-action-code') {
        msg = 'El enlace expiró. Solicita uno nuevo.';
      }
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={[styles.formContainer, { width: containerWidth }]}>
          <LinearGradient
            colors={['#3B82F6', '#10B981', '#2563EB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientBorder}
          >
            <View style={styles.innerContainer}>
              <View style={styles.logoContainer}>
                <Image
                  source={require('../../assets/images/ahorasi.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>

              <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
                  <Ionicons name="arrow-back" size={24} color="#374151" />
                </TouchableOpacity>
                <Text style={styles.title}>Restablecer contraseña</Text>
              </View>

              {isVerifying ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="large" color="#4F46E5" />
                  <Text style={styles.loadingText}>Verificando enlace...</Text>
                </View>
              ) : (
                <>
                  {email ? (
                    <Text style={styles.subtitle}>
                      Cambia la contraseña para: {email}
                    </Text>
                  ) : null}

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Nueva contraseña</Text>
                    <View style={styles.passwordContainer}>
                      <TextInput
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry={!showPassword}
                        placeholder="••••••••"
                        style={styles.input}
                        editable={!isSubmitting}
                      />
                      <TouchableOpacity
                        style={styles.eyeButton}
                        onPress={() => setShowPassword((v) => !v)}
                      >
                        <Ionicons
                          name={showPassword ? 'eye-off' : 'eye'}
                          size={20}
                          color="#9CA3AF"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {feedback && (
                    <Text
                      style={[
                        styles.feedbackText,
                        feedback.type === 'error' ? styles.errorText : styles.successText,
                      ]}
                    >
                      {feedback.message}
                    </Text>
                  )}

                  <TouchableOpacity
                    style={[styles.loginButton, isSubmitting && styles.loginButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.loginButtonText}>
                      {isSubmitting ? 'Aplicando...' : 'Restablecer contraseña'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.backToLogin}
                    onPress={() => navigation.navigate('Login')}
                  >
                    <Text style={styles.backToLoginText}>Volver al login</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </LinearGradient>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F3F4F6' },
  keyboardView: { flex: 1, justifyContent: 'center', padding: 16, alignItems: 'center' },
  formContainer: {},
  gradientBorder: {
    borderRadius: 8,
    padding: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  innerContainer: {
    backgroundColor: 'white',
    borderRadius: 6,
    padding: 32,
    width: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  logo: {
    width: 220,
    height: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  back: { padding: 4 },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginRight: 24,
    color: '#1F2937',
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#374151',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 16,
    color: '#4B5563',
    lineHeight: 20,
    textAlign: 'center',
  },
  inputGroup: { marginBottom: 16 },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  passwordContainer: {
    position: 'relative',
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 14,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingRight: 48,
    fontSize: 16,
    backgroundColor: 'white',
  },
  feedbackText: { marginBottom: 12, fontSize: 14, textAlign: 'center' },
  errorText: { color: '#DC3545' },
  successText: { color: '#16A34A' },
  loginButton: {
    backgroundColor: '#4F46E5',
    height: 48,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: { opacity: 0.6 },
  loginButtonText: { color: 'white', fontSize: 16, fontWeight: '500' },
  backToLogin: { marginTop: 16, alignSelf: 'center' },
  backToLoginText: { fontSize: 14, color: '#6B7280' },
});
