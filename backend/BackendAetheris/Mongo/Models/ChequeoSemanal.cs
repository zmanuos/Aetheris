using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;

public class ChequeoSemanal
{
    [BsonId]
    public ObjectId Id { get; set; }

    [BsonElement("residenteId")]
    public string ResidenteId { get; set; }

    [BsonElement("fechaChequeo")]
    public DateTime FechaChequeo { get; set; }

    [BsonElement("spo2")]
    public int Spo2 { get; set; }

    [BsonElement("pulso")]
    public int Pulso { get; set; }

    [BsonElement("temperaturaCorporal")]
    public double TemperaturaCorporal { get; set; }

    [BsonElement("peso")]
    public double Peso { get; set; }

    [BsonElement("altura")]
    public double Altura { get; set; }

    [BsonElement("imc")]
    public double Imc { get; set; }

    [BsonElement("dispositivoSpO2")]
    public string DispositivoSpO2 { get; set; }

    [BsonElement("dispositivoTempCorp")]
    public string DispositivoTempCorp { get; set; }

    [BsonElement("dispositivoPeso")]
    public string DispositivoPeso { get; set; }

    [BsonElement("dispositivoAltura")]
    public string DispositivoAltura { get; set; }
}
