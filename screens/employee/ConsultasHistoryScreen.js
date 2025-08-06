import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    Platform,
    Dimensions,
    SafeAreaView,
    KeyboardAvoidingView,
    Image,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';

import Config from '../../config/config';

const API_URL = Config.API_BASE_URL;
const IMAGE_BASE_URL = `${API_URL.replace("/api", "")}/images/residents/`;

const PRIMARY_GREEN = '#6BB240';
const LIGHT_GREEN = '#9CD275';
const ACCENT_GREEN_BACKGROUND = '#EEF7E8';
const DARK_GRAY = '#2C3E50';
const MEDIUM_GRAY = '#5D6D7E';
const LIGHT_GRAY = '#85929E';
const VERY_LIGHT_GRAY = '#F8F9FA';
const WHITE = '#FFFFFF';
const ERROR_RED = '#E74C3C';
const WARNING_ORANGE = '#F39C12';
const SUCCESS_GREEN = '#27AE60';
const CARD_SHADOW = '#BDC3C7';

const { width } = Dimensions.get('window');
const IS_LARGE_SCREEN = width > 768;

const normalizeString = (str) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

const getColorFC = (fc) => (fc > 100 || fc < 60 ? ERROR_RED : SUCCESS_GREEN);
const getColorO2 = (o2) => (o2 < 95 ? WARNING_ORANGE : SUCCESS_GREEN);
const getColorTemp = (temp) => (temp > 37.5 ? ERROR_RED : SUCCESS_GREEN);

const ConsultasHistory = () => {
    const navigation = useNavigation();
    const [searchName, setSearchName] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [consultas, setConsultas] = useState([]);
    const [residentsDataMap, setResidentsDataMap] = useState({});
    const [employeesDataMap, setEmployeesDataMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const fetchAllData = useCallback(async () => {
        try {
            setError(null);
            const consultasResponse = await fetch(`${API_URL}/ChequeoSemanal`);
            if (!consultasResponse.ok) {
                throw new Error(`Error al cargar consultas: ${consultasResponse.status}`);
            }
            const consultasData = await consultasResponse.json();
            setConsultas(consultasData);

            if (consultasData.length > 0) {
                const uniqueResidentIds = [...new Set(consultasData.map(c => c.residenteId).filter(id => id != null))];
                const uniqueEmployeeIds = [...new Set(consultasData.map(c => c.personalId).filter(id => id != null))];

                const residentsPromises = uniqueResidentIds.map(async (id) => {
                    try {
                        const response = await fetch(`${API_URL}/Residente/${id}`);
                        if (response.ok) {
                            const data = await response.json();
                            return { id, data: data.residente };
                        }
                    } catch (err) {
                        console.warn(`Error loading resident ${id}:`, err);
                    }
                    return { id, data: null };
                });

                const employeesPromises = uniqueEmployeeIds.map(async (id) => {
                    try {
                        const response = await fetch(`${API_URL}/Personal/${id}`);
                        if (response.ok) {
                            const data = await response.json();
                            return { id, data: data.personal };
                        }
                    } catch (err) {
                        console.warn(`Error loading employee ${id}:`, err);
                    }
                    return { id, data: null };
                });

                const [residentsResults, employeesResults] = await Promise.all([
                    Promise.all(residentsPromises),
                    Promise.all(employeesPromises)
                ]);

                const newResidentsMap = {};
                residentsResults.forEach(({ id, data }) => {
                    if (data) {
                        newResidentsMap[id] = {
                            nombre: data.nombre,
                            apellido: data.apellido,
                            foto: data.foto,
                        };
                    }
                });

                const newEmployeesMap = {};
                employeesResults.forEach(({ id, data }) => {
                    if (data) {
                        newEmployeesMap[id] = {
                            nombre: data.nombre,
                            apellido: data.apellido,
                        };
                    }
                });

                setResidentsDataMap(newResidentsMap);
                setEmployeesDataMap(newEmployeesMap);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            setError(error.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchAllData();
            return () => {
                // Opcional: limpiar si es necesario al desenfocar
            };
        }, [fetchAllData])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchAllData();
    }, [fetchAllData]);

    const handleDateChange = (event, selectedDateValue) => {
        if (event.type === 'set') {
            setSelectedDate(selectedDateValue.toISOString().split('T')[0]);
        }
        setShowDatePicker(false);
    };

    const filteredConsultas = useMemo(() => {
        const normalizedSearchName = normalizeString(searchName);

        const sortedConsultas = [...consultas].sort((a, b) => {
            return new Date(b.fechaChequeo) - new Date(a.fechaChequeo);
        });

        return sortedConsultas.filter((c) => {
            const residentInfo = residentsDataMap[c.residenteId];
            let residentFullName = '';
            if (residentInfo) {
                residentFullName = `${residentInfo.nombre || ''} ${residentInfo.apellido || ''}`.trim();
            } else {
                residentFullName = `Residente ${c.residenteId}`;
            }

            const normalizedResidentNameStr = normalizeString(residentFullName);
            const nameMatch = normalizedResidentNameStr.includes(normalizedSearchName);

            const dateMatch = selectedDate
                ? new Date(c.fechaChequeo).toDateString() === new Date(selectedDate).toDateString()
                : true;

            return nameMatch && dateMatch;
        });
    }, [searchName, selectedDate, consultas, residentsDataMap]);

    const handleResidentNameClick = (residentId) => {
        navigation.navigate('Residents', {
            screen: 'ResidentProfile',
            params: { residentId: residentId }
        });
    };

    const clearFilters = () => {
        setSearchName('');
        setSelectedDate('');
    };

    const renderConsultaCard = ({ item }) => {
        const residentInfo = residentsDataMap[item.residenteId];
        let residentName = `Residente ${item.residenteId}`;
        let residentPhoto = null;

        if (residentInfo) {
            residentName = `${residentInfo.nombre || ''} ${residentInfo.apellido || ''}`.trim();
            if (residentInfo.foto && residentInfo.foto !== "default") {
                residentPhoto = `${IMAGE_BASE_URL}${residentInfo.foto}`;
            } else {
                residentPhoto = `https://ui-avatars.com/api/?name=${encodeURIComponent(residentName)}&background=6BB240&color=fff&size=128&rounded=true`;
            }
        } else {
            residentPhoto = `https://ui-avatars.com/api/?name=${encodeURIComponent(residentName)}&background=6BB240&color=fff&size=128&rounded=true`;
        }

        const employeeInfo = employeesDataMap[item.personalId];
        let employeeName = 'Personal no identificado';
        if (employeeInfo) {
            employeeName = `${employeeInfo.nombre || ''} ${employeeInfo.apellido || ''}`.trim();
        }

        return (
            <View style={styles.cardContainer}>
                <View style={styles.cardHeader}>
                    <TouchableOpacity
                        onPress={() => handleResidentNameClick(item.residenteId)}
                        style={styles.residentInfo}
                        activeOpacity={0.7}
                    >
                        <Image source={{ uri: residentPhoto }} style={styles.residentPhoto} />
                        <View style={styles.residentDetails}>
                            <Text style={styles.residentName}>{residentName}</Text>
                            <Text style={styles.residentId}>ID: {item.residenteId}</Text>
                        </View>
                    </TouchableOpacity>
                    <View style={styles.dateContainerCard}>
                        <Text style={styles.dateText}>
                            {new Date(item.fechaChequeo).toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                            })}
                        </Text>
                    </View>
                </View>

                <View style={styles.employeeSection}>
                    <Ionicons name="person-circle-outline" size={16} color={MEDIUM_GRAY} />
                    <Text style={styles.employeeText}>Realizado por: {employeeName}</Text>
                </View>

                <View style={styles.vitalsGrid}>
                    <View style={[styles.vitalCard, { borderLeftColor: getColorFC(item.pulso) }]}>
                        <Ionicons name="heart" size={18} color={getColorFC(item.pulso)} />
                        <Text style={styles.vitalLabel}>Pulso</Text>
                        <Text style={[styles.vitalValue, { color: getColorFC(item.pulso) }]}>
                            {item.pulso} bpm
                        </Text>
                    </View>

                    <View style={[styles.vitalCard, { borderLeftColor: getColorO2(item.spo2) }]}>
                        <Ionicons name="water" size={18} color={getColorO2(item.spo2)} />
                        <Text style={styles.vitalLabel}>SpO₂</Text>
                        <Text style={[styles.vitalValue, { color: getColorO2(item.spo2) }]}>
                            {item.spo2}%
                        </Text>
                    </View>

                    <View style={[styles.vitalCard, { borderLeftColor: getColorTemp(item.temperaturaCorporal) }]}>
                        <Ionicons name="thermometer" size={18} color={getColorTemp(item.temperaturaCorporal)} />
                        <Text style={styles.vitalLabel}>Temperatura</Text>
                        <Text style={[styles.vitalValue, { color: getColorTemp(item.temperaturaCorporal) }]}>
                            {item.temperaturaCorporal}°C
                        </Text>
                    </View>

                    <View style={[styles.vitalCard, { borderLeftColor: MEDIUM_GRAY }]}>
                        <Ionicons name="scale" size={18} color={MEDIUM_GRAY} />
                        <Text style={styles.vitalLabel}>Peso</Text>
                        <Text style={styles.vitalValue}>{item.peso} kg</Text>
                    </View>

                    <View style={[styles.vitalCard, { borderLeftColor: MEDIUM_GRAY }]}>
                        <Ionicons name="resize" size={18} color={MEDIUM_GRAY} />
                        <Text style={styles.vitalLabel}>Altura</Text>
                        <Text style={styles.vitalValue}>{item.altura} cm</Text>
                    </View>

                    <View style={[styles.vitalCard, { borderLeftColor: MEDIUM_GRAY }]}>
                        <Ionicons name="calculator" size={18} color={MEDIUM_GRAY} />
                        <Text style={styles.vitalLabel}>IMC</Text>
                        <Text style={styles.vitalValue}>{item.imc?.toFixed(1) || 'N/A'}</Text>
                    </View>
                </View>

                {item.observaciones && (
                    <View style={styles.notesSection}>
                        <Ionicons name="document-text" size={16} color={MEDIUM_GRAY} />
                        <Text style={styles.notesText}>{item.observaciones}</Text>
                    </View>
                )}
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={PRIMARY_GREEN} />
                <Text style={styles.loadingText}>Cargando historial de consultas...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={60} color={ERROR_RED} />
                <Text style={styles.errorTitle}>Error al cargar datos</Text>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchAllData}>
                    <Text style={styles.retryButtonText}>Reintentar</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.filtersContainer}>
                    <View style={styles.searchAndDateRow}>
                        <View style={styles.searchContainer}>
                            <Ionicons name="search" size={20} color={MEDIUM_GRAY} style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Buscar por nombre del residente..."
                                placeholderTextColor={LIGHT_GRAY}
                                value={searchName}
                                onChangeText={setSearchName}
                                autoCorrect={false}
                                autoCapitalize="words"
                            />
                            {searchName.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchName('')} style={styles.clearButton}>
                                    <Ionicons name="close-circle" size={20} color={LIGHT_GRAY} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {Platform.OS === 'web' ? (
                            <View style={styles.dateFilterContainer}>
                                <Ionicons name="calendar" size={20} color={MEDIUM_GRAY} style={styles.dateIcon} />
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    style={styles.dateInputWeb}
                                />
                                {selectedDate.length > 0 && (
                                    <TouchableOpacity onPress={() => setSelectedDate('')} style={styles.clearButton}>
                                        <Ionicons name="close-circle" size={20} color={LIGHT_GRAY} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        ) : (
                            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateFilterContainer}>
                                <Ionicons name="calendar" size={20} color={MEDIUM_GRAY} style={styles.dateIcon} />
                                <Text style={styles.dateInputText}>
                                    {selectedDate ? new Date(selectedDate).toLocaleDateString('es-ES') : "Fecha (DD/MM/YYYY)"}
                                </Text>
                                {selectedDate.length > 0 && (
                                    <TouchableOpacity onPress={() => setSelectedDate('')} style={styles.clearButton}>
                                        <Ionicons name="close-circle" size={20} color={LIGHT_GRAY} />
                                    </TouchableOpacity>
                                )}
                            </TouchableOpacity>
                        )}


                        {showDatePicker && (
                            <DateTimePicker
                                testID="dateTimePicker"
                                value={selectedDate ? new Date(selectedDate) : new Date()}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={handleDateChange}
                            />
                        )}
                    </View>

                    {(searchName || selectedDate) ? (
                        <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
                            <Text style={styles.clearFiltersText}>Limpiar filtros</Text>
                        </TouchableOpacity>
                    ) : (
                        <Text style={styles.headerSubtitle}>
                            {filteredConsultas.length} consulta{filteredConsultas.length !== 1 ? 's' : ''} encontrada{filteredConsultas.length !== 1 ? 's' : ''}
                        </Text>
                    )}
                </View>

                <FlatList
                    data={filteredConsultas}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderConsultaCard}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[PRIMARY_GREEN]}
                            tintColor={PRIMARY_GREEN}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="document-text-outline" size={80} color={LIGHT_GRAY} />
                            <Text style={styles.emptyTitle}>No hay consultas</Text>
                            <Text style={styles.emptyText}>
                                {searchName || selectedDate
                                    ? 'No se encontraron consultas con los filtros aplicados'
                                    : 'Aún no hay consultas registradas'
                                }
                            </Text>
                        </View>
                    }
                />
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: VERY_LIGHT_GRAY,
        marginTop: IS_LARGE_SCREEN ? 0 : 30,

    },
    keyboardView: {
        flex: 1,
    },
    headerSubtitle: {
        fontSize: 14,
        color: MEDIUM_GRAY,
        marginTop: 8,
        paddingHorizontal: 16,
    },
    filtersContainer: {
        backgroundColor: WHITE,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: VERY_LIGHT_GRAY,
        gap: 12,
        ...Platform.select({
            ios: {
                marginTop: 60,
            },
            android: {
                marginTop: 60,
            },
            default: {
                marginTop: 0,
            },
        }),
    },
    searchAndDateRow: {
        alignItems: 'center',
        gap: 12,
        ...Platform.select({
            ios: {
                flexDirection: 'column',
                width: '100%',
            },
            android: {
                flexDirection: 'column',
                width: '100%',
            },
            web: {
                flexDirection: 'row',
                justifyContent: 'space-between',
            },
        }),
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: VERY_LIGHT_GRAY,
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 48,
        minWidth: 200,
        ...Platform.select({
            web: {
                flex: 2,
                maxWidth: '60%',
            },
            ios: {
                width: '100%',
            },
            android: {
                width: '100%',
            }
        }),
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: DARK_GRAY,
        ...Platform.select({
            web: { outlineStyle: 'none' },
        }),
    },
    dateFilterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: VERY_LIGHT_GRAY,
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 48,
        ...Platform.select({
            web: {
                width: 180,
                flexShrink: 0,
                flex: 1,
            },
            ios: {
                width: '100%',
            },
            android: {
                width: '100%',
            }
        })
    },
    dateIcon: {
        marginRight: 12,
    },
    dateInputText: {
        flex: 1,
        fontSize: 16,
        color: DARK_GRAY,
    },
    dateInputWeb: {
        flex: 1,
        fontSize: 16,
        color: DARK_GRAY,
        backgroundColor: 'transparent',
        border: 'none',
        paddingVertical: 0,
        paddingHorizontal: 0,
        cursor: 'pointer',
        fontFamily: Platform.select({ web: 'sans-serif', default: undefined }),
        ...Platform.select({
            web: { outlineStyle: 'none' },
        }),
    },
    clearButton: {
        padding: 4,
    },
    clearFiltersButton: {
        alignSelf: 'flex-start',
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: ACCENT_GREEN_BACKGROUND,
        borderRadius: 20,
    },
    clearFiltersText: {
        color: PRIMARY_GREEN,
        fontSize: 14,
        fontWeight: '600',
    },
    listContainer: {
        padding: 16,
        paddingBottom: 32,
    },
    cardContainer: {
        backgroundColor: WHITE,
        borderRadius: 16,
        marginBottom: 16,
        padding: 15,
        shadowColor: CARD_SHADOW,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        ...Platform.select({
            web: {
                width: '90%',
                alignSelf: 'center',
                marginHorizontal: 'auto',
            },
        }),
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: VERY_LIGHT_GRAY,
    },
    residentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    residentPhoto: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
        backgroundColor: ACCENT_GREEN_BACKGROUND,
    },
    residentDetails: {
        flex: 1,
    },
    residentName: {
        fontSize: 17,
        fontWeight: '700',
        color: DARK_GRAY,
        marginBottom: 2,
    },
    residentId: {
        fontSize: 13,
        color: MEDIUM_GRAY,
    },
    dateContainerCard: {
        backgroundColor: ACCENT_GREEN_BACKGROUND,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    dateText: {
        fontSize: 11,
        fontWeight: '600',
        color: PRIMARY_GREEN,
    },
    employeeSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        paddingHorizontal: 4,
    },
    employeeText: {
        fontSize: 13,
        color: MEDIUM_GRAY,
        marginLeft: 8,
        fontStyle: 'italic',
    },
    vitalsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 10,
        justifyContent: 'space-around',
    },
    vitalCard: {
        backgroundColor: VERY_LIGHT_GRAY,
        borderRadius: 12,
        padding: 10,
        width: IS_LARGE_SCREEN ? '30%' : '48%',
        borderLeftWidth: 4,
        alignItems: 'center',
        minHeight: 70,
        justifyContent: 'center',
    },
    vitalLabel: {
        fontSize: 11,
        color: MEDIUM_GRAY,
        marginTop: 4,
        marginBottom: 2,
        textAlign: 'center',
    },
    vitalValue: {
        fontSize: 15,
        fontWeight: '700',
        color: DARK_GRAY,
        textAlign: 'center',
    },
    notesSection: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: VERY_LIGHT_GRAY,
        padding: 12,
        borderRadius: 12,
        marginTop: 4,
    },
    notesText: {
        fontSize: 13,
        color: DARK_GRAY,
        marginLeft: 10,
        flex: 1,
        lineHeight: 18,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: VERY_LIGHT_GRAY,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: MEDIUM_GRAY,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: VERY_LIGHT_GRAY,
        padding: 32,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: ERROR_RED,
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    errorText: {
        fontSize: 16,
        color: MEDIUM_GRAY,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    retryButton: {
        backgroundColor: PRIMARY_GREEN,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    retryButtonText: {
        color: WHITE,
        fontSize: 16,
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 80,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: MEDIUM_GRAY,
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 16,
        color: LIGHT_GRAY,
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 32,
    },
});

export default ConsultasHistory;