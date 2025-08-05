using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;

public class LecturaUbicacionResidente
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; }

    [BsonElement("residenteId")]
    public string ResidenteId { get; set; }

    [BsonElement("area")]
    public string Area { get; set; }

    [BsonElement("timestamp")]
    public DateTime Timestamp { get; set; }
}