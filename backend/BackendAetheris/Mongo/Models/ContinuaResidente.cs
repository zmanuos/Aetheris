// ContinuaResidente.cs
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;

public class ContinuaResidente
{
    [BsonId]
    public ObjectId Id { get; set; }

    [BsonElement("residenteId")]
    public string ResidenteId { get; set; }

    [BsonElement("dispositivoId")]
    public string DispositivoId { get; set; }

    [BsonElement("ritmoCardiaco")]
    public int RitmoCardiaco { get; set; }

    [BsonElement("timestamp")]
    public DateTime Timestamp { get; set; }

    [BsonElement("estado")]
    public string Estado { get; set; }

    [BsonElement("promedioRitmoReferencia")] // **Asegúrate de que este campo exista**
    public double PromedioRitmoReferencia { get; set; }
}