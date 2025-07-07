using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;

public class LecturaAmbiental
{
    [BsonId]
    public ObjectId Id { get; set; }

    [BsonElement("zona")]
    public string? Zona { get; set; }

    [BsonElement("dispositivoId")]
    public int? DispositivoId { get; set; }

    [BsonElement("temperatura")]
    public double? Temperatura { get; set; }

    [BsonElement("humedad")]
    public double? Humedad { get; set; }

    [BsonElement("timestamp")]
    public DateTime? Timestamp { get; set; }
}