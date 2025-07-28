import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Platform, TextInput, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Importaciones para PDF (si estás en web o un entorno que lo soporte)
// Estas librerías solo son para Web
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
// Esta librería es para Mobile (iOS/Android)
import RNHTMLtoPDF from 'react-native-html-to-pdf';


// --- Constantes de Estilo ---
const PRIMARY_GREEN = '#6BB240';
const LIGHT_GREEN = '#9CD275';
const ACCENT_GREEN_BACKGROUND = '#EEF7E8';
const DARK_GRAY = '#333';
const MEDIUM_GRAY = '#555';
const LIGHT_GRAY = '#888';
const VERY_LIGHT_GRAY = '#eee';
const BACKGROUND_LIGHT = '#fcfcfc';
const WHITE = '#fff';
const WARNING_ORANGE = '#fd7e14'; // For values slightly off
const DANGER_RED = '#DC3545'; // For values significantly off
const INFO_BLUE = '#0d6efd';

const { width } = Dimensions.get('window');
const IS_LARGE_SCREEN = width > 900; // Define si la pantalla es "grande" (ej. para web/tablet)

// --- Mapeo de Nombres de Residente (temporal, en una app real vendrían de otra API) ---
const residentNames = {
    "1": "Juan Pérez",
    "2": "María López",
    "3": "Carlos Ruiz",
    "4": "Ana Torres",
    // "8": "Residente Prueba 8" <-- Eliminado
};

const API_BASE_URL = 'http://localhost:5214/api'; // Tu URL base de la API

const CheckupReportsScreen = () => {
    // --- Refs para los componentes de reporte para la exportación a PDF (solo relevantes para web) ---
    const staffReportRef = useRef(null);
    const residentHistoryReportRef = useRef(null);
    const imcReportRef = useRef(null);

    // --- Estados para datos dinámicos ---
    const [chequeosSemanales, setChequeosSemanales] = useState([]);
    const [staffNames, setStaffNames] = useState({}); // Estado para nombres de personal
    const [loadingChequeos, setLoadingChequeos] = useState(true);
    const [loadingStaff, setLoadingStaff] = useState(true); // Inicialmente true, ya que ahora se carga al inicio
    const [error, setError] = useState(null);

    // --- Estados para filtros ---
    const [selectedResidentId, setSelectedResidentId] = useState(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // --- Fetching de datos de la API (Chequeos Semanales) ---
    useEffect(() => {
        const fetchChequeos = async () => {
            try {
                setLoadingChequeos(true);
                setError(null);
                const response = await fetch(`${API_BASE_URL}/ChequeoSemanal`, {
                    headers: {
                        'accept': 'text/plain'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setChequeosSemanales(data);
            } catch (err) {
                console.error("Error fetching chequeos semanales:", err);
                setError("No se pudieron cargar los datos de chequeos semanales.");
                Alert.alert("Error de Conexión", "No se pudieron cargar los datos de chequeos. Asegúrate de que la API de chequeos esté funcionando en " + API_BASE_URL);
            } finally {
                setLoadingChequeos(false);
            }
        };

        fetchChequeos();
    }, []); // Se ejecuta solo una vez al montar el componente

    // --- Fetching de Nombres de Personal (ahora desde el endpoint general) ---
    useEffect(() => {
        const fetchAllStaffNames = async () => {
            try {
                setLoadingStaff(true);
                const response = await fetch(`${API_BASE_URL}/Personal`, {
                    headers: {
                        'accept': '*/*'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();

                const newStaffNames = {};
                // Asegurarse de que 'personal' sea un array antes de mapear
                if (data && Array.isArray(data.personal)) {
                    data.personal.forEach(p => {
                        if (p.id && p.nombre && p.apellido) {
                            newStaffNames[p.id] = `${p.nombre} ${p.apellido}`;
                        }
                    });
                }
                setStaffNames(newStaffNames);
            } catch (err) {
                console.error("Error fetching all personal data:", err);
                setError("No se pudieron cargar los nombres del personal.");
                Alert.alert("Error de Conexión", "No se pudieron cargar los nombres del personal. Asegúrate de que la API de personal esté funcionando en " + API_BASE_URL);
            } finally {
                setLoadingStaff(false);
            }
        };

        fetchAllStaffNames();
    }, []); // Se ejecuta solo una vez al montar el componente

    // --- Lógica de Reportes usando useMemo para optimización ---

    // Reporte 1: Chequeos Completados por Personal
    const staffActivityReport = useMemo(() => {
        if (!chequeosSemanales.length) return [];

        const activity = {};
        const start = startDate ? new Date(startDate).getTime() : 0;
        const end = endDate ? new Date(endDate).getTime() : Date.now();

        chequeosSemanales.forEach(chequeo => {
            const chequeoDate = new Date(chequeo.fechaChequeo).getTime();
            if (chequeoDate >= start && chequeoDate <= end) {
                activity[chequeo.personalId] = (activity[chequeo.personalId] || 0) + 1;
            }
        });
        return Object.entries(activity).map(([personalId, count]) => ({
            personalId,
            name: staffNames[personalId] || `Personal ${personalId}`, // Usar nombres dinámicos
            count
        })).sort((a, b) => b.count - a.count); // Ordenar de mayor a menor
    }, [chequeosSemanales, startDate, endDate, staffNames]); // Añadir staffNames a las dependencias

    // Reporte 2: Historial de Chequeos Semanales por Residente
    const residentCheckupHistory = useMemo(() => {
        if (!selectedResidentId || !chequeosSemanales.length) return { history: [], chartData: null };

        const history = chequeosSemanales
            .filter(chequeo => String(chequeo.residenteId) === String(selectedResidentId))
            .sort((a, b) => new Date(a.fechaChequeo) - new Date(b.fechaChequeo)); // Ordenar por fecha ascendente

        if (history.length === 0) return { history: [], chartData: null };

        // Preparar datos para gráficos
        const labels = history.map(h => new Date(h.fechaChequeo).toLocaleDateString());
        const spo2Data = history.map(h => h.spo2);
        const pulsoData = history.map(h => h.pulso);
        const tempCorpData = history.map(h => h.temperaturaCorporal);
        const pesoData = history.map(h => h.peso);
        const imcData = history.map(h => h.imc);

        return {
            history,
            chartData: {
                labels,
                spo2Data,
                pulsoData,
                tempCorpData,
                pesoData,
                imcData
            }
        };
    }, [chequeosSemanales, selectedResidentId]);

    // Reporte 3: Resumen de IMC por Residente
    const imcSummaryReport = useMemo(() => {
        if (!chequeosSemanales.length) return [];

        const latestCheckups = {};

        // Encontrar el chequeo más reciente para cada residente
        chequeosSemanales.forEach(chequeo => {
            const currentLatest = latestCheckups[chequeo.residenteId];
            if (!currentLatest || new Date(chequeo.fechaChequeo) > new Date(currentLatest.fechaChequeo)) {
                latestCheckups[chequeo.residenteId] = chequeo;
            }
        });

        const imcReport = Object.values(latestCheckups).map(chequeo => {
            let classification = '';
            // Rangos de IMC estándar de la OMS
            if (chequeo.imc < 18.5) {
                classification = 'Bajo Peso';
            } else if (chequeo.imc >= 18.5 && chequeo.imc < 24.9) {
                classification = 'Normal';
            } else if (chequeo.imc >= 25 && chequeo.imc < 29.9) {
                classification = 'Sobrepeso';
            } else {
                classification = 'Obesidad';
            }
            return {
                residenteId: chequeo.residenteId,
                residenteName: residentNames[chequeo.residenteId] || `Residente ${chequeo.residenteId}`,
                imc: chequeo.imc?.toFixed(2) || 'N/A', // Manejar IMC nulo o indefinido
                classification,
                fechaChequeo: new Date(chequeo.fechaChequeo).toLocaleDateString()
            };
        }).sort((a, b) => a.residenteName.localeCompare(b.residenteName)); // Ordenar por nombre de residente

        return imcReport;
    }, [chequeosSemanales]);

    // Función para determinar el color de la clasificación IMC
    const getIMCColor = useCallback((classification) => {
        switch (classification) {
            case 'Bajo Peso':
                return WARNING_ORANGE;
            case 'Normal':
                return PRIMARY_GREEN;
            case 'Sobrepeso':
                return WARNING_ORANGE;
            case 'Obesidad':
                return DANGER_RED;
            default:
                return MEDIUM_GRAY;
        }
    }, []);

    // Obtener una lista única de residentes para el selector
    const uniqueResidentIds = useMemo(() => {
        const ids = new Set(chequeosSemanales.map(c => String(c.residenteId)));
        // Solo incluir IDs que tienen un nombre definido en residentNames
        return Array.from(ids)
            .filter(id => residentNames[id]) // Filtra para solo incluir residentes que tienen un nombre
            .sort((a, b) => {
                const nameA = residentNames[a] || `Residente ${a}`;
                const nameB = residentNames[b] || `Residente ${b}`;
                return nameA.localeCompare(nameB);
            });
    }, [chequeosSemanales]);


    // --- Funciones para exportar a PDF ---

    // Helper para generar HTML de los reportes para mobile
    const generateStaffReportHtml = useCallback(() => {
        let html = `
            <h1>Reporte de Chequeos Completados por Personal</h1>
            <table style="width:100%; border-collapse: collapse;">
                <thead>
                    <tr style="background-color:#f2f2f2;">
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Personal</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Chequeos</th>
                    </tr>
                </thead>
                <tbody>
        `;
        staffActivityReport.forEach(item => {
            html += `
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;">${item.name}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${item.count}</td>
                </tr>
            `;
        });
        html += `
                </tbody>
            </table>
        `;
        return html;
    }, [staffActivityReport]);

    const generateResidentHistoryHtml = useCallback(() => {
        if (!selectedResidentId || !residentCheckupHistory.history.length) return '';

        const residentName = residentNames[selectedResidentId] || `Residente ${selectedResidentId}`;
        let html = `
            <h1>Historial de Chequeos Semanales para ${residentName}</h1>
            <table style="width:100%; border-collapse: collapse;">
                <thead>
                    <tr style="background-color:#f2f2f2;">
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Fecha</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">SpO2 (%)</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Pulso (bpm)</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Temp (°C)</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Peso (kg)</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Altura (cm)</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">IMC</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Observaciones</th>
                    </tr>
                </thead>
                <tbody>
        `;
        residentCheckupHistory.history.forEach(record => {
            html += `
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;">${new Date(record.fechaChequeo).toLocaleDateString()}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${record.spo2}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${record.pulso}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${record.temperaturaCorporal}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${record.peso}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${record.altura}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${record.imc?.toFixed(2) || 'N/A'}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${record.observaciones || 'Sin observaciones.'}</td>
                </tr>
            `;
        });
        html += `
                </tbody>
            </table>
        `;
        return html;
    }, [selectedResidentId, residentCheckupHistory]);

    const generateImcReportHtml = useCallback(() => {
        let html = `
            <h1>Resumen de IMC por Residente</h1>
            <table style="width:100%; border-collapse: collapse;">
                <thead>
                    <tr style="background-color:#f2f2f2;">
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Residente</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">IMC</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Clasificación</th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Último Chequeo</th>
                    </tr>
                </thead>
                <tbody>
        `;
        imcSummaryReport.forEach(item => {
            const imcColor = getIMCColor(item.classification);
            html += `
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;">${item.residenteName}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${item.imc}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; color: ${imcColor}; font-weight: bold;">${item.classification}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${item.fechaChequeo}</td>
                </tr>
            `;
        });
        html += `
                </tbody>
            </table>
        `;
        return html;
    }, [imcSummaryReport, getIMCColor]);

    const exportReportToPdf = useCallback(async (reportRef, fileName, getHtmlContentFunction) => {
        if (Platform.OS === 'web') {
            if (reportRef.current) {
                try {
                    const canvas = await html2canvas(reportRef.current, {
                        scale: 2, // Aumentar la escala para mejor calidad
                        useCORS: true, // Importante si tienes imágenes de otros dominios
                        allowTaint: true, // Permite contenido de otros orígenes, pero puede tener implicaciones de seguridad
                    });
                    const imgData = canvas.toDataURL('image/png');
                    const pdf = new jsPDF('p', 'mm', 'a4');
                    const imgWidth = 210; // A4 width in mm
                    const pageHeight = 297; // A4 height in mm
                    const imgHeight = (canvas.height * imgWidth) / canvas.width;
                    let heightLeft = imgHeight;
                    let position = 0;

                    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                    heightLeft -= pageHeight;

                    while (heightLeft >= 0) {
                        position = heightLeft - imgHeight;
                        pdf.addPage();
                        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                        heightLeft -= pageHeight;
                    }
                    pdf.save(`${fileName}.pdf`);
                } catch (error) {
                    console.error("Error al generar PDF en web:", error);
                    Alert.alert("Error al Exportar (Web)", "No se pudo generar el PDF. Asegúrate de que todo el contenido esté renderizado correctamente. " + error.message);
                }
            } else {
                Alert.alert("Error al Exportar (Web)", "El contenido del reporte no está disponible para exportar.");
            }
        } else { // Mobile (iOS/Android)
            try {
                const htmlContent = getHtmlContentFunction();
                if (!htmlContent) {
                    Alert.alert("Error al Exportar (Móvil)", "No hay datos para generar el PDF.");
                    return;
                }
                const options = {
                    html: `
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <meta charset="utf-8">
                            <title>${fileName}</title>
                            <style>
                                body { font-family: sans-serif; margin: 20px; }
                                h1 { color: ${PRIMARY_GREEN}; text-align: center; margin-bottom: 20px; }
                                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                                th, td { padding: 8px; border: 1px solid #ddd; text-align: left; }
                                th { background-color: #f2f2f2; }
                                .warning { color: ${WARNING_ORANGE}; font-weight: bold; }
                                .danger { color: ${DANGER_RED}; font-weight: bold; }
                                .normal { color: ${PRIMARY_GREEN}; font-weight: bold; }
                            </style>
                        </head>
                        <body>
                            ${htmlContent}
                        </body>
                        </html>
                    `,
                    fileName: fileName,
                    directory: 'Download', // Esto intentará guardar en la carpeta de Descargas del dispositivo
                    base64: false, // No necesitamos la representación base64
                };

                const file = await RNHTMLtoPDF.convert(options);
                if (file && file.filePath) {
                    Alert.alert("PDF Guardado", `El PDF se ha guardado en: ${file.filePath}`);
                    // En iOS, el archivo se abre o se ofrece para compartir automáticamente.
                    // En Android, se guarda en el directorio especificado.
                } else {
                    Alert.alert("Error", "No se pudo obtener la ruta del archivo PDF.");
                }
            } catch (error) {
                console.error("Error al generar PDF en móvil:", error);
                Alert.alert("Error al Exportar (Móvil)", `No se pudo generar el PDF: ${error.message}. Asegúrate de que la librería esté correctamente instalada y vinculada.`);
            }
        }
    }, [generateStaffReportHtml, generateResidentHistoryHtml, generateImcReportHtml, getIMCColor, staffActivityReport, residentCheckupHistory, imcSummaryReport, selectedResidentId, residentNames]);


    // --- Renderizado Condicional ---
    const overallLoading = loadingChequeos || loadingStaff;

    if (overallLoading) {
        return (
            <View style={styles.centeredContainer}>
                <ActivityIndicator size="large" color={PRIMARY_GREEN} />
                <Text style={styles.loadingText}>Cargando datos de chequeos y personal...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centeredContainer}>
                <Ionicons name="alert-circle-outline" size={50} color={DANGER_RED} />
                <Text style={styles.errorText}>{error}</Text>
                <Text style={styles.errorDetail}>Por favor, revisa tu conexión y asegúrate de que la API esté activa.</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.header}>Reportes de Chequeos</Text>

            {/* Sección de Filtros Globales (para actividad del personal) */}
            <View style={styles.filterSection}>
                <Text style={styles.filterTitle}>Filtrar Actividad del Personal por Fecha:</Text>
                <View style={styles.dateInputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Fecha Inicio (YYYY-MM-DD)"
                        value={startDate}
                        onChangeText={setStartDate}
                        keyboardType={Platform.OS === 'web' ? 'default' : 'numeric'}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Fecha Fin (YYYY-MM-DD)"
                        value={endDate}
                        onChangeText={setEndDate}
                        keyboardType={Platform.OS === 'web' ? 'default' : 'numeric'}
                    />
                </View>
            </View>


            {/* --- Reporte 1: Chequeos Completados por Personal --- */}
            <View style={styles.reportSection}>
                <Text style={styles.reportTitle}>Chequeos Completados por Personal</Text>
                {staffActivityReport.length > 0 ? (
                    // El contenido del reporte que queremos exportar
                    <View ref={staffReportRef}>
                        {staffActivityReport.map(item => (
                            <View key={item.personalId} style={styles.staffActivityItem}>
                                <Text style={styles.staffName}>{item.name}</Text>
                                <Text style={styles.staffCount}>{item.count} chequeos</Text>
                            </View>
                        ))}
                    </View>
                ) : (
                    <Text style={styles.noDataText}>No hay datos de chequeos en el período seleccionado.</Text>
                )}
                {staffActivityReport.length > 0 && (
                    <TouchableOpacity
                        style={styles.exportButton}
                        onPress={() => exportReportToPdf(staffReportRef, 'Reporte_Actividad_Personal', generateStaffReportHtml)}
                    >
                        <Ionicons name="download-outline" size={20} color={WHITE} />
                        <Text style={styles.exportButtonText}>Exportar a PDF</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* --- Reporte 2: Historial de Chequeos Semanales por Residente --- */}
            <View style={styles.reportSection}>
                <Text style={styles.reportTitle}>Historial de Chequeos Semanales por Residente</Text>
                <Text style={styles.filterTitle}>Seleccionar Residente:</Text>
                <View style={styles.residentPickerContainer}>
                    {uniqueResidentIds.length > 0 ? (
                        uniqueResidentIds.map(resId => (
                            <TouchableOpacity
                                key={resId}
                                style={[
                                    styles.residentPickerItem,
                                    selectedResidentId === resId && styles.residentPickerItemSelected
                                ]}
                                onPress={() => setSelectedResidentId(resId)}
                            >
                                <Text style={[
                                    styles.residentPickerItemText,
                                    selectedResidentId === resId && styles.residentPickerItemSelectedText
                                ]}>
                                    {residentNames[resId] || `Residente ${resId}`}
                                </Text>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <Text style={styles.noDataText}>No hay residentes con chequeos disponibles.</Text>
                    )}
                </View>

                {selectedResidentId && residentCheckupHistory.history.length > 0 ? (
                    <View>
                        {/* El contenido del reporte que queremos exportar */}
                        <View ref={residentHistoryReportRef}>
                            <Text style={styles.subTitle}>Historial para {residentNames[selectedResidentId] || `Residente ${selectedResidentId}`}:</Text>
                            <View style={styles.chartPlaceholder}>
                                <Text style={styles.chartPlaceholderText}>
                                    Gráfico de Tendencias (spo2, pulso, temperaturaCorporal, peso, imc)
                                </Text>
                                <Text style={styles.chartPlaceholderSubText}>
                                    Últimos valores: SpO2 {residentCheckupHistory.chartData.spo2Data.slice(-1)[0]}%, Pulso {residentCheckupHistory.chartData.pulsoData.slice(-1)[0]} bpm, Temp {residentCheckupHistory.chartData.tempCorpData.slice(-1)[0]}°C
                                </Text>
                            </View>

                            {residentCheckupHistory.history.map((record, index) => (
                                <View key={record.id || index} style={styles.historyItem}>
                                    <Text style={styles.historyDate}>Fecha: {new Date(record.fechaChequeo).toLocaleDateString()} {new Date(record.fechaChequeo).toLocaleTimeString()}</Text>
                                    <Text style={styles.historyDetail}>SpO2: {record.spo2}%</Text>
                                    <Text style={styles.historyDetail}>Pulso: {record.pulso} bpm</Text>
                                    <Text style={styles.historyDetail}>Temp: {record.temperaturaCorporal}°C</Text>
                                    <Text style={styles.historyDetail}>Peso: {record.peso} kg</Text>
                                    <Text style={styles.historyDetail}>Altura: {record.altura} cm</Text>
                                    <Text style={styles.historyDetail}>IMC: {record.imc?.toFixed(2) || 'N/A'}</Text>
                                    <Text style={styles.historyObservation}>Obs: {record.observaciones || 'Sin observaciones.'}</Text>
                                </View>
                            ))}
                        </View>
                        <TouchableOpacity
                            style={styles.exportButton}
                            onPress={() => exportReportToPdf(residentHistoryReportRef, `Historial_${residentNames[selectedResidentId] || `Residente_${selectedResidentId}`}`, generateResidentHistoryHtml)}
                        >
                            <Ionicons name="download-outline" size={20} color={WHITE} />
                            <Text style={styles.exportButtonText}>Exportar a PDF</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <Text style={styles.noDataText}>Selecciona un residente para ver su historial.</Text>
                )}
            </View>

            {/* --- Reporte 3: Resumen de IMC por Residente --- */}
            <View style={styles.reportSection}>
                <Text style={styles.reportTitle}>Resumen de IMC por Residente</Text>
                {imcSummaryReport.length > 0 ? (
                    // El contenido del reporte que queremos exportar
                    <View ref={imcReportRef}>
                        {imcSummaryReport.map(item => (
                            <View key={item.residenteId} style={styles.imcItem}>
                                <Text style={styles.imcResidenteName}>{item.residenteName}</Text>
                                <View style={styles.imcDetails}>
                                    <Text style={styles.imcValue}>IMC: {item.imc}</Text>
                                    <Text style={[styles.imcClassification, { color: getIMCColor(item.classification) }]}>
                                        {item.classification}
                                    </Text>
                                </View>
                                <Text style={styles.imcDate}>Último chequeo: {item.fechaChequeo}</Text>
                            </View>
                        ))}
                    </View>
                ) : (
                    <Text style={styles.noDataText}>No hay datos de IMC para mostrar.</Text>
                )}
                {imcSummaryReport.length > 0 && (
                    <TouchableOpacity
                        style={styles.exportButton}
                        onPress={() => exportReportToPdf(imcReportRef, 'Reporte_IMC_Residente', generateImcReportHtml)}
                    >
                        <Ionicons name="download-outline" size={20} color={WHITE} />
                        <Text style={styles.exportButtonText}>Exportar a PDF</Text>
                    </TouchableOpacity>
                )}
            </View>

            <View style={{ height: 50 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BACKGROUND_LIGHT,
        padding: IS_LARGE_SCREEN ? 30 : 20,
    },
    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: BACKGROUND_LIGHT,
    },
    loadingText: {
        marginTop: 15,
        fontSize: IS_LARGE_SCREEN ? 18 : 16,
        color: PRIMARY_GREEN,
    },
    errorText: {
        marginTop: 15,
        fontSize: IS_LARGE_SCREEN ? 18 : 16,
        color: DANGER_RED,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    errorDetail: {
        fontSize: IS_LARGE_SCREEN ? 14 : 12,
        color: MEDIUM_GRAY,
        textAlign: 'center',
        marginTop: 5,
    },
    header: {
        fontSize: IS_LARGE_SCREEN ? 32 : 24,
        fontWeight: '700',
        color: DARK_GRAY,
        marginBottom: IS_LARGE_SCREEN ? 30 : 20,
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    reportSection: {
        backgroundColor: WHITE,
        borderRadius: 12,
        padding: IS_LARGE_SCREEN ? 25 : 15,
        marginBottom: IS_LARGE_SCREEN ? 30 : 20,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: {
                elevation: 6,
            },
            web: {
                boxShadow: '0px 4px 15px rgba(0,0,0,0.08)',
            }
        }),
    },
    reportTitle: {
        fontSize: IS_LARGE_SCREEN ? 24 : 18,
        fontWeight: '600',
        color: PRIMARY_GREEN,
        marginBottom: IS_LARGE_SCREEN ? 20 : 15,
        borderBottomWidth: 1,
        borderBottomColor: VERY_LIGHT_GRAY,
        paddingBottom: IS_LARGE_SCREEN ? 12 : 10,
        textAlign: 'center',
    },
    noDataText: {
        color: LIGHT_GRAY,
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: 15,
        fontSize: IS_LARGE_SCREEN ? 16 : 14,
    },

    // --- Estilos para Filtros ---
    filterSection: {
        backgroundColor: WHITE,
        borderRadius: 12,
        padding: IS_LARGE_SCREEN ? 25 : 15,
        marginBottom: IS_LARGE_SCREEN ? 30 : 20,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: {
                elevation: 6,
            },
            web: {
                boxShadow: '0px 4px 15px rgba(0,0,0,0.08)',
            }
        }),
    },
    filterTitle: {
        fontSize: IS_LARGE_SCREEN ? 20 : 16,
        fontWeight: '500',
        color: DARK_GRAY,
        marginBottom: 10,
        textAlign: IS_LARGE_SCREEN ? 'left' : 'center',
    },
    dateInputContainer: {
        flexDirection: IS_LARGE_SCREEN ? 'row' : 'column',
        justifyContent: 'space-between',
        gap: IS_LARGE_SCREEN ? 15 : 10,
    },
    input: {
        flex: IS_LARGE_SCREEN ? 1 : undefined,
        height: 45,
        borderColor: LIGHT_GRAY,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        backgroundColor: VERY_LIGHT_GRAY,
        color: DARK_GRAY,
        fontSize: IS_LARGE_SCREEN ? 16 : 14,
        // Mejoras para web:
        outlineStyle: Platform.OS === 'web' ? 'none' : undefined,
        cursor: Platform.OS === 'web' ? 'text' : undefined,
        transition: Platform.OS === 'web' ? 'border-color 0.3s ease-in-out' : undefined,
        ':focus': Platform.OS === 'web' ? { borderColor: PRIMARY_GREEN } : undefined,
    },

    // --- Estilos para Reporte 1: Actividad del Personal ---
    staffActivityItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: ACCENT_GREEN_BACKGROUND,
        borderRadius: 10,
        padding: 15,
        marginBottom: 10,
        borderLeftWidth: 5,
        borderLeftColor: PRIMARY_GREEN,
        ...Platform.select({
            web: {
                transition: 'transform 0.2s ease-in-out',
                ':hover': { transform: 'scale(1.01)' },
            }
        }),
    },
    staffName: {
        fontSize: IS_LARGE_SCREEN ? 17 : 15,
        fontWeight: '600',
        color: DARK_GRAY,
    },
    staffCount: {
        fontSize: IS_LARGE_SCREEN ? 16 : 14,
        color: MEDIUM_GRAY,
        fontWeight: 'bold',
    },

    // --- Estilos para Reporte 2: Historial por Residente ---
    residentPickerContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 15,
        gap: 10,
        justifyContent: IS_LARGE_SCREEN ? 'flex-start' : 'center',
    },
    residentPickerItem: {
        paddingVertical: IS_LARGE_SCREEN ? 10 : 8,
        paddingHorizontal: IS_LARGE_SCREEN ? 18 : 15,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: LIGHT_GREEN,
        backgroundColor: WHITE,
        transition: Platform.OS === 'web' ? 'background-color 0.2s ease-in-out, border-color 0.2s ease-in-out' : undefined,
        ':hover': Platform.OS === 'web' ? { backgroundColor: ACCENT_GREEN_BACKGROUND, borderColor: PRIMARY_GREEN } : undefined,
    },
    residentPickerItemSelected: {
        backgroundColor: PRIMARY_GREEN,
        borderColor: PRIMARY_GREEN,
    },
    residentPickerItemText: {
        color: PRIMARY_GREEN,
        fontSize: IS_LARGE_SCREEN ? 15 : 13,
        fontWeight: '500',
    },
    residentPickerItemSelectedText: {
        color: WHITE,
    },
    subTitle: {
        fontSize: IS_LARGE_SCREEN ? 20 : 16,
        fontWeight: '600',
        color: DARK_GRAY,
        marginTop: IS_LARGE_SCREEN ? 20 : 15,
        marginBottom: 15,
        textAlign: 'center',
    },
    chartPlaceholder: {
        backgroundColor: VERY_LIGHT_GRAY,
        minHeight: 250, // Ajustado para ser más flexible
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: LIGHT_GRAY,
        borderStyle: 'dashed',
        padding: 15, // Added padding
    },
    chartPlaceholderText: {
        fontSize: IS_LARGE_SCREEN ? 17 : 15,
        color: MEDIUM_GRAY,
        marginBottom: 10,
        fontWeight: 'bold',
    },
    chartPlaceholderSubText: {
        fontSize: IS_LARGE_SCREEN ? 14 : 12,
        color: MEDIUM_GRAY,
        textAlign: 'center',
        marginHorizontal: 10,
        lineHeight: 20,
    },
    historyItem: {
        backgroundColor: ACCENT_GREEN_BACKGROUND,
        borderRadius: 10,
        padding: 15,
        marginBottom: 10,
        borderLeftWidth: 5,
        borderLeftColor: LIGHT_GREEN,
        ...Platform.select({
            web: {
                transition: 'transform 0.2s ease-in-out',
                ':hover': { transform: 'scale(1.01)' },
            }
        }),
    },
    historyDate: {
        fontSize: IS_LARGE_SCREEN ? 15 : 14,
        fontWeight: 'bold',
        color: DARK_GRAY,
        marginBottom: 5,
    },
    historyDetail: {
        fontSize: IS_LARGE_SCREEN ? 14 : 13,
        color: MEDIUM_GRAY,
        marginBottom: 3,
    },
    historyObservation: {
        fontSize: IS_LARGE_SCREEN ? 14 : 13,
        color: DARK_GRAY,
        fontStyle: 'italic',
        marginTop: 8,
        borderTopWidth: 1,
        borderTopColor: VERY_LIGHT_GRAY,
        paddingTop: 8,
    },

    // --- Estilos para Reporte 3: Resumen de IMC ---
    imcItem: {
        backgroundColor: ACCENT_GREEN_BACKGROUND,
        borderRadius: 10,
        padding: 15,
        marginBottom: 10,
        borderLeftWidth: 5,
        borderLeftColor: LIGHT_GREEN,
        ...Platform.select({
            web: {
                transition: 'transform 0.2s ease-in-out',
                ':hover': { transform: 'scale(1.01)' },
            }
        }),
    },
    imcResidenteName: {
        fontSize: IS_LARGE_SCREEN ? 17 : 15,
        fontWeight: '600',
        color: DARK_GRAY,
        marginBottom: 5,
    },
    imcDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    imcValue: {
        fontSize: IS_LARGE_SCREEN ? 15 : 14,
        color: MEDIUM_GRAY,
        marginRight: 10,
        fontWeight: 'bold',
    },
    imcClassification: {
        fontSize: IS_LARGE_SCREEN ? 15 : 14,
        fontWeight: 'bold',
        // Color se aplica dinámicamente
    },
    imcDate: {
        fontSize: IS_LARGE_SCREEN ? 13 : 12,
        color: LIGHT_GRAY,
        fontStyle: 'italic',
        marginTop: 5,
    },
    // Estilos para el botón de exportar
    exportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: INFO_BLUE,
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 20,
        marginBottom: 10,
        gap: 8,
        ...Platform.select({
            web: {
                cursor: 'pointer',
                transition: 'background-color 0.3s ease-in-out',
                ':hover': {
                    backgroundColor: '#0a58ca', // Un azul más oscuro al pasar el ratón
                },
            }
        }),
    }
});

export default CheckupReportsScreen;