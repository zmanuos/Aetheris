import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import Config from '../../config/config';
import {
  formatName,
  isValidName,
  isAdult,
  formatPhoneNumber,
  isValidPhoneNumber,
  isValidDateFormat,
  isValidEmail,
} from '../../components/shared/Validations';
import { useNotification } from '../../src/context/NotificationContext';

const PRIMARY_GREEN = '#6BB240';
const LIGHT_GREEN = '#9CD275';
const ACCENT_GREEN_BACKGROUND = '#EEF7E8';
const DARK_GRAY = '#333';
const MEDIUM_GRAY = '#555';
const LIGHT_GRAY = '#888';
const VERY_LIGHT_GRAY = '#eee';
const BACKGROUND_LIGHT = '#fcfcfc';
const WHITE = '#fff';
const ERROR_RED = '#DC3545';
const BUTTON_HOVER_COLOR = '#5aa130';
const { width } = Dimensions.get('window');
const IS_LARGE_SCREEN = width > 900;

export default function EmployeeEditScreen({ route, onEmployeeEdited, onCancel }) {
  const { employeeData } = route.params;

  const [employeeName, setEmployeeName] = useState(employeeData.nombre);
  const [employeeLastName, setEmployeeLastName] = useState(employeeData.apellido);
  const [employeePhone, setEmployeePhone] = useState(employeeData.telefono);
  const [employeeGender, setEmployeeGender] = useState(employeeData.genero);
  const [employeeBirthDate, setEmployeeBirthDate] = useState(new Date(employeeData.fecha_nacimiento).toISOString().split('T')[0]);
  const [employeeActive, setEmployeeActive] = useState(employeeData.activo);

  const [employeeEmail, setEmployeeEmail] = useState('');
  // Estos estados se mantienen vacíos intencionadamente
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const [emailError, setEmailError] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmNewPasswordError, setConfirmNewPasswordError] = useState('');

  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { showNotification } = useNotification();
  const [nameError, setNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [birthDateError, setBirthDateError] = useState('');

  const API_URL = Config.API_BASE_URL;

  useEffect(() => {
    const fetchEmployeeEmail = async () => {
      if (employeeData.firebaseUid) {
        try {
          const response = await fetch(`${API_URL}/Personal/manage/get-correo/${employeeData.firebaseUid}`);
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al obtener el correo electrónico.');
          }
          const data = await response.json();
          setEmployeeEmail(data.email);
        } catch (error) {
          console.error("Error al obtener el correo electrónico:", error.message);
          showNotification(`Error al cargar el correo: ${error.message}`, 'error');
        }
      }
    };
    fetchEmployeeEmail();
  }, [employeeData.firebaseUid, API_URL, showNotification]);

  const handleNameChange = (text) => {
    const formatted = formatName(text);
    setEmployeeName(formatted);
    if (nameError && isValidName(formatted)) {
      setNameError('');
    }
  };

  const handleNameBlur = () => {
    if (!employeeName.trim()) {
      setNameError('El nombre es obligatorio.');
    } else if (!isValidName(employeeName)) {
      setNameError('El nombre solo puede contener letras y espacios.');
    } else {
      setNameError('');
    }
  };

  const handleLastNameChange = (text) => {
    const formatted = formatName(text);
    setEmployeeLastName(formatted);
    if (lastNameError && isValidName(formatted)) {
      setLastNameError('');
    }
  };

  const handleLastNameBlur = () => {
    if (!employeeLastName.trim()) {
      setLastNameError('El apellido es obligatorio.');
    } else if (!isValidName(employeeLastName)) {
      setLastNameError('El apellido solo puede contener letras y espacios.');
    } else {
      setLastNameError('');
    }
  };

  const handlePhoneChange = (text) => {
    const formatted = formatPhoneNumber(text);
    setEmployeePhone(formatted);
    if (phoneError && isValidPhoneNumber(formatted)) {
      setPhoneError('');
    }
  };

  const handlePhoneBlur = () => {
    if (!employeePhone) {
      setPhoneError('El teléfono es obligatorio.');
    } else if (!isValidPhoneNumber(employeePhone)) {
      setPhoneError('El teléfono debe tener exactamente 10 dígitos numéricos.');
    } else {
      setPhoneError('');
    }
  };

  const handleEmailChange = (text) => {
    setEmployeeEmail(text);
    if (emailError && isValidEmail(text)) {
      setEmailError('');
    }
  };

  const handleEmailBlur = () => {
    if (!employeeEmail.trim()) {
      setEmailError('El correo electrónico es obligatorio.');
    } else if (!isValidEmail(employeeEmail)) {
      setEmailError('El correo electrónico no es válido.');
    } else {
      setEmailError('');
    }
  };

  const handleNewPasswordChange = (text) => {
    setNewPassword(text);
    if (newPasswordError && text.length >= 6) {
      setNewPasswordError('');
    }
    if (confirmNewPassword && text === confirmNewPassword) {
      setConfirmNewPasswordError('');
    }
  };

  const handleNewPasswordBlur = () => {
    if (newPassword.trim() && newPassword.length < 6) {
      setNewPasswordError('La contraseña debe tener al menos 6 caracteres.');
    } else {
      setNewPasswordError('');
    }
  };

  const handleConfirmNewPasswordChange = (text) => {
    setConfirmNewPassword(text);
    if (confirmNewPasswordError && newPassword === text) {
      setConfirmNewPasswordError('');
    }
  };

  const handleConfirmNewPasswordBlur = () => {
    if (newPassword.trim() && confirmNewPassword.trim() && newPassword !== confirmNewPassword) {
      setConfirmNewPasswordError('Las contraseñas no coinciden.');
    } else {
      setConfirmNewPasswordError('');
    }
  };

  const toggleShowNewPassword = () => {
    setShowNewPassword(!showNewPassword);
  };

  const toggleShowConfirmNewPassword = () => {
    setShowConfirmNewPassword(!showConfirmNewPassword);
  };

  const handleSaveEmployee = async () => {
    setFormError('');

    handleNameBlur();
    handleLastNameBlur();
    handlePhoneBlur();
    handleEmailBlur();
    if (newPassword.trim()) {
        handleNewPasswordBlur();
        handleConfirmNewPasswordBlur();
    }

    const editableFieldErrors = [
      nameError,
      lastNameError,
      phoneError,
      emailError,
      newPassword.trim() ? newPasswordError : '',
      confirmNewPassword.trim() ? confirmNewPasswordError : ''
    ].filter(Boolean);

    if (
      !employeeName.trim() ||
      !employeeLastName.trim() ||
      !employeePhone ||
      !employeeEmail.trim() ||
      !employeeGender ||
      !employeeBirthDate
    ) {
      setFormError('Por favor, completa todos los campos obligatorios.');
      return;
    }

    if (editableFieldErrors.length > 0) {
      setFormError('Por favor, corrige los errores en los campos editables.');
      return;
    }

    if (
      !isValidName(employeeName) ||
      !isValidName(employeeLastName) ||
      !isValidPhoneNumber(employeePhone) ||
      !isValidEmail(employeeEmail) ||
      (newPassword.trim() && newPassword.length < 6) ||
      (newPassword.trim() && newPassword !== confirmNewPassword)
    ) {
      setFormError('Por favor, corrige los errores en el formulario antes de guardar.');
      return;
    }

    setIsSaving(true);

    try {
      const updatedEmployeeData = {
        nombre: employeeName,
        apellido: employeeLastName,
        fecha_nacimiento: new Date(employeeData.fecha_nacimiento).toISOString(),
        genero: employeeData.genero,
        telefono: employeePhone,
        activo: employeeActive,
      };

      const personalResponse = await fetch(`${API_URL}/Personal/${employeeData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedEmployeeData),
      });

      if (!personalResponse.ok) {
        const errorData = await personalResponse.json();
        let errorMessage = errorData.message || errorData.title || 'Error desconocido al actualizar datos personales.';
        if (errorData.errors && Object.keys(errorData.errors).length > 0) {
          errorMessage += "\n" + Object.values(errorData.errors).flat().join("\n");
        }
        throw new Error(`Error al actualizar datos personales: ${errorMessage}`);
      }
      console.log("Datos personales de empleado actualizados en SQL a través del backend.");

      if (employeeEmail.trim() !== employeeData.email && employeeData.firebaseUid) {
        try {
          const emailUpdateResponse = await fetch(`${API_URL}/Personal/manage/update-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              firebaseUid: employeeData.firebaseUid,
              newEmail: employeeEmail,
            }),
          });

          if (!emailUpdateResponse.ok) {
            const errorData = await emailUpdateResponse.json();
            throw new Error(errorData.message || 'Error desconocido al actualizar el correo en Firebase.');
          }
          console.log("Correo electrónico actualizado en Firebase.");
        } catch (error) {
          showNotification(`Error al actualizar el correo en Firebase: ${error.message}`, 'warning');
          console.error("Error al actualizar correo en Firebase:", error.message);
        }
      }

      if (newPassword.trim() && employeeData.firebaseUid) {
        try {
          const passwordUpdateResponse = await fetch(`${API_URL}/Personal/manage/update-password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              firebaseUid: employeeData.firebaseUid,
              newPassword: newPassword,
            }),
          });

          if (!passwordUpdateResponse.ok) {
            const errorData = await passwordUpdateResponse.json();
            throw new Error(errorData.message || 'Error desconocido al actualizar la contraseña en Firebase.');
          }
          console.log("Contraseña actualizada en Firebase.");
        } catch (error) {
          showNotification(`Error al actualizar la contraseña en Firebase: ${error.message}`, 'warning');
          console.error("Error al actualizar contraseña en Firebase:", error.message);
        }
      }

      showNotification('Empleado actualizado exitosamente!', 'success');
      onEmployeeEdited();

    } catch (error) {
      console.error("Error al actualizar empleado:", error.message);
      let errorMessage = "Ocurrió un error inesperado al actualizar el empleado.";
      errorMessage = error.message;
      showNotification(errorMessage, 'error');
      setFormError(errorMessage);
    } finally {
      setIsSaving(false);
      // Siempre resetear las contraseñas después de un intento de guardado
      setNewPassword('');
      setConfirmNewPassword('');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.formContainer}>
      <Text style={styles.formTitle}>Editar Empleado</Text>
      {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

      {/* Campos de Nombre y Apellido */}
      <View style={IS_LARGE_SCREEN ? styles.rowContainer : null}>
        <View style={[IS_LARGE_SCREEN ? styles.rowField : null, styles.fieldWrapper]}>
          <Text style={styles.inputLabel}>Nombre</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={18} color={MEDIUM_GRAY} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Ej: Juan"
              placeholderTextColor={LIGHT_GRAY}
              value={employeeName}
              onChangeText={handleNameChange}
              onBlur={handleNameBlur}
            />
          </View>
          {nameError ? <Text style={styles.fieldErrorText}>{nameError}</Text> : null}
        </View>

        <View style={[IS_LARGE_SCREEN ? styles.rowField : null, styles.fieldWrapper]}>
          <Text style={styles.inputLabel}>Apellido</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={18} color={MEDIUM_GRAY} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Ej: Pérez"
              placeholderTextColor={LIGHT_GRAY}
              value={employeeLastName}
              onChangeText={handleLastNameChange}
              onBlur={handleLastNameBlur}
            />
          </View>
          {lastNameError ? <Text style={styles.fieldErrorText}>{lastNameError}</Text> : null}
        </View>
      </View>

      {/* Campo de Teléfono */}
      <View style={styles.fieldWrapper}>
        <Text style={styles.inputLabel}>Teléfono</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="call-outline" size={18} color={MEDIUM_GRAY} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Ej: 5512345678"
            placeholderTextColor={LIGHT_GRAY}
            value={employeePhone}
            onChangeText={handlePhoneChange}
            onBlur={handlePhoneBlur}
            keyboardType="phone-pad"
            maxLength={10}
          />
          <Text style={styles.charCounter}>{employeePhone.length}/10</Text>
        </View>
        {phoneError ? <Text style={styles.fieldErrorText}>{phoneError}</Text> : null}
      </View>

      {/* Campos no editables: Género y Fecha de Nacimiento */}
      <View style={styles.fieldWrapper}>
        <Text style={styles.inputLabel}>Género</Text>
        <View style={[styles.pickerInputContainer, styles.disabledField]}>
          <Ionicons name="person-circle-outline" size={18} color={LIGHT_GRAY} style={styles.inputIcon} />
          <Picker
            selectedValue={employeeGender}
            onValueChange={(itemValue) => { /* Disabled, no change handler */ }}
            style={[styles.picker, { color: LIGHT_GRAY }]}
            itemStyle={[styles.pickerItem, { color: LIGHT_GRAY }]}
            enabled={false}
          >
            <Picker.Item label="Masculino" value="Masculino" />
            <Picker.Item label="Femenino" value="Femenino" />
          </Picker>
        </View>
      </View>

      <View style={styles.fieldWrapper}>
        <Text style={styles.inputLabel}>Fecha de Nacimiento</Text>
        <View style={[styles.inputContainer, styles.disabledField]}>
          <Ionicons name="calendar-outline" size={18} color={LIGHT_GRAY} style={styles.inputIcon} />
          {Platform.OS === 'web' ? (
            <input
              type="date"
              value={employeeBirthDate}
              style={{
                ...StyleSheet.flatten(styles.datePickerWeb),
                color: LIGHT_GRAY,
                border: 'none',
                borderWidth: 0,
                borderColor: 'transparent',
                boxShadow: 'none',
              }}
              disabled={true}
            />
          ) : (
            <TextInput
              style={[styles.input, { color: LIGHT_GRAY }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={LIGHT_GRAY}
              value={employeeBirthDate}
              editable={false}
            />
          )}
        </View>
        {birthDateError ? <Text style={styles.fieldErrorText}>{birthDateError}</Text> : null}
      </View>

      {/* Campo de Estado Activo/Inactivo */}
      <View style={styles.fieldWrapper}>
        <Text style={styles.inputLabel}>Estado (Activo/Inactivo)</Text>
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Inactivo</Text>
          <Switch
            trackColor={{ false: LIGHT_GRAY, true: LIGHT_GREEN }}
            thumbColor={employeeActive ? PRIMARY_GREEN : MEDIUM_GRAY}
            ios_backgroundColor={LIGHT_GRAY}
            onValueChange={setEmployeeActive}
            value={employeeActive}
          />
          <Text style={styles.switchLabel}>Activo</Text>
        </View>
      </View>

      {/* --- CAMPOS DE CREDENCIALES (MOVIDOS AL FINAL) --- */}

      {/* Campo de Correo Electrónico */}
      <View style={styles.fieldWrapper}>
        <Text style={styles.inputLabel}>Correo Electrónico</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={18} color={MEDIUM_GRAY} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, Platform.OS === 'web' && styles.noWebYellowBackground]}
            placeholder="Ej: correo@ejemplo.com"
            placeholderTextColor={LIGHT_GRAY}
            value={employeeEmail}
            onChangeText={handleEmailChange}
            onBlur={handleEmailBlur}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="off"
            textContentType="none" // Para iOS, evita autocompletar correos viejos
            importantForAutofill="no"
          />
        </View>
        {emailError ? <Text style={styles.fieldErrorText}>{emailError}</Text> : null}
      </View>

      {/* Campo de Nueva Contraseña */}
      <View style={styles.fieldWrapper}>
        <Text style={styles.inputLabel}>Nueva Contraseña</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={18} color={MEDIUM_GRAY} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, Platform.OS === 'web' && styles.noWebYellowBackground]}
            placeholder="Nueva contraseña"
            placeholderTextColor={LIGHT_GRAY}
            value={newPassword} // Mantenemos el estado para la lógica interna
            onChangeText={handleNewPasswordChange}
            onBlur={handleNewPasswordBlur}
            secureTextEntry={!showNewPassword}
            autoComplete="off" // Deshabilita el autocompletado en navegadores
            textContentType="newPassword" // Importante para iOS, indica que es una nueva contraseña
            importantForAutofill="no" // Para Android
          />
          <TouchableOpacity onPress={toggleShowNewPassword} style={styles.eyeIconContainer}>
            <Ionicons
              name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={MEDIUM_GRAY}
            />
          </TouchableOpacity>
        </View>
        {newPasswordError ? <Text style={styles.fieldErrorText}>{newPasswordError}</Text> : null}
      </View>

      {/* Campo de Confirmar Nueva Contraseña */}
      <View style={styles.fieldWrapper}>
        <Text style={styles.inputLabel}>Confirmar Nueva Contraseña</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={18} color={MEDIUM_GRAY} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, Platform.OS === 'web' && styles.noWebYellowBackground]}
            placeholder="Repite la nueva contraseña"
            placeholderTextColor={LIGHT_GRAY}
            value={confirmNewPassword} // Mantenemos el estado para la lógica interna
            onChangeText={handleConfirmNewPasswordChange}
            onBlur={handleConfirmNewPasswordBlur}
            secureTextEntry={!showConfirmNewPassword}
            autoComplete="off" // Deshabilita el autocompletado en navegadores
            textContentType="newPassword" // Importante para iOS, indica que es una nueva contraseña
            importantForAutofill="no" // Para Android
          />
          <TouchableOpacity onPress={toggleShowConfirmNewPassword} style={styles.eyeIconContainer}>
            <Ionicons
              name={showConfirmNewPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={MEDIUM_GRAY}
            />
          </TouchableOpacity>
        </View>
        {confirmNewPasswordError ? <Text style={styles.fieldErrorText}>{confirmNewPasswordError}</Text> : null}
      </View>

      {/* Botón de Guardar */}
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleSaveEmployee}
        disabled={isSaving}
      >
        <Text style={styles.primaryButtonText}>{isSaving ? <ActivityIndicator color={WHITE} /> : 'GUARDAR CAMBIOS'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const containerBaseStyles = {
  backgroundColor: WHITE,
  borderRadius: 15,
  padding: 18,
  shadowColor: DARK_GRAY,
  shadowOffset: { width: 0, height: 5 },
  shadowOpacity: 0.1,
  shadowRadius: 10,
  elevation: 8,
  borderWidth: 1.5,
  borderColor: VERY_LIGHT_GRAY,
};

const styles = StyleSheet.create({
  formContainer: {
    ...containerBaseStyles,
    alignSelf: 'center',
    marginTop: IS_LARGE_SCREEN ? Dimensions.get('window').height * 0.05 : 15,
    marginBottom: 20,
    paddingVertical: 25,
    paddingHorizontal: IS_LARGE_SCREEN ? 25 : 12,
    width: IS_LARGE_SCREEN ? '45%' : '90%',
    maxWidth: IS_LARGE_SCREEN ? 550 : '95%',
  },
  formTitle: {
    fontSize: IS_LARGE_SCREEN ? 26 : 22,
    fontWeight: '700',
    color: DARK_GRAY,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    color: DARK_GRAY,
    marginBottom: 4,
    fontWeight: '600',
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  rowField: {
    flex: 1,
    marginRight: IS_LARGE_SCREEN ? 10 : 0,
  },
  fieldWrapper: {
    marginBottom: 12,
    position: 'relative',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: VERY_LIGHT_GRAY,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: BACKGROUND_LIGHT,
    height: 45,
  },
  input: {
    flex: 1,
    height: '100%',
    color: MEDIUM_GRAY,
    fontSize: 15,
    paddingLeft: 8,
    ...Platform.select({
      web: {
        outline: 'none',
        WebkitAppearance: 'none',
        MozAppearance: 'none',
        appearance: 'none',
      },
    }),
  },
  noWebYellowBackground: {
    ...Platform.select({
      web: {
        // Truco para evitar el fondo amarillo de autocompletado en Chrome/Safari
        boxShadow: '0 0 0px 1000px #fcfcfc inset',
        WebkitBoxShadow: '0 0 0px 1000px #fcfcfc inset',
        caretColor: MEDIUM_GRAY,
      },
    }),
  },
  inputIcon: {
    marginRight: 0,
    fontSize: 18,
  },
  picker: {
    flex: 1,
    height: '100%',
    color: MEDIUM_GRAY,
    borderWidth: 0,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    borderRadius: 0,
    ...Platform.select({
      web: {
        outline: 'none',
      },
    }),
  },
  pickerItem: {
    fontSize: 15,
  },
  pickerInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: BACKGROUND_LIGHT,
    height: 45,
  },
  datePickerWeb: {
    flex: 1,
    height: '100%',
    color: MEDIUM_GRAY,
    fontSize: 15,
    paddingLeft: 8,
    borderWidth: 0,
    backgroundColor: 'transparent',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    appearance: 'none',
    outline: 'none',
    cursor: 'pointer',
    paddingRight: Platform.OS === 'web' ? 10 : 0,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderColor: VERY_LIGHT_GRAY,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: BACKGROUND_LIGHT,
    height: 45,
  },
  switchLabel: {
    fontSize: 15,
    color: MEDIUM_GRAY,
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: PRIMARY_GREEN,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 8,
    shadowColor: PRIMARY_GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transitionDuration: '0.3s',
        transitionProperty: 'background-color',
        ':hover': {
          backgroundColor: BUTTON_HOVER_COLOR,
        },
      },
    }),
  },
  primaryButtonText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: ERROR_RED,
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '500',
  },
  fieldErrorText: {
    color: ERROR_RED,
    fontSize: 12,
    position: 'absolute',
    bottom: -15,
    left: 5,
  },
  charCounter: {
    fontSize: 12,
    color: LIGHT_GRAY,
    marginLeft: 8,
  },
  disabledField: {
    backgroundColor: VERY_LIGHT_GRAY,
    opacity: 0.7,
    borderColor: LIGHT_GRAY,
  },
  eyeIconContainer: {
    paddingLeft: 10,
    paddingRight: 5,
  },
});                 