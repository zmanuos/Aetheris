import { config } from './config.js';
import { simularDiaTemperatura } from './mainTemperatura.js';

var contador = 0;
var acomuladorOriginal = 0;
var acomuladorModificado = 0;

async function init() {
    console.log("Initializing Document...");

    const response = await obtenerResidentes();

    const residentes = response.data;
    console.log("Residentes recibidos:", residentes); //

    document.getElementById("button-start").addEventListener("click", () => { //
        residentes.forEach(residente => { //
            const residenteId = residente.id_residente; //
            let dispositivoId = null; // Inicializamos a null para el caso de que no haya dispositivo

            // **** INICIO DE LA MODIFICACIÓN CLAVE ****
            if (residente.dispositivo) { //
                dispositivoId = residente.dispositivo.id; //
            } else {
                console.warn(`Residente con ID ${residenteId} no tiene un dispositivo asignado. Se omitirá la simulación para este residente.`);
                return; // Esto hace que el bucle forEach salte al siguiente residente si no hay dispositivo
            }
            // **** FIN DE LA MODIFICACIÓN CLAVE ****

            const promedio = Math.floor(Math.random() * (90 - 70 + 1)) + 70; //

            setInterval(() => { //
                simularResidente(residenteId, promedio, dispositivoId); //
            }, 11000); //
        });
    });

        document.getElementById("button-start-temperatura").addEventListener("click", () => { //
        console.log("Enviando datos de temperatura.."); //
        const hora = new Date().getHours(); //
        const mes = new Date().getMonth(); //
        simularDiaTemperatura("patio", 2000, mes); //
    });

    document.getElementById("button-stop").addEventListener("click", () => { //
        console.log("Deteniendo envio de lecturas..."); //
        clearInterval(intervalReceive);
    });
}

async function obtenerResidentes() { //
    try {
        const response = await fetch("https://localhost:7160/api/Residente", { //
            method: "GET", //
            headers: { //
                "Accept": "application/json" //
            }
        });

        if (!response.ok) { //
            throw new Error(`Error HTTP: ${response.status}`); //
        }

        const data = await response.json(); //
        console.log("Residentes recibidos:", data); //
        return data; //
    } catch (error) {
        console.error("Error al obtener residentes:", error); //
    }
}

async function enviarAlertaResidente(idResidente, alertaTipo, mensaje) { //
    const formData = new FormData(); //
    formData.append("id_residente", idResidente); //
    formData.append("alertaTipo", alertaTipo); //
    formData.append("mensaje", mensaje); //

    try {
        const response = await fetch("https://localhost:7160/api/Alerta/residente", { //
            method: "POST", //
            body: formData, //
            headers: { //
                "Accept": "*/*" //
            }
        });

        if (!response.ok) { //
            throw new Error(`Error HTTP: ${response.status}`); //
        }

        const data = await response.json(); //
        console.log("Respuesta del servidor:", data); //
    } catch (error) {
        console.error("Error al enviar alerta:", error); //
    }
}


async function enviarLectura(residenteId, dispositivoId, RitmoPromedio) { //
    console.log("ENVIANDO:", residenteId, dispositivoId, RitmoPromedio); // verificación //

    const ritmo = parseInt(RitmoPromedio); //

    const formData = new FormData(); //
    formData.append("ResidenteId", residenteId); //
    formData.append("DispositivoId", dispositivoId); //
    formData.append("RitmoCardiaco", ritmo); // asegúrate que sea un número o string válido //

    try {
        const response = await fetch("https://localhost:7160/api/LecturaResidente", { //
            method: "POST", //
            body: formData, //
            headers: { //
                "Accept": "text/plain" //
                // NO agregues Content-Type, fetch lo pone solo si usas FormData
            }
        });

        if (!response.ok) { //
            throw new Error(`Error HTTP: ${response.status}`); //
        }

        const data = await response.text(); // o .json() si esperas JSON //
        console.log("Respuesta del servidor:", data); //
    } catch (error) {
        console.error("Error al enviar lectura:", error); //
    }
}




function generarRitmoCardiaco(promedio, horaActual) { //
    var ritmo = 0; //
    const variacion = config.variation[horaActual]; //

    var offset = Math.floor(Math.random() * (variacion + 1)); // rango de variacion //
    var signo = Math.random() < 0.3 ? -1 : 1; // signo de la variacion + o - //

    if (horaActual >= 0 && horaActual <= 6) { // Madrugada //
        // Mientras duerme se reduce su ritmo cardiaco entre 5% a 15% y luego se le resta el offset correspondiente a la hora
        return ritmo = (promedio - (promedio * ((Math.random() * (0.15 - 0.09)) + 0.09)) - (offset/1.65)); //
    } else if (horaActual >= 7 && horaActual <= 8) { // Mañana //
        ritmo = promedio + (offset * signo) - 5 ; //
    } else if (horaActual >= 9 && horaActual <= 16) { // Mediodía //
        if (signo < 0){ //
            ritmo = promedio + (promedio * ((Math.random() * 0.10) + 0.05)) - (offset / 5); //
        } else {
            ritmo = promedio + (offset); //
        }
    } else if (horaActual >= 17 && horaActual <= 19) { // Tarde //
        if (signo < 0){ //
            ritmo = promedio - (offset / 5); //
        } else {
            ritmo = promedio + (offset); //
        }
    } else if (horaActual >= 20 && horaActual <= 21) { // Noche //
        ritmo = (promedio - (promedio * ((Math.random() * (0.05)))) + 3); //
    }
    else if (horaActual >= 22 && horaActual <= 23) { // Noche //
        ritmo = (promedio - (promedio * ((Math.random() * 0.05) )) - (offset / 2)); //
    }

    return ritmo; //
}


function generarVariaciones(promedio, horaActual, variacionCritica) { //
    var ritmo = 0; //
    var modificador = 0; //
    var signoCritico = Math.random() < 0.3 ? -1 : 1; //

    ritmo = generarRitmoCardiaco(promedio, horaActual); //

    switch (variacionCritica) { //
        case 1: // Arritmia //
            modificador = (ritmo * 0.70) + (ritmo * (Math.random() * 0.30)); //
            break;
        case 2:  // bradicardia //
            modificador = (ritmo * 0.65) + ( signoCritico * (promedio * ((Math.random() * (0.05))))); //
            break;
        case 3: // taquicardia //
            modificador = (ritmo * 1.30) + ( signoCritico * (promedio * ((Math.random() * (0.05))))) ; //
            break;
    }

    return { ritmo, modificador }; //
}



let simulacionActiva = false; //

function simularResidente(residenteId, promedio, dispositivoId) { //
    if (simulacionActiva) { //
        console.log("Simulación en curso. Esperando que finalice..."); //
        return; //
    }

    simulacionActiva = true; //

    const hora = new Date().getHours(); //
    const rng = Math.random(); //
    const esCritico = rng < 0.005; //
    let variacion = 0; //
    let lecturaRitmo = 0; //
    let lecturaModificada = 0; //

    if (esCritico) { //
        const rngVariacion = Math.random(); //
        if (rngVariacion < 0.33) { //
            variacion = 1; // arritmia //
        } else if (rngVariacion < 0.66) { //
            variacion = 2; // bradicardia //
        } else {
            variacion = 3; // taquicardia //
        }
    }

    console.log("variacion: " + variacion); //

    if (variacion > 0) { //
        let repeticiones = 0; //

        const intervalo = setInterval(() => { //
            const lectura = generarVariaciones(promedio, hora, variacion); //
            lecturaRitmo = Math.round(lectura.ritmo * 100) / 100; //
            lecturaModificada = Math.round(lectura.modificador * 100) / 100; //

            contador++; //
            acomuladorOriginal += lectura.ritmo; //
            acomuladorModificado += lectura.modificador; //

            const promedioOriginal = Math.round((acomuladorOriginal / contador) * 100) / 100; //
            const promedioModificado = Math.round((acomuladorModificado / contador) * 100) / 100; //

            console.log("______________________________________________________"); //
            console.log("Ritmo Cardiaco Modificado: " + lecturaRitmo + " bpm"); //
            console.log("Ritmo Cardiaco Original:   " + lecturaModificada + " bpm"); //
            console.log("Promedio Original:    " + promedioOriginal + " bpm\t\t variacion: " + config.variation[hora] + " hora: " + (hora > 12 ? hora - 12 : hora) + " " + (hora >= 12 ? "PM" : "AM")); //
            console.log("Promedio Modificado:  " + promedioModificado + " bpm\t\t variacion: " + config.variation[hora] + " hora: " + (hora > 12 ? hora - 12 : hora) + " " + (hora >= 12 ? "PM" : "AM")); //

            enviarLectura(residenteId, dispositivoId, lecturaModificada); //

            repeticiones++; //

            if (repeticiones >= 10) { //
                clearInterval(intervalo); //
                switch (variacion) { //
                    case 1:
                        enviarAlertaResidente(residenteId, 3, "Se presenta Arritmia"); //
                        break;
                    case 2:
                        enviarAlertaResidente(residenteId, 3, "Se presenta Braquicardia"); //
                        break;
                    case 3:
                        enviarAlertaResidente(residenteId, 3, "Se presenta Taquicardia"); //
                        break;
                }
                simulacionActiva = false; //
            }
        }, 1000); //
    } else {
        const lectura = generarVariaciones(promedio, hora, variacion); //
        lecturaRitmo = Math.round(lectura.ritmo * 100) / 100; //

        contador++; //
        acomuladorOriginal += lectura.ritmo; //

        const promedioOriginal = Math.round((acomuladorOriginal / contador) * 100) / 100; //

        console.log("______________________________________________________"); //
        console.log("Ritmo Cardiaco: " + lecturaRitmo + " bpm"); //
        console.log("Promedio Original: " + promedioOriginal + " bpm\t\t variacion: " + config.variation[hora] + " hora: " + (hora > 12 ? hora - 12 : hora) + " " + (hora >= 12 ? "PM" : "AM")); //

        enviarLectura(residenteId, dispositivoId, lecturaRitmo); //
        simulacionActiva = false; //
    }
}

document.addEventListener("DOMContentLoaded", init); //