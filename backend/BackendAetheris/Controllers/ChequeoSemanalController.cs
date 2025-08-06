using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using System.Collections.Generic;
using System; // Agrega esto para Random, aunque no se usa en el código final de creación de chequeo
using MongoDB.Bson; // Necesario para ObjectId
using MongoDB.Bson.Serialization.Attributes; // Para el atributo BsonId

[ApiController]
[Route("api/[controller]")]
public class ChequeoSemanalController : ControllerBase
{
    private readonly IMongoCollection<ChequeoSemanal> _coleccion;

    public ChequeoSemanalController()
    {
        var context = new MongoDbContext(); // Asume que tienes un MongoDbContext configurado
        _coleccion = context.GetCollection<ChequeoSemanal>("chequeos_semanales");
    }

    [HttpGet]
    public ActionResult<List<ChequeoSemanal>> GetTodos()
    {
        return _coleccion.Find(_ => true).ToList();
    }

    [HttpGet("residente/{residenteId}")]
    public ActionResult<List<ChequeoSemanal>> GetPorResidente(string residenteId)
    {
        var chequeos = _coleccion.Find(x => x.ResidenteId == residenteId).ToList();
        return chequeos.Count == 0 ? NotFound() : Ok(chequeos);
    }

    // Nuevo endpoint para buscar por ID de documento de MongoDB
    [HttpGet("id/{id}")]
    public ActionResult<ChequeoSemanal> GetPorId(string id)
    {
        // Asume que tu modelo ChequeoSemanal tiene una propiedad 'Id'
        // que mapea al '_id' de MongoDB.
        // Si tu ID de MongoDB es un ObjectId, asegúrate de que tu modelo
        // lo maneje correctamente (ej: [BsonId] public ObjectId Id { get; set; }
        // o [BsonId][BsonRepresentation(BsonType.ObjectId)] public string Id { get; set; })
        var chequeo = _coleccion.Find(x => x.Id == id).FirstOrDefault();
        return chequeo == null ? NotFound() : Ok(chequeo);
    }

    [HttpGet("residente/{residenteId}/ultimo")]
    public ActionResult<ChequeoSemanal> GetUltimoPorResidente(string residenteId)
    {
        var chequeo = _coleccion
            .Find(x => x.ResidenteId == residenteId)
            .SortByDescending(x => x.FechaChequeo)
            .FirstOrDefault();

        return chequeo == null ? NotFound() : Ok(chequeo);
    }

    [HttpPost]
    public ActionResult CrearChequeo([FromForm] ChequeoSemanalPost chequeo)
    {
        if (string.IsNullOrWhiteSpace(chequeo.ResidenteId))
            return BadRequest("El ID del residente es obligatorio.");

        // Validar personalId si es necesario
        if (string.IsNullOrWhiteSpace(chequeo.PersonalId))
            return BadRequest("El ID del personal es obligatorio.");

        var nuevoChequeo = new ChequeoSemanal
        {
            ResidenteId = chequeo.ResidenteId,
            PersonalId = chequeo.PersonalId, // Asignar el nuevo campo
            FechaChequeo = chequeo.FechaChequeo,
            Spo2 = chequeo.Spo2,
            Pulso = chequeo.Pulso,
            TemperaturaCorporal = chequeo.TemperaturaCorporal,
            Peso = chequeo.Peso,
            Altura = chequeo.Altura,
            Imc = chequeo.Imc,
            Observaciones = chequeo.Observaciones // Asignar el nuevo campo
        };

        _coleccion.InsertOne(nuevoChequeo);

        // Asegúrate de que MessageResponse y MessageType estén definidos en tu proyecto.
        // Si no los tienes, puedes devolver un StatusCode 200 OK directamente.
        return Ok(MessageResponse.GetReponse(0, "Chequeo médico registrado exitosamente.", MessageType.Success));
        // La línea 'Random rnd = new Random();' al final del método POST es inalcanzable y no tiene un propósito.  
        // Se recomienda eliminarla.
    }
}