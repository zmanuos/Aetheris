// AETHERIS/screens/admin/DeviceManagementScreen.js
import React, { useState, useEffect } from 'react';
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
    ActivityIndicator,
    Dimensions,
    KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';

import Config from '../../config/config';
// Importa los componentes de creación y edición de dispositivos (deberás crearlos)
// import CreateDeviceScreen from './CreateDeviceScreen'; // Asume que este archivo existe
// import EditDeviceScreen from './EditDeviceScreen';   // Asume que este archivo existe

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


export default function DeviceManagementScreen() {
    const navigation = useNavigation();
    const isFocused = useIsFocused();

    const [devices, setDevices] = useState([]);
    const [isLoadingDevices, setIsLoadingDevices] = useState(true);
    const [fetchError, setFetchError] = useState('');

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('Activos'); // 'Activos', 'Inactivos', 'Todos'

    const [currentPage, setCurrentPage] = useState(1);
    const [devicesPerPage] = useState(8); // Puedes ajustar esto si quieres más o menos dispositivos por página

    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [deviceToEdit, setDeviceToEdit] = useState(null);

    const API_URL = Config.API_BASE_URL;

    const fetchDevices = async () => {
        setIsLoadingDevices(true);
        setFetchError('');
        try {
            const response = await fetch(`${API_URL}/Dispositivo`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al cargar dispositivos del backend.');
            }

            const data = await response.json();
            if (data && data.dispositivo) {
                setDevices(data.dispositivo);
            } else {
                setDevices(data);
            }
            console.log("Dispositivos cargados:", data);
        } catch (error) {
            console.error("Error al cargar dispositivos:", error.message);
            setFetchError('No se pudieron cargar los dispositivos. Intenta de nuevo más tarde.');
        } finally {
            setIsLoadingDevices(false);
        }
    };

    useEffect(() => {
        if (isFocused && !showCreateForm && !showEditForm) {
            fetchDevices();
        }
    }, [isFocused, showCreateForm, showEditForm]);

    const handleCreateNewDevice = () => {
        setShowCreateForm(true);
        setShowEditForm(false);
        setDeviceToEdit(null);
    };

    const handleCancelCreate = () => {
        setShowCreateForm(false);
        fetchDevices();
    };

    const handleDeviceCreated = () => {
        setShowCreateForm(false);
        fetchDevices();
    };

    const handleEditDevice = (device) => {
        setDeviceToEdit(device);
        setShowEditForm(true);
        setShowCreateForm(false);
    };

    const handleCancelEdit = () => {
        setShowEditForm(false);
        setDeviceToEdit(null);
        fetchDevices();
    };

    const handleDeviceEdited = () => {
        setShowEditForm(false);
        setDeviceToEdit(null);
        fetchDevices();
    };

    // Filtrar dispositivos basado en el término de búsqueda y el estado
    const filteredDevices = devices.filter(device => {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        // Permite buscar por MAC o ID (convirtiendo ID a string)
        const matchesSearchTerm = device.direccion_MAC.toLowerCase().includes(lowerCaseSearchTerm) ||
                                  String(device.id).includes(lowerCaseSearchTerm);

        let matchesFilterStatus = true;
        if (filterStatus === 'Activos') {
            matchesFilterStatus = device.estado === true;
        } else if (filterStatus === 'Inactivos') {
            matchesFilterStatus = device.estado === false;
        }
        return matchesSearchTerm && matchesFilterStatus;
    });

    // Recalculate current page devices whenever filteredDevices or currentPage changes
    const indexOfLastDevice = currentPage * devicesPerPage;
    const indexOfFirstDevice = indexOfLastDevice - devicesPerPage;
    const currentDevices = filteredDevices.slice(indexOfFirstDevice, indexOfLastDevice);

    const totalPages = Math.ceil(filteredDevices.length / devicesPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.keyboardAvoidingView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                {/* Botón de regresar visible si cualquier formulario está activo */}
                {(showCreateForm || showEditForm) && (
                    <TouchableOpacity onPress={showCreateForm ? handleCancelCreate : handleCancelEdit} style={styles.backButton}>
                        <Ionicons name="arrow-back-outline" size={20} color={WHITE} />
                        <Text style={styles.backButtonText}>Regresar</Text>
                    </TouchableOpacity>
                )}

                {showCreateForm ? (
                    <CreateDeviceScreen onDeviceCreated={handleDeviceCreated} onCancel={handleCancelCreate} />
                ) : showEditForm && deviceToEdit ? (
                    <EditDeviceScreen
                        route={{ params: { deviceData: deviceToEdit } }}
                        onDeviceEdited={handleDeviceEdited}
                        onCancel={handleCancelEdit}
                    />
                ) : (
                    <View style={styles.mainContentArea}>
                        <View style={styles.controlsContainer}>
                            <View style={styles.searchFilterGroup}>
                                <View style={styles.searchInputContainer}>
                                    <Ionicons name="search" size={20} color={MEDIUM_GRAY} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.searchInput}
                                        placeholder="Buscar por MAC o ID..."
                                        placeholderTextColor={LIGHT_GRAY}
                                        value={searchTerm}
                                        onChangeText={setSearchTerm}
                                    />
                                </View>
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

                            <TouchableOpacity
                                style={styles.createButton}
                                onPress={handleCreateNewDevice}
                            >
                                <Ionicons name="add-circle" size={20} color={styles.createButtonText.color} />
                                <Text style={styles.createButtonText}>AÑADIR DISPOSITIVO</Text>
                            </TouchableOpacity>
                        </View>

                        {isLoadingDevices ? (
                            <ActivityIndicator size="large" color={PRIMARY_GREEN} style={styles.loadingIndicator} />
                        ) : fetchError ? (
                            <Text style={styles.errorText}>{fetchError}</Text>
                        ) : devices.length === 0 && searchTerm === '' && filterStatus === 'Activos' ? (
                            <Text style={styles.noDevicesText}>No hay dispositivos registrados.</Text>
                        ) : (
                            <>
                                <View style={styles.tableContainer}>
                                    <ScrollView horizontal={true} contentContainerStyle={styles.tableScrollViewContent}>
                                        <View style={styles.table}>
                                            <View style={styles.tableRowHeader}>
                                                <Text style={[styles.tableHeaderCell, styles.idCell]}>ID</Text>
                                                <Text style={styles.tableHeaderCell}>Dirección MAC</Text>
                                                <Text style={[styles.tableHeaderCell, styles.estadoCell]}>Estado</Text>
                                                <Text style={styles.tableHeaderCell}>Fecha Asignación</Text>
                                                <Text style={[styles.tableHeaderCell, styles.actionsCell]}>Acciones</Text>
                                            </View>

                                            <ScrollView style={styles.tableBodyScrollView}>
                                                {currentDevices.length === 0 ? (
                                                    <Text style={styles.noResultsText}>No se encontraron resultados para la búsqueda/filtro.</Text>
                                                ) : (
                                                    currentDevices.map((device, index) => (
                                                        <View
                                                            key={device.id}
                                                            style={[
                                                                styles.tableRow,
                                                                index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd,
                                                            ]}
                                                        >
                                                            <Text style={[styles.tableCell, styles.idCell]}>{device.id}</Text>
                                                            <Text style={styles.tableCell}>{device.direccion_MAC}</Text>
                                                            <Text style={[styles.tableCell, styles.estadoCell]}>{device.estado ? 'Activo' : 'Inactivo'}</Text>
                                                            <Text style={styles.tableCell}>
                                                                {new Date(device.fecha_asignacion).toLocaleDateString()}
                                                            </Text>
                                                            <View style={[styles.tableCell, styles.actionsCell]}>
                                                                <TouchableOpacity
                                                                    style={styles.actionButton}
                                                                    onPress={() => handleEditDevice(device)}
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
        position: 'relative',
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    backButton: {
        position: 'absolute',
        top: 20,
        left: 20,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: PRIMARY_GREEN,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: PRIMARY_GREEN,
        zIndex: 10,
        shadowColor: PRIMARY_GREEN,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 6,
        ...Platform.select({
            web: {
                cursor: 'pointer',
                transitionDuration: '0.2s',
                transitionProperty: 'background-color, border-color, color',
                ':hover': {
                    backgroundColor: BUTTON_HOVER_COLOR,
                    borderColor: BUTTON_HOVER_COLOR,
                },
            },
        }),
    },
    backButtonText: {
        color: WHITE,
        fontSize: 15,
        fontWeight: '700',
        marginLeft: 8,
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
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 10,
        flexWrap: 'wrap',
    },
    searchInputContainer: {
        flex: IS_LARGE_SCREEN ? 0.6 : 1,
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
                outlineStyle: 'none',
            },
        }),
    },
    inputIcon: {
        marginRight: 10,
    },
    filterButtonsContainer: {
        flexDirection: 'row',
        gap: 8,
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
    errorText: {
        color: ERROR_RED,
        textAlign: 'center',
        marginBottom: 15,
        fontSize: 14,
        fontWeight: '500',
    },
    loadingIndicator: {
        marginTop: 50,
    },
    noDevicesText: {
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
        height: 500, // Ajusta la altura según necesites
        overflow: 'hidden',
    },
    tableScrollViewContent: {
        flexGrow: 1,
        justifyContent: 'flex-start',
    },
    table: {
        flex: 1,
        width: IS_LARGE_SCREEN ? '100%' : 700, // Ajusta el ancho si es necesario para pantallas pequeñas
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
        flex: 1,
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
    estadoCell: {
        flex: IS_LARGE_SCREEN ? 0.5 : 0.7,
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