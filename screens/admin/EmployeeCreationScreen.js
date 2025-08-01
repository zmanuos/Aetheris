// screens/admin/EmployeeCreationScreen.js
import React, { useState } from 'react';
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
    Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

import { auth, db } from '../../config/firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import Config from '../../config/config';

import {
    formatName,
    isValidName,
    isAdult,
    formatPhoneNumber,
    isValidPhoneNumber,
    isValidDateFormat,
    isValidEmail,
    doPasswordsMatch
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

const { width, height } = Dimensions.get('window');
const IS_LARGE_SCREEN = width > 900;

export default function EmployeeCreationForm({ onEmployeeCreated, onCancel }) {
    const [employeeName, setEmployeeName] = useState('');
    const [employeeLastName, setEmployeeLastName] = useState('');
    const [employeeEmail, setEmployeeEmail] = useState('');
    const [employeePassword, setEmployeePassword] = useState('');
    const [employeeConfirmPassword, setEmployeeConfirmPassword] = useState('');
    const [employeePhone, setEmployeePhone] = useState('');
    const [employeeGender, setEmployeeGender] = useState('Masculino');
    const [employeeBirthDate, setEmployeeBirthDate] = useState(''); // String YYYY-MM-DD
    const [selectedDateObject, setSelectedDateObject] = useState(new Date()); // Date object for picker
    const [formError, setFormError] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showGenderPicker, setShowGenderPicker] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const { showNotification } = useNotification();

    const [nameError, setNameError] = useState('');
    const [lastNameError, setLastNameError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordLengthWarning, setPasswordLengthWarning] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [birthDateError, setBirthDateError] = useState('');

    const API_URL = Config.API_BASE_URL;

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

    const handleEmailBlur = () => {
        if (!employeeEmail.trim()) {
            setEmailError('El correo electrónico es obligatorio.');
        } else if (!isValidEmail(employeeEmail)) {
            setEmailError('El formato del correo electrónico no es válido.');
        } else {
            setEmailError('');
        }
    };

    const handlePasswordBlur = () => {
        if (!employeePassword) {
            setPasswordLengthWarning('La contraseña es obligatoria.');
        } else if (employeePassword.length < 6) {
            setPasswordLengthWarning('La contraseña debe tener al menos 6 caracteres.');
        } else {
            setPasswordLengthWarning('');
        }
        if (employeeConfirmPassword) {
            handleConfirmPasswordBlur();
        }
    };

    const handleConfirmPasswordBlur = () => {
        if (!employeeConfirmPassword) {
            setConfirmPasswordError('Confirma tu contraseña.');
        } else if (!doPasswordsMatch(employeePassword, employeeConfirmPassword)) {
            setConfirmPasswordError('Las contraseñas no coinciden.');
        } else {
            setConfirmPasswordError('');
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

    const handleDateSelect = (event, date) => {
        if (Platform.OS === 'web') {
            const formattedDate = event.target.value;
            setEmployeeBirthDate(formattedDate);
            setSelectedDateObject(new Date(formattedDate));
        } else {
            const tempDate = date || selectedDateObject;
            setSelectedDateObject(tempDate);
            const year = tempDate.getFullYear();
            const month = String(tempDate.getMonth() + 1).padStart(2, '0');
            const day = String(tempDate.getDate()).padStart(2, '0');
            setEmployeeBirthDate(`${year}-${month}-${day}`);
        }
        setShowDatePicker(false);
        handleBirthDateBlur();
    };

    const handleBirthDateBlur = () => {
        if (!employeeBirthDate) {
            setBirthDateError('La fecha de nacimiento es obligatoria.');
        } else if (!isValidDateFormat(employeeBirthDate)) {
            setBirthDateError('Formato de fecha inválido (YYYY-MM-DD).');
        } else if (!isAdult(employeeBirthDate)) {
            setBirthDateError('La edad no cumple con los requisitos (mayor de 18 y no más de 120 años).');
        } else {
            setBirthDateError('');
        }
    };

    const handleSaveEmployee = async () => {
        setFormError('');

        handleNameBlur();
        handleLastNameBlur();
        handlePhoneBlur();
        handleBirthDateBlur();
        handleEmailBlur();
        handlePasswordBlur();
        handleConfirmPasswordBlur();

        const allErrors = [
            nameError, lastNameError, phoneError, birthDateError,
            emailError, passwordLengthWarning, confirmPasswordError
        ].filter(Boolean);

        if (!employeeName.trim() || !employeeLastName.trim() || !employeePhone ||
            !employeeGender || !employeeBirthDate || !employeeEmail.trim() ||
            !employeePassword || !employeeConfirmPassword) {
            setFormError('Por favor, completa todos los campos obligatorios.');
            return;
        }

        if (allErrors.length > 0) {
            setFormError('Por favor, corrige los errores en el formulario.');
            return;
        }

        if (!isValidName(employeeName) || !isValidName(employeeLastName) ||
            !isValidPhoneNumber(employeePhone) || !isValidDateFormat(employeeBirthDate) ||
            !isAdult(employeeBirthDate) ||
            !isValidEmail(employeeEmail) ||
            employeePassword.length < 6 || !doPasswordsMatch(employeePassword, employeeConfirmPassword)
        ) {
            setFormError('Por favor, corrige los errores en el formulario antes de guardar.');
            return;
        }

        setIsCreating(true);

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, employeeEmail, employeePassword);
            const user = userCredential.user;

            console.log("Empleado registrado en Firebase Auth:", user.email, "UID:", user.uid);

            await setDoc(doc(db, "users", user.uid), {
                email: user.email,
                role: "employee",
                createdAt: new Date().toISOString(),
            });

            console.log("Documento de usuario 'employee' creado en Firestore para UID:", user.uid);

            const employeePersonalData = {
                firebaseUid: user.uid,
                nombre: employeeName,
                apellido: employeeLastName,
                fecha_nacimiento: new Date(employeeBirthDate).toISOString(),
                genero: employeeGender,
                telefono: employeePhone,
                activo: true,
            };

            const response = await fetch(`${API_URL}/Personal`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(employeePersonalData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                let errorMessage = errorData.message || errorData.title || 'Error desconocido al guardar datos personales.';
                if (errorData.errors && Object.keys(errorData.errors).length > 0) {
                    errorMessage += "\n" + Object.values(errorData.errors).flat().join("\n");
                }
                throw new Error(errorMessage);
            }

            console.log("Datos personales de empleado guardados en SQL a través del backend.");

            showNotification('Empleado creado exitosamente!', 'success');
            
            onEmployeeCreated();
        } catch (error) {
            console.error("Error al registrar empleado:", error.message);
            let errorMessage = "Ocurrió un error inesperado al registrar el empleado.";

            if (error.code) {
                switch (error.code) {
                    case 'auth/email-already-in-use':
                        errorMessage = 'El correo electrónico ya está registrado.';
                        break;
                    case 'auth/invalid-email':
                        errorMessage = 'El formato del correo electrónico no es válido.';
                        break;
                    case 'auth/weak-password':
                        errorMessage = 'La contraseña es demasiado débil (debe tener al menos 6 caracteres).';
                        break;
                    default:
                        errorMessage = `Error de autenticación: ${error.message}`;
                }
            } else {
                errorMessage = error.message;
            }
            showNotification(errorMessage, 'error');
            setFormError(errorMessage);
        } finally {
            setIsCreating(false);
        }
    };

    const getYears = () => {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let i = currentYear; i >= currentYear - 100; i--) {
            years.push(i);
        }
        return years;
    };

    const getMonths = () => {
        return [
            { label: 'Enero', value: 0 }, { label: 'Febrero', value: 1 },
            { label: 'Marzo', value: 2 }, { label: 'Abril', value: 3 },
            { label: 'Mayo', value: 4 }, { label: 'Junio', value: 5 },
            { label: 'Julio', value: 6 }, { label: 'Agosto', value: 7 },
            { label: 'Septiembre', value: 8 }, { label: 'Octubre', value: 9 },
            { label: 'Noviembre', value: 10 }, { label: 'Diciembre', value: 11 },
        ];
    };

    const getDaysInMonth = (year, month) => {
        if (!year || month === undefined) return [];
        const date = new Date(year, month + 1, 0);
        const days = [];
        for (let i = 1; i <= date.getDate(); i++) {
            days.push(String(i).padStart(2, '0'));
        }
        return days;
    };


    return (
        <ScrollView contentContainerStyle={styles.formContainer}>
            <Text style={styles.formTitle}>Nuevo Empleado</Text>
            {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

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

            <View style={styles.fieldWrapper}>
                <Text style={styles.inputLabel}>Género</Text>
                {Platform.OS === 'ios' ? (
                    <>
                        <Pressable onPress={() => setShowGenderPicker(true)} style={styles.pickerInputContainer}>
                            <Ionicons name="person-circle-outline" size={18} color={MEDIUM_GRAY} style={styles.inputIcon} />
                            <Text style={styles.pickerDisplayValue}>{employeeGender}</Text>
                            <Ionicons name="caret-down" size={16} color={MEDIUM_GRAY} style={styles.dropdownIcon} />
                        </Pressable>
                        {showGenderPicker && (
                            <View style={styles.iosPickerOverlay}>
                                <View style={styles.iosPickerHeader}>
                                    <Text style={styles.iosPickerTitle}>Selecciona Género</Text>
                                    <TouchableOpacity onPress={() => setShowGenderPicker(false)}>
                                        <Text style={styles.iosPickerDone}>Hecho</Text>
                                    </TouchableOpacity>
                                </View>
                                <Picker
                                    selectedValue={employeeGender}
                                    onValueChange={(itemValue) => setEmployeeGender(itemValue)}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="Masculino" value="Masculino" />
                                    <Picker.Item label="Femenino" value="Femenino" />
                                </Picker>
                            </View>
                        )}
                    </>
                ) : (
                    <View style={styles.pickerInputContainer}>
                        <Ionicons name="person-circle-outline" size={18} color={MEDIUM_GRAY} style={styles.inputIcon} />
                        <Picker
                            selectedValue={employeeGender}
                            onValueChange={(itemValue) => setEmployeeGender(itemValue)}
                            style={styles.picker}
                            itemStyle={styles.pickerItem}
                        >
                            <Picker.Item label="Masculino" value="Masculino" />
                            <Picker.Item label="Femenino" value="Femenino" />
                        </Picker>
                    </View>
                )}
            </View>

            <View style={styles.fieldWrapper}>
                <Text style={styles.inputLabel}>Fecha de Nacimiento</Text>
                <View style={styles.inputContainer}>
                    <Ionicons name="calendar-outline" size={18} color={MEDIUM_GRAY} style={styles.inputIcon} />
                    {Platform.OS === 'web' ? (
                        <input
                            type="date"
                            value={employeeBirthDate}
                            onChange={handleDateSelect}
                            onBlur={handleBirthDateBlur}
                            style={styles.datePickerWeb}
                        />
                    ) : (
                        <Pressable onPress={() => setShowDatePicker(true)} style={styles.datePickerMobileInput}>
                            <Text style={employeeBirthDate ? styles.pickerDisplayValue : styles.placeholderText}>
                                {employeeBirthDate || "YYYY-MM-DD"}
                            </Text>
                            <Ionicons name="caret-down" size={16} color={MEDIUM_GRAY} style={styles.dropdownIcon} />
                        </Pressable>
                    )}
                </View>
                {/* Simulated Date Picker for Mobile */}
                {Platform.OS !== 'web' && showDatePicker && (
                    <View style={styles.iosPickerOverlay}>
                        <View style={styles.iosPickerHeader}>
                            <Text style={styles.iosPickerTitle}>Selecciona Fecha</Text>
                            <TouchableOpacity onPress={() => handleDateSelect(null, selectedDateObject)}>
                                <Text style={styles.iosPickerDone}>Hecho</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.datePickerWheelContainer}>
                            <Picker
                                selectedValue={selectedDateObject.getFullYear()}
                                onValueChange={(itemValue) => setSelectedDateObject(new Date(itemValue, selectedDateObject.getMonth(), selectedDateObject.getDate()))}
                                style={styles.datePickerWheel}
                                itemStyle={styles.pickerItem}
                            >
                                {getYears().map(year => (
                                    <Picker.Item key={year} label={String(year)} value={year} />
                                ))}
                            </Picker>
                            <Picker
                                selectedValue={selectedDateObject.getMonth()}
                                onValueChange={(itemValue) => setSelectedDateObject(new Date(selectedDateObject.getFullYear(), itemValue, selectedDateObject.getDate()))}
                                style={styles.datePickerWheel}
                                itemStyle={styles.pickerItem}
                            >
                                {getMonths().map(month => (
                                    <Picker.Item key={month.value} label={month.label} value={month.value} />
                                ))}
                            </Picker>
                            <Picker
                                selectedValue={selectedDateObject.getDate()}
                                onValueChange={(itemValue) => setSelectedDateObject(new Date(selectedDateObject.getFullYear(), selectedDateObject.getMonth(), itemValue))}
                                style={styles.datePickerWheel}
                                itemStyle={styles.pickerItem}
                            >
                                {getDaysInMonth(selectedDateObject.getFullYear(), selectedDateObject.getMonth()).map(day => (
                                    <Picker.Item key={day} label={day} value={parseInt(day)} />
                                ))}
                            </Picker>
                        </View>
                        <Text style={styles.mockDatePickerText}>
                            (Use an external library like @react-native-community/datetimepicker for a native date picker experience.)
                        </Text>
                    </View>
                )}
                {birthDateError ? <Text style={styles.fieldErrorText}>{birthDateError}</Text> : null}
            </View>

            <View style={styles.fieldWrapper}>
                <Text style={styles.inputLabel}>Correo electrónico</Text>
                <View style={styles.inputContainer}>
                    <Ionicons name="mail-outline" size={18} color={MEDIUM_GRAY} style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="ejemplo@dominio.com"
                        placeholderTextColor={LIGHT_GRAY}
                        value={employeeEmail}
                        onChangeText={setEmployeeEmail}
                        onBlur={handleEmailBlur}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>
                {emailError ? <Text style={styles.fieldErrorText}>{emailError}</Text> : null}
            </View>

            <View style={IS_LARGE_SCREEN ? styles.rowContainer : null}>
                <View style={[IS_LARGE_SCREEN ? styles.rowField : null, styles.fieldWrapper]}>
                    <Text style={styles.inputLabel}>Contraseña</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={18} color={MEDIUM_GRAY} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Mínimo 6 caracteres"
                            placeholderTextColor={LIGHT_GRAY}
                            value={employeePassword}
                            onChangeText={setEmployeePassword}
                            onBlur={handlePasswordBlur}
                            secureTextEntry={!showPassword}
                            autoCompleteType={Platform.OS === 'web' ? 'new-password' : 'off'}
                            autoComplete={Platform.OS === 'web' ? 'new-password' : 'off'}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.passwordToggle}>
                            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={MEDIUM_GRAY} />
                        </TouchableOpacity>
                    </View>
                    {passwordLengthWarning ? <Text style={styles.fieldErrorText}>{passwordLengthWarning}</Text> : null}
                </View>

                <View style={[IS_LARGE_SCREEN ? styles.rowField : null, styles.fieldWrapper]}>
                    <Text style={styles.inputLabel}>Confirmar Contraseña</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={18} color={MEDIUM_GRAY} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Confirma tu contraseña"
                            placeholderTextColor={LIGHT_GRAY}
                            value={employeeConfirmPassword}
                            onChangeText={setEmployeeConfirmPassword}
                            onBlur={handleConfirmPasswordBlur}
                            secureTextEntry={!showPassword}
                            autoCompleteType={Platform.OS === 'web' ? 'new-password' : 'off'}
                            autoComplete={Platform.OS === 'web' ? 'new-password' : 'off'}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.passwordToggle}>
                            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={MEDIUM_GRAY} />
                        </TouchableOpacity>
                    </View>
                    {confirmPasswordError ? <Text style={styles.fieldErrorText}>{confirmPasswordError}</Text> : null}
                </View>
            </View>

            <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleSaveEmployee}
                disabled={isCreating}
            >
                <Text style={styles.primaryButtonText}>
                    {isCreating ? <ActivityIndicator color={WHITE} /> : 'REGISTRAR EMPLEADO'}
                </Text>
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
        marginTop: Platform.OS === 'web' ? height * 0.05 : 125,
        marginBottom: 20,
        // Increased paddingHorizontal and width/maxWidth for web
        paddingHorizontal: IS_LARGE_SCREEN ? 30 : 12,
        paddingVertical: 25,
        width: IS_LARGE_SCREEN ? '65%' : '90%', // Increased width for large screens
        maxWidth: IS_LARGE_SCREEN ? 600 : 380, // Increased max-width for large screens
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
    inputIcon: {
        marginRight: 0,
        fontSize: 18,
    },
    passwordToggle: {
        // Removed paddingLeft: 10 to adjust icon position
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        paddingRight: 5, // Small padding to keep it from the very edge
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
            ios: {
                // For iOS, the picker itself should not have borders/background
                // as it's typically rendered in a modal or separate view.
                // We'll manage the visual input via the Pressable.
            }
        }),
    },
    pickerItem: {
        fontSize: 15,
    },
    pickerInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderColor: VERY_LIGHT_GRAY,
        borderWidth: 1.5,
        borderRadius: 8,
        paddingHorizontal: 12,
        backgroundColor: BACKGROUND_LIGHT,
        height: 45,
    },
    pickerDisplayValue: {
        flex: 1,
        color: MEDIUM_GRAY,
        fontSize: 15,
        paddingLeft: 8,
    },
    placeholderText: {
        flex: 1,
        color: LIGHT_GRAY,
        fontSize: 15,
        paddingLeft: 8,
    },
    dropdownIcon: {
        marginLeft: 8,
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
    datePickerMobileInput: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        height: '100%',
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
    iosPickerOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255,255,255,0.9)',
        zIndex: 10,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: -3,
        },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 10,
    },
    iosPickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: VERY_LIGHT_GRAY,
        backgroundColor: '#F9F9F9',
    },
    iosPickerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: DARK_GRAY,
    },
    iosPickerDone: {
        fontSize: 17,
        color: PRIMARY_GREEN,
        fontWeight: '600',
    },
    datePickerWheelContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        height: 200,
    },
    datePickerWheel: {
        width: '33%',
        height: '100%',
    },
    mockDatePickerText: {
        textAlign: 'center',
        paddingVertical: 10,
        color: LIGHT_GRAY,
        fontSize: 12,
    }
});