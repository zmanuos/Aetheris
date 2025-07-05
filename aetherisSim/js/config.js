export var config = {
    api: {
        url:{
            residentes: "https://localhost:7160/api/Residente",
            lecturas:   "https://localhost:7160/api/LecturaResidente/",
            lecturaAvg: "https://localhost:7160/api/LecturaResidente/avg/"
        },
    },  variation: [
            12, 12, 12, 12, 10, 6, 2,   // 00:00 - 06:00: ritmo cardíaco bajo       (Madrugada, Horas de sueño) (sus valores se restan)
            6, 9, 11, 12,               // 06:00 - 10:00: ritmo cardíaco medio-bajo (Mañana, Despertar y actividad matutina)
            14, 17, 18, 22, 22,         // 11:00 - 15:00: ritmo cardíaco medio-alto (Mediodia, Actividad)
            16, 14, 11, 9,              // 16:00 - 19:00: ritmo cardíaco medio-bajo (Tarde, Actividad moderada)
            1, 7, 10, 15 ],               // 20:00 - 23:00: ritmo cardíaco bajo       (Noche, relajación) (sus valores se restan)
        criticalVariations: [
            10, 10, 10, 10, 12, 15, 18,    // 00:00 - 06:00: sueño, posibles arritmias menores
            20, 22, 24, 26,                // 06:00 - 10:00: agitación súbita, posibles subidas peligrosas
            28, 30, 30, 32, 32,            // 11:00 - 15:00: mayor estrés físico/mental, riesgo de crisis
            30, 28, 25, 22,                // 16:00 - 19:00: bajando poco a poco pero aún con riesgo
            18, 15, 12, 10                 // 20:00 - 23:00: noche, situaciones raras pero posibles (ej. apnea)
        ]
}

/*
https://localhost:7160/api/Residente
https://localhost:7160/api/Residente/x

https://localhost:7160/api/LecturaResidente
https://localhost:7160/api/LecturaResidente/x

https://localhost:7160/api/LecturaResidente/avg/1


https://localhost:7160/api/LecturaResidente

curl -X 'POST' \
  'https://localhost:7160/api/LecturaResidente' \
  -H 'accept: text/plain' \
  -H 'Content-Type: multipart/form-data' \
  -F 'ResidenteId=1' \
  -F 'DispositivoId=1' \
  -F 'RitmoCardiaco=1'


*/