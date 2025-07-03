using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

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
}
