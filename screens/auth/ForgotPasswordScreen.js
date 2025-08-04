// AETHERIS/screens/auth/ForgotPasswordScreen.js
import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../config/firebaseConfig';
import { LinearGradient } from 'expo-linear-gradient';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null); // {type: 'error'|'success', message: string}

  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const containerWidth = isWeb ? Math.min(500, width * 0.9) : 350;

  const handleReset = async () => {
    if (!email.trim()) {
      setFeedback({ type: 'error', message: 'Ingresa un correo válido.' });
      return;
    }
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const actionCodeSettings = {
        // En desarrollo apunta a la ruta local; en producción cámbialo por tu dominio real
        url: 'http://localhost:8081/resetPassword',
        handleCodeInApp: false,
      };

      await sendPasswordResetEmail(auth, email.trim(), actionCodeSettings);

      setFeedback({
        type: 'success',
        message:
          'Revisa tu correo. Te enviamos el enlace para restablecer la contraseña.',
      });
    } catch (err) {
      console.error('ForgotPassword error:', err);
      let message = 'Ocurrió un error. Intenta de nuevo.';
      if (err.code === 'auth/user-not-found') {
        message = 'No existe una cuenta con ese correo.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Formato de correo inválido.';
      } else if (err.code === 'auth/too-many-requests') {
        message = 'Demasiados intentos. Intenta más tarde.';
      }
      setFeedback({ type: 'error', message });
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
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={styles.back}
                  accessibilityLabel="Regresar"
                >
                  <Ionicons name="arrow-back" size={24} color="#374151" />
                </TouchableOpacity>
                <Text style={styles.title}>Recuperar contraseña</Text>
              </View>

              <Text style={styles.subtitle}>
                Escribe tu correo registrado y te enviaremos un enlace para
                restablecer tu contraseña.
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Correo electrónico</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="tucorreo@ejemplo.com"
                  style={styles.input}
                  editable={!isSubmitting}
                  importantForAutofill="yes"
                  textContentType="emailAddress"
                  returnKeyType="done"
                  onSubmitEditing={handleReset}
                />
              </View>

              {feedback && (
                <Text
                  style={[
                    styles.feedbackText,
                    feedback.type === 'error'
                      ? styles.errorText
                      : styles.successText,
                  ]}
                >
                  {feedback.message}
                </Text>
              )}

              <TouchableOpacity
                style={[
                  styles.loginButton,
                  isSubmitting && styles.loginButtonDisabled,
                ]}
                onPress={handleReset}
                disabled={isSubmitting}
                accessibilityLabel="Enviar enlace de recuperación"
              >
                <Text style={styles.loginButtonText}>
                  {isSubmitting
                    ? 'Enviando...'
                    : 'Enviar enlace de recuperación'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backToLogin}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.backToLoginText}>Volver al login</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    alignItems: 'center',
  },
  formContainer: {
    // ancho dinámico inyectado desde prop
  },
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
    maxWidth: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 4,
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
  back: {
    padding: 4,
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginRight: 24,
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 16,
    color: '#4B5563',
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: 'white',
  },
  feedbackText: {
    marginBottom: 12,
    fontSize: 14,
    textAlign: 'center',
  },
  errorText: {
    color: '#DC3545',
  },
  successText: {
    color: '#16A34A',
  },
  loginButton: {
    backgroundColor: '#4F46E5',
    height: 48,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  backToLogin: {
    marginTop: 16,
    alignSelf: 'center',
  },
  backToLoginText: {
    fontSize: 14,
    color: '#6B7280',
  },
});
