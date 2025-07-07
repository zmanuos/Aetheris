// Crear y poblar colección lecturas_continuas_residente
db.createCollection("  ");
db.lecturas_continuas_residente.insertMany([
  {
    "residenteId": "RESIDENTE001",
    "dispositivoId": "COO_HW807_001",
    "ritmoCardiaco": 78,
    "timestamp": ISODate("2025-07-02T10:05:00Z")
  },
  {
    "residenteId": "RESIDENTE002",
    "dispositivoId": "COO_HW807_002",
    "ritmoCardiaco": 85,
    "timestamp": ISODate("2025-07-02T10:05:30Z")
  },
  {
    "residenteId": "RESIDENTE001",
    "dispositivoId": "COO_HW807_001",
    "ritmoCardiaco": 110,
    "timestamp": ISODate("2025-07-02T10:06:00Z")
  },
  {
    "residenteId": "RESIDENTE003",
    "dispositivoId": "COO_HW807_003",
    "ritmoCardiaco": 65,
    "timestamp": ISODate("2025-07-02T10:06:15Z")
  },
  {
    "residenteId": "RESIDENTE002",
    "dispositivoId": "COO_HW807_002",
    "ritmoCardiaco": 80,
    "timestamp": ISODate("2025-07-02T10:06:45Z")
  },
  {
    "residenteId": "RESIDENTE001",
    "dispositivoId": "COO_HW807_001",
    "ritmoCardiaco": 72,
    "timestamp": ISODate("2025-07-02T10:07:00Z")
  }
]);

// Crear y poblar colección lecturas_ambientales
db.createCollection("lecturas_ambientales");
db.lecturas_ambientales.insertMany([
  {
    "zona": "Recepcion",
    "dispositivoId": "DHT22_REC_001",
    "temperatura": 22.8,
    "humedad": 55.3,
    "timestamp": ISODate("2025-07-02T10:07:00Z")
  },
  {
    "zona": "Habitacion_Individual_1",
    "dispositivoId": "DHT22_HAB1_002",
    "temperatura": 24.1,
    "humedad": 62.1,
    "timestamp": ISODate("2025-07-02T10:07:15Z")
  },
  {
    "zona": "Comedor",
    "dispositivoId": "DHT22_COM_003",
    "temperatura": 28.5,
    "humedad": 70.0,
    "timestamp": ISODate("2025-07-02T10:07:30Z")
  },
  {
    "zona": "Recepcion",
    "dispositivoId": "DHT22_REC_001",
    "temperatura": 23.0,
    "humedad": 56.0,
    "timestamp": ISODate("2025-07-02T10:08:00Z")
  },
  {
    "zona": "Habitacion_Individual_1",
    "dispositivoId": "DHT22_HAB1_002",
    "temperatura": 24.0,
    "humedad": 61.5,
    "timestamp": ISODate("2025-07-02T10:08:15Z")
  }
]);

// Crear y poblar colección chequeos_semanales
db.createCollection("chequeos_semanales");
db.chequeos_semanales.insertMany([
  {
    "residenteId": "RESIDENTE001",
    "fechaChequeo": ISODate("2025-06-25T09:00:00Z"),
    "spo2": 97,
    "pulso": 75,
    "temperaturaCorporal": 36.5,
    "peso": 68.2,
    "altura": 1.65,
    "imc": 25.0,
    "dispositivoSpO2": "MAX30100_CHECK",
    "dispositivoTempCorp": "MLX90614_CHECK",
    "dispositivoPeso": "HX711_CHECK",
    "dispositivoAltura": "HCSR04_CHECK"
  },
  {
    "residenteId": "RESIDENTE002",
    "fechaChequeo": ISODate("2025-06-25T09:30:00Z"),
    "spo2": 96,
    "pulso": 70,
    "temperaturaCorporal": 36.9,
    "peso": 72.0,
    "altura": 1.70,
    "imc": 24.9,
    "dispositivoSpO2": "MAX30100_CHECK",
    "dispositivoTempCorp": "MLX90614_CHECK",
    "dispositivoPeso": "HX711_CHECK",
    "dispositivoAltura": "HCSR04_CHECK"
  },
  {
    "residenteId": "RESIDENTE003",
    "fechaChequeo": ISODate("2025-06-25T10:00:00Z"),
    "spo2": 89,
    "pulso": 95,
    "temperaturaCorporal": 37.8,
    "peso": 80.0,
    "altura": 1.75,
    "imc": 26.1,
    "dispositivoSpO2": "MAX30100_CHECK",
    "dispositivoTempCorp": "MLX90614_CHECK",
    "dispositivoPeso": "HX711_CHECK",
    "dispositivoAltura": "HCSR04_CHECK"
  },
  {
    "residenteId": "RESIDENTE001",
    "fechaChequeo": ISODate("2025-07-02T11:00:00Z"),
    "spo2": 98,
    "pulso": 73,
    "temperaturaCorporal": 36.6,
    "peso": 68.5,
    "altura": 1.65,
    "imc": 25.1,
    "dispositivoSpO2": "MAX30100_CHECK",
    "dispositivoTempCorp": "MLX90614_CHECK",
    "dispositivoPeso": "HX711_CHECK",
    "dispositivoAltura": "HCSR04_CHECK"
  }
]);
