import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    SafeAreaView,
    Platform,
    TextInput,
    KeyboardAvoidingView,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { auth, db } from '../../config/firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import Config from '../../config/config';

// --- COLORES ---
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
const BUTTON_HOVER_COLOR = '#5aa130'; // Un verde un poco más oscuro para hover

const { width } = Dimensions.get('window');
const IS_LARGE_SCREEN = width > 900;

export default function EmployeeManagementScreen() {
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [employeeName, setEmployeeName] = useState('');
    const [employeeLastName, setEmployeeLastName] = useState('');
    const [employeeEmail, setEmployeeEmail] = useState('');
    const [employeePassword, setEmployeePassword] = useState('');
    const [employeePhone, setEmployeePhone] = useState('');
    const [employeeGender, setEmployeeGender] = useState('');
    const [employeeBirthDate, setEmployeeBirthDate] = useState('');
    const [formError, setFormError] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const [employees, setEmployees] = useState([]);
    const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
    const [fetchError, setFetchError] = useState('');

    // Estados para búsqueda y filtrado
    const [searchTerm, setSearchTerm] = useState('');
    // Cambiado de booleano a string para los 3 estados: 'Activos', 'Inactivos', 'Todos'
    const [filterStatus, setFilterStatus] = useState('Activos'); // Por defecto, mostrar solo activos

    // Estados para paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [employeesPerPage] = useState(8); // ¡Siempre 8 empleados por página!

    const API_URL = Config.API_BASE_URL;

    const fetchEmployees = async () => {
        setIsLoadingEmployees(true);
        setFetchError('');
        try {
            const response = await fetch(`${API_URL}/Personal`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al cargar empleados del backend.');
            }

            const data = await response.json();
            if (data && data.personal) {
                setEmployees(data.personal);
            } else {
                setEmployees(data);
            }
            console.log("Empleados cargados:", data);
        } catch (error) {
            console.error("Error al cargar empleados:", error.message);
            setFetchError('No se pudieron cargar los empleados. Intenta de nuevo más tarde.');
        } finally {
            setIsLoadingEmployees(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const handleCreateNewEmployee = () => {
        setEmployeeName('');
        setEmployeeLastName('');
        setEmployeeEmail('');
        setEmployeePassword('');
        setEmployeePhone('');
        setEmployeeGender('');
        setEmployeeBirthDate('');
        setFormError('');
        setShowCreateForm(true);
    };

    const handleCancelCreate = () => {
        setShowCreateForm(false);
    };

    const handleSaveEmployee = async () => {
        setFormError('');

        if (!employeeName || !employeeLastName || !employeeEmail || !employeePassword || !employeePhone || !employeeGender || !employeeBirthDate) {
            setFormError('Por favor, completa todos los campos.');
            return;
        }

        if (employeePassword.length < 6) {
            setFormError('La contraseña debe tener al menos 6 caracteres.');
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

            Alert.alert("Éxito", "Empleado registrado y datos personales guardados correctamente.");
            setShowCreateForm(false);
            fetchEmployees();
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
            setFormError(errorMessage);
        } finally {
            setIsCreating(false);
        }
    };

    const handleEditEmployee = (employeeId) => {
        Alert.alert('Editar', `Funcionalidad de edición para el empleado ID: ${employeeId}`);
        // Aquí iría la lógica para cargar los datos del empleado en un formulario de edición
    };

    // Lógica de búsqueda y filtrado
    const filteredEmployees = employees.filter(employee => {
        // La búsqueda ya es insensible a mayúsculas/minúsculas y maneja espacios por defecto con .includes()
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        const matchesSearchTerm = employee.nombre.toLowerCase().includes(lowerCaseSearchTerm) ||
            employee.apellido.toLowerCase().includes(lowerCaseSearchTerm);

        let matchesFilterStatus = true;
        if (filterStatus === 'Activos') {
            matchesFilterStatus = employee.activo === true;
        } else if (filterStatus === 'Inactivos') {
            matchesFilterStatus = employee.activo === false;
        }
        // Si filterStatus es 'Todos', matchesFilterStatus ya es true, no se necesita acción.

        return matchesSearchTerm && matchesFilterStatus;
    });

    // Lógica de paginación
    const indexOfLastEmployee = currentPage * employeesPerPage;
    const indexOfFirstEmployee = indexOfLastEmployee - employeesPerPage;
    const currentEmployees = filteredEmployees.slice(indexOfFirstEmployee, indexOfLastEmployee);

    const totalPages = Math.ceil(filteredEmployees.length / employeesPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.keyboardAvoidingView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                {showCreateForm ? (
                    <ScrollView contentContainerStyle={styles.formContainer}>
                        <Text style={styles.formTitle}>Registrar Nuevo Empleado</Text>
                        {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

                        <Text style={styles.inputLabel}>Nombre</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="person-outline" size={20} color={MEDIUM_GRAY} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Nombre del empleado"
                                placeholderTextColor={LIGHT_GRAY}
                                value={employeeName}
                                onChangeText={setEmployeeName}
                            />
                        </View>

                        <Text style={styles.inputLabel}>Apellido</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="person-outline" size={20} color={MEDIUM_GRAY} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Apellido del empleado"
                                placeholderTextColor={LIGHT_GRAY}
                                value={employeeLastName}
                                onChangeText={setEmployeeLastName}
                            />
                        </View>

                        <Text style={styles.inputLabel}>Correo electrónico</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="mail-outline" size={20} color={MEDIUM_GRAY} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="ejemplo@dominio.com"
                                placeholderTextColor={LIGHT_GRAY}
                                value={employeeEmail}
                                onChangeText={setEmployeeEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        <Text style={styles.inputLabel}>Contraseña</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={20} color={MEDIUM_GRAY} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Mínimo 6 caracteres"
                                placeholderTextColor={LIGHT_GRAY}
                                value={employeePassword}
                                onChangeText={setEmployeePassword}
                                secureTextEntry
                            />
                        </View>

                        <Text style={styles.inputLabel}>Teléfono</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="call-outline" size={20} color={MEDIUM_GRAY} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Ej: 5512345678"
                                placeholderTextColor={LIGHT_GRAY}
                                value={employeePhone}
                                onChangeText={setEmployeePhone}
                                keyboardType="phone-pad"
                            />
                        </View>

                        <Text style={styles.inputLabel}>Género</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="transgender-outline" size={20} color={MEDIUM_GRAY} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Ej: Masculino, Femenino"
                                placeholderTextColor={LIGHT_GRAY}
                                value={employeeGender}
                                onChangeText={setEmployeeGender}
                            />
                        </View>

                        <Text style={styles.inputLabel}>Fecha de Nacimiento</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="calendar-outline" size={20} color={MEDIUM_GRAY} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor={LIGHT_GRAY}
                                value={employeeBirthDate}
                                onChangeText={setEmployeeBirthDate}
                                keyboardType="numeric"
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={handleSaveEmployee}
                            disabled={isCreating}
                        >
                            <Text style={styles.primaryButtonText}>
                                {isCreating ? <ActivityIndicator color={WHITE} /> : 'GUARDAR EMPLEADO'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={handleCancelCreate}
                            disabled={isCreating}
                        >
                            <Text style={styles.secondaryButtonText}>CANCELAR</Text>
                        </TouchableOpacity>
                    </ScrollView>
                ) : (
                    <View style={styles.mainContentArea}>
                        <View style={styles.controlsContainer}>
                            {/* Barra de búsqueda y filtros a la izquierda */}
                            <View style={styles.searchFilterGroup}>
                                <View style={styles.searchInputContainer}>
                                    <Ionicons name="search" size={20} color={MEDIUM_GRAY} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.searchInput} // Aplicamos el estilo aquí
                                        placeholder="Buscar por nombre/apellido..."
                                        placeholderTextColor={LIGHT_GRAY}
                                        value={searchTerm}
                                        onChangeText={setSearchTerm}
                                    />
                                </View>
                                {/* Botones de filtro */}
                                <View style={styles.filterButtonsContainer}>
                                    <TouchableOpacity
                                        style={[
                                            styles.filterButton,
                                            filterStatus === 'Todos' && styles.filterButtonActive,
                                        ]}
                                        onPress={() => setFilterStatus('Todos')}
                                    >
                                        <Text style={[
                                            styles.filterButtonText,
                                            filterStatus === 'Todos' && styles.filterButtonTextActive
                                        ]}>
                                            Todos
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.filterButton,
                                            filterStatus === 'Activos' && styles.filterButtonActive,
                                        ]}
                                        onPress={() => setFilterStatus('Activos')}
                                    >
                                        <Text style={[
                                            styles.filterButtonText,
                                            filterStatus === 'Activos' && styles.filterButtonTextActive
                                        ]}>
                                            Activos
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.filterButton,
                                            filterStatus === 'Inactivos' && styles.filterButtonActive,
                                        ]}
                                        onPress={() => setFilterStatus('Inactivos')}
                                    >
                                        <Text style={[
                                            styles.filterButtonText,
                                            filterStatus === 'Inactivos' && styles.filterButtonTextActive
                                        ]}>
                                            Inactivos
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Botón de crear empleados a la derecha */}
                            <TouchableOpacity
                                style={styles.createButton}
                                onPress={handleCreateNewEmployee}
                            >
                                <Ionicons name="person-add" size={20} color={styles.createButtonText.color} />
                                <Text style={styles.createButtonText}>CREAR EMPLEADO</Text>
                            </TouchableOpacity>
                        </View>

                        {isLoadingEmployees ? (
                            <ActivityIndicator size="large" color={PRIMARY_GREEN} style={styles.loadingIndicator} />
                        ) : fetchError ? (
                            <Text style={styles.errorText}>{fetchError}</Text>
                        ) : employees.length === 0 ? (
                            <Text style={styles.noEmployeesText}>No hay empleados registrados.</Text>
                        ) : (
                            <>
                                <View style={styles.tableContainer}>
                                    <ScrollView horizontal={true} contentContainerStyle={styles.tableScrollViewContent}>
                                        <View style={styles.table}>
                                            <View style={styles.tableRowHeader}>
                                                <Text style={[styles.tableHeaderCell, styles.idCell]}>ID</Text>
                                                <Text style={styles.tableHeaderCell}>Nombre</Text>
                                                <Text style={styles.tableHeaderCell}>Apellido</Text>
                                                <Text style={styles.tableHeaderCell}>Nacimiento</Text>
                                                <Text style={styles.tableHeaderCell}>Género</Text>
                                                <Text style={styles.tableHeaderCell}>Teléfono</Text>
                                                <Text style={[styles.tableHeaderCell, styles.activeCell]}>Activo</Text>
                                                <Text style={[styles.tableHeaderCell, styles.actionsCell]}>Acciones</Text>
                                            </View>

                                            <ScrollView style={styles.tableBodyScrollView}>
                                                {currentEmployees.length === 0 ? (
                                                    <Text style={styles.noResultsText}>No se encontraron resultados para la búsqueda/filtro.</Text>
                                                ) : (
                                                    currentEmployees.map((employee, index) => (
                                                        <View
                                                            key={employee.id}
                                                            style={[
                                                                styles.tableRow,
                                                                index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd,
                                                            ]}
                                                        >
                                                            <Text style={[styles.tableCell, styles.idCell]}>{employee.id}</Text>
                                                            <Text style={styles.tableCell}>{employee.nombre}</Text>
                                                            <Text style={styles.tableCell}>{employee.apellido}</Text>
                                                            <Text style={styles.tableCell}>
                                                                {new Date(employee.fecha_nacimiento).toLocaleDateString()}
                                                            </Text>
                                                            <Text style={styles.tableCell}>{employee.genero}</Text>
                                                            <Text style={styles.tableCell}>{employee.telefono}</Text>
                                                            <Text style={[styles.tableCell, styles.activeCell]}>{employee.activo ? 'Sí' : 'No'}</Text>
                                                            <View style={[styles.tableCell, styles.actionsCell]}>
                                                                <TouchableOpacity
                                                                    style={styles.actionButton}
                                                                    onPress={() => handleEditEmployee(employee.id)}
                                                                >
                                                                    <Ionicons name="create-outline" size={20} color={PRIMARY_GREEN} />
                                                                </TouchableOpacity>
                                                            </View>
                                                        </View>
                                                    ))
                                                )}
                                            </ScrollView>
                                        </View>
                                    </ScrollView>
                                </View>

                                {/* Controles de Paginación */}
                                {totalPages > 1 && (
                                    <View style={styles.paginationContainer}>
                                        <TouchableOpacity
                                            style={styles.paginationButton}
                                            onPress={() => paginate(currentPage - 1)}
                                            disabled={currentPage === 1}
                                        >
                                            <Ionicons name="chevron-back-outline" size={20} color={currentPage === 1 ? LIGHT_GRAY : DARK_GRAY} />
                                        </TouchableOpacity>
                                        {[...Array(totalPages).keys()].map(number => (
                                            <TouchableOpacity
                                                key={number}
                                                style={[
                                                    styles.paginationPageButton,
                                                    currentPage === number + 1 && styles.paginationPageButtonActive,
                                                ]}
                                                onPress={() => paginate(number + 1)}
                                            >
                                                <Text
                                                    style={[
                                                        styles.paginationPageText,
                                                        currentPage === number + 1 && styles.paginationPageTextActive,
                                                    ]}
                                                >
                                                    {number + 1}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                        <TouchableOpacity
                                            style={styles.paginationButton}
                                            onPress={() => paginate(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                        >
                                            <Ionicons name="chevron-forward-outline" size={20} color={currentPage === totalPages ? LIGHT_GRAY : DARK_GRAY} />
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </>
                        )}
                    </View>
                )}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// Estilos base para contenedores con sombra y bordes
const containerBaseStyles = {
    backgroundColor: WHITE,
    borderRadius: 15,
    padding: IS_LARGE_SCREEN ? 22 : 18,
    shadowColor: DARK_GRAY,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: VERY_LIGHT_GRAY,
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: BACKGROUND_LIGHT,
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    header: {
        height: Platform.OS === 'android' ? 30 : 0,
        backgroundColor: 'transparent',
    },
    mainContentArea: {
        flex: 1,
        padding: IS_LARGE_SCREEN ? 20 : 10,
        alignItems: 'center',
    },
    controlsContainer: {
        width: '100%',
        maxWidth: IS_LARGE_SCREEN ? 1000 : 'auto',
        flexDirection: IS_LARGE_SCREEN ? 'row' : 'column',
        justifyContent: 'space-between',
        alignItems: IS_LARGE_SCREEN ? 'center' : 'stretch',
        marginBottom: 20,
        gap: IS_LARGE_SCREEN ? 0 : 15,
    },
    createButton: {
        flexDirection: 'row',
        backgroundColor: PRIMARY_GREEN,
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: PRIMARY_GREEN,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 6,
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
    createButtonText: {
        color: WHITE,
        fontSize: 15,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    searchFilterGroup: {
        flex: 1, // Allow it to take up available space on the left
        flexDirection: 'row', // Keep them in a row
        alignItems: 'center',
        justifyContent: 'flex-start', // Align items to the start (left)
        gap: 10, // Space between search and filter button
        flexWrap: 'wrap', // Allow wrapping on smaller screens if needed
    },
    searchInputContainer: {
        flex: IS_LARGE_SCREEN ? 0.6 : 1, // Make search bar less wide on large screens, still flexible on small
        flexDirection: 'row',
        alignItems: 'center',
        height: 45,
        borderColor: LIGHT_GRAY,
        borderWidth: 1.5,
        borderRadius: 10,
        backgroundColor: WHITE,
        shadowColor: DARK_GRAY,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        paddingHorizontal: 10,
    },
    searchInput: {
        flex: 1,
        height: '100%',
        fontSize: 15,
        color: DARK_GRAY,
        paddingVertical: 0,
        ...Platform.select({
            web: {
                outlineStyle: 'none', // Quita el borde de enfoque predeterminado del navegador
            },
        }),
    },
    inputIcon: {
        marginRight: 10,
    },
    filterButtonsContainer: {
        flexDirection: 'row',
        gap: 8, // Space between filter buttons
        // flexWrap: 'wrap', // Allow buttons to wrap if they don't fit on one line
    },
    filterButton: {
        backgroundColor: VERY_LIGHT_GRAY,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: VERY_LIGHT_GRAY,
        ...Platform.select({
            web: {
                cursor: 'pointer',
                transitionDuration: '0.3s',
                transitionProperty: 'background-color, border-color, color',
                ':hover': {
                    backgroundColor: LIGHT_GREEN,
                    borderColor: PRIMARY_GREEN,
                    color: WHITE,
                },
            },
        }),
    },
    filterButtonActive: {
        backgroundColor: PRIMARY_GREEN,
        borderColor: PRIMARY_GREEN,
    },
    filterButtonText: {
        color: MEDIUM_GRAY,
        fontSize: 14,
        fontWeight: '600',
    },
    filterButtonTextActive: {
        color: WHITE,
    },
    formContainer: {
        ...containerBaseStyles,
        margin: IS_LARGE_SCREEN ? 20 : 10,
        maxWidth: IS_LARGE_SCREEN ? 600 : 'auto',
        alignSelf: 'center',
        paddingVertical: 25,
    },
    formTitle: {
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 25,
        textAlign: 'center',
        color: DARK_GRAY,
        borderBottomWidth: 1,
        borderBottomColor: VERY_LIGHT_GRAY,
        paddingBottom: 15,
    },
    inputLabel: {
        fontSize: 14,
        color: MEDIUM_GRAY,
        marginBottom: 5,
        fontWeight: '600',
        alignSelf: 'flex-start',
        marginLeft: 5,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 50,
        borderColor: LIGHT_GRAY,
        borderWidth: 1.5,
        borderRadius: 10,
        marginBottom: 15,
        backgroundColor: WHITE,
        shadowColor: DARK_GRAY,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        paddingHorizontal: 10,
    },
    input: {
        flex: 1,
        height: '100%',
        fontSize: 16,
        color: DARK_GRAY,
        paddingVertical: 0,
    },
    errorText: {
        color: ERROR_RED,
        textAlign: 'center',
        marginBottom: 15,
        fontSize: 14,
        fontWeight: '500',
    },
    primaryButton: {
        backgroundColor: PRIMARY_GREEN,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        shadowColor: PRIMARY_GREEN,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
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
        fontSize: 18,
        fontWeight: 'bold',
    },
    secondaryButton: {
        backgroundColor: WHITE,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        borderWidth: 1.5,
        borderColor: PRIMARY_GREEN,
        shadowColor: DARK_GRAY,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
        ...Platform.select({
            web: {
                cursor: 'pointer',
                transitionDuration: '0.3s',
                transitionProperty: 'background-color, border-color, color',
                ':hover': {
                    backgroundColor: ACCENT_GREEN_BACKGROUND,
                    borderColor: LIGHT_GREEN,
                    color: PRIMARY_GREEN,
                },
            },
        }),
    },
    secondaryButtonText: {
        color: PRIMARY_GREEN,
        fontSize: 18,
        fontWeight: 'bold',
    },
    loadingIndicator: {
        marginTop: 50,
    },
    noEmployeesText: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
        color: MEDIUM_GRAY,
    },
    tableContainer: {
        ...containerBaseStyles,
        width: '100%',
        maxWidth: IS_LARGE_SCREEN ? 1000 : 'auto',
        alignSelf: 'center',
        marginBottom: 20,
        padding: 0,
        height: 500, // Altura fija para la tabla
        overflow: 'hidden',
    },
    tableScrollViewContent: {
        flexGrow: 1,
        justifyContent: 'flex-start',
    },
    table: {
        flex: 1,
        width: IS_LARGE_SCREEN ? '100%' : 900,
        minWidth: '100%',
    },
    tableRowHeader: {
        flexDirection: 'row',
        backgroundColor: WHITE,
        paddingVertical: 15,
        paddingHorizontal: 10,
        borderBottomWidth: 2,
        borderBottomColor: VERY_LIGHT_GRAY,
    },
    tableHeaderCell: {
        flex: 1,
        fontWeight: 'bold',
        fontSize: 13,
        color: DARK_GRAY,
        textAlign: 'center',
        textTransform: 'uppercase',
    },
    tableBodyScrollView: {
        flex: 1, // Asegura que el scroll view ocupe el espacio restante y permita el scroll
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 14,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: VERY_LIGHT_GRAY,
        alignItems: 'center',
    },
    tableRowEven: {
        backgroundColor: WHITE,
    },
    tableRowOdd: {
        backgroundColor: BACKGROUND_LIGHT,
    },
    tableCell: {
        flex: 1,
        fontSize: 14,
        color: MEDIUM_GRAY,
        textAlign: 'center',
    },
    idCell: {
        flex: IS_LARGE_SCREEN ? 0.3 : 0.5,
    },
    activeCell: {
        flex: IS_LARGE_SCREEN ? 0.4 : 0.5,
    },
    actionsCell: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        flex: IS_LARGE_SCREEN ? 0.7 : 1,
    },
    actionButton: {
        padding: 5,
        borderRadius: 5,
        ...Platform.select({
            web: {
                cursor: 'pointer',
                transitionDuration: '0.2s',
                transitionProperty: 'background-color',
                ':hover': {
                    backgroundColor: VERY_LIGHT_GRAY,
                },
            },
        }),
    },
    noResultsText: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
        color: MEDIUM_GRAY,
        padding: 20,
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 20,
        width: '100%',
        maxWidth: IS_LARGE_SCREEN ? 1000 : 'auto',
    },
    paginationButton: {
        padding: 8,
        borderRadius: 8,
        marginHorizontal: 5,
        backgroundColor: WHITE,
        borderWidth: 1,
        borderColor: VERY_LIGHT_GRAY,
        shadowColor: DARK_GRAY,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        ...Platform.select({
            web: {
                cursor: 'pointer',
                transitionDuration: '0.2s',
                transitionProperty: 'background-color, border-color',
                ':hover': {
                    backgroundColor: ACCENT_GREEN_BACKGROUND,
                    borderColor: LIGHT_GREEN,
                },
            },
        }),
    },
    paginationPageButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginHorizontal: 3,
        backgroundColor: WHITE,
        borderWidth: 1,
        borderColor: VERY_LIGHT_GRAY,
        shadowColor: DARK_GRAY,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        ...Platform.select({
            web: {
                cursor: 'pointer',
                transitionDuration: '0.2s',
                transitionProperty: 'background-color, border-color, color',
                ':hover': {
                    backgroundColor: ACCENT_GREEN_BACKGROUND,
                    borderColor: LIGHT_GREEN,
                },
            },
        }),
    },
    paginationPageButtonActive: {
        backgroundColor: PRIMARY_GREEN,
        borderColor: PRIMARY_GREEN,
    },
    paginationPageText: {
        color: MEDIUM_GRAY,
        fontSize: 14,
        fontWeight: '600',
    },
    paginationPageTextActive: {
        color: WHITE,
    },
});