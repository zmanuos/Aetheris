import { config } from './config.js';

let intervaloSimulacion;
let estadoCriticoPorZona = {};
let acomuladorTemperatura = 0;
let acomuladorHumedad = 0;
let contador = 0;
let promedioTemperatura = 0;
let promedioHumedad = 0;

export function simularDiaTemperatura(zona, intervaloMs, mesManual) {
    const claveZona = zona.toLowerCase();

    if (!(claveZona in estadoCriticoPorZona)) {
        const esCritico = Math.random() < 0.05;
        estadoCriticoPorZona[claveZona] = esCritico;
        console.log(`Zona "${zona}" asignada como ${esCritico ? "CRÍTICA" : "NORMAL"}`);
    }

    let horaSimulada = 0;
    let contadorSegundos = 0;

    intervaloSimulacion = setInterval(() => {
        simularTemperatura(zona, horaSimulada, mesManual);
        contadorSegundos++;

        if (contadorSegundos >= intervaloMs / 1000) {
            contadorSegundos = 0;
            horaSimulada++;

            if (horaSimulada >= 24) {
                clearInterval(intervaloSimulacion);
                console.log("✔️ Fin de la simulación del día completo.");
                return;
            }

            console.log(`>>> Avanzando a hora simulada: ${horaSimulada}`);
        }
    }, 1000); // Ejecuta cada segundo
}

export function simularTemperatura(zona, horaManual, mesManual) {
    const claveZona = zona.toLowerCase();
    const promedioBase = config.averageMonthlyTemperature[mesManual];
    const variacionBase = config.temperatureVariation[horaManual];
    const esCritico = estadoCriticoPorZona[claveZona];

    let temperaturaFinal = promedioBase + variacionBase;

    if (esCritico) {
        const variacionCritica = config.criticalTemperatureVariation[horaManual];
        temperaturaFinal = promedioBase + variacionCritica;
        console.warn(`CRÍTICO: Temperatura simulada crítica en zona ${zona}: ${temperaturaFinal.toFixed(1)}°C`);
    }

    const variacionAleatoria = (Math.random() * 3) - 1.5;
    temperaturaFinal += variacionAleatoria;

    const humedad = Math.max(30, Math.min(80, 65 - (temperaturaFinal - 20) + Math.random() * 10));

    const formData = new FormData();
    formData.append("Zona", zona);
    formData.append("Temperatura", temperaturaFinal.toFixed(1));
    formData.append("Humedad", humedad.toFixed(1));
    formData.append("Dispositivo", 1);

    acomuladorTemperatura += temperaturaFinal;
    acomuladorHumedad += humedad;
    contador++;
    promedioHumedad = acomuladorHumedad / contador;
    promedioTemperatura = acomuladorTemperatura / contador;

    console.log(`Lectura enviada: zona=${zona} | temp=${temperaturaFinal.toFixed(1)}°C | hum=${humedad.toFixed(1)}%`);
    console.log("Promedio temperatura: " + promedioTemperatura.toFixed(2));
    console.log("Promedio Humedad: " + promedioHumedad.toFixed(2));

    fetch("https://localhost:7160/api/LecturaAmbiental", {
        method: "POST",
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Error al enviar lectura: ${response.statusText}`);
        }
        return response.json();
    })
    .then(result => {
        // Puedes imprimir algo si quieres
    })
    .catch(error => {
        console.error("Error en fetch:", error);
    });
}
