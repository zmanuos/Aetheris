using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using System.Collections.Generic;

[ApiController]
[Route("api/[controller]")]
public class LecturaAmbientalController : ControllerBase
{
    private readonly IMongoCollection<LecturaAmbiental> _coleccion;

    public LecturaAmbientalController()
    {
        var context = new MongoDbContext();
        _coleccion = context.GetCollection<LecturaAmbiental>("lecturas_ambientales");
    }

    [HttpGet]
    public ActionResult<List<LecturaAmbiental>> GetTodas()
    {
        return _coleccion.Find(x => true)
            .SortByDescending(x => x.Timestamp)
            .Limit(200)
            .ToList();
    }

    
    [HttpGet("zona/{zona}")]
    public ActionResult<List<LecturaAmbiental>> GetPorZona(string zona)
    {
        var lecturas = _coleccion.Find(x => x.Zona == zona).ToList();
        return lecturas.Count == 0 ? NotFound() : Ok(lecturas);
    }

    [HttpPost]
    public ActionResult CrearLectura([FromForm] LecturaAmbientalPost lectura)
    {
        if (string.IsNullOrWhiteSpace(lectura.Zona))
            return BadRequest("Zona es requerida.");

        var nuevaLectura = new LecturaAmbiental
        {
            Zona = lectura.Zona,
            Temperatura = lectura.Temperatura,
            Humedad = lectura.Humedad,
            Timestamp = DateTime.UtcNow
        };

        _coleccion.InsertOne(nuevaLectura);

        return Ok(MessageResponse.GetReponse(0, "lectura enviada exitosamente", MessageType.Success));
    }

}
