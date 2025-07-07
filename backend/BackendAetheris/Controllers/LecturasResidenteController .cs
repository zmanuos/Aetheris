using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;
using MongoDB.Driver;
using System.Collections.Generic;

[ApiController]
[Route("api/[controller]")]
public class LecturaResidenteController : ControllerBase
{
    private readonly IMongoCollection<ContinuaResidente> _lecturasCollection;

    public LecturaResidenteController()
    {
        var dbContext = new MongoDbContext();
        _lecturasCollection = dbContext.GetCollection<ContinuaResidente>("lecturas_continuas_residente");
    }

    [HttpGet]
    public ActionResult<List<ContinuaResidente>> GetAll()
    {
        var lecturas = _lecturasCollection.Find(x => true)
            .SortByDescending(x => x.Timestamp)
            .Limit(200)
            .ToList().ToList();
        return Ok(lecturas);
    }

    [HttpGet("{id_residente}")]
    public ActionResult<ContinuaResidente> GetById(string id_residente)
    {
        var lectura = _lecturasCollection
            .Find(x => x.ResidenteId == id_residente)
            .SortByDescending(x => x.Timestamp)
            .Limit(200)
            .ToList();

        if (lectura == null) return NotFound();
        return Ok(lectura);
    }

    [HttpGet("avg/{id_residente}")]
    public ActionResult<double> GetAvg(string id_residente)
    {
        var bpm = _lecturasCollection
            .Find(x => x.ResidenteId == id_residente)
            .SortByDescending(x => x.Timestamp)
            .Limit(7)
            .ToList();

        if (bpm == null || bpm.Count == 0)
            return NotFound("No se encontraron lecturas para ese residente.");

        var promedio = bpm.Average(x => x.RitmoCardiaco);

        return Ok(promedio);
    }


    [HttpPost]
    public ActionResult<ContinuaResidente> Post([FromForm] ContinuaResidentePost LecturaResidente)
    {
        if (LecturaResidente == null)
        {
            return BadRequest("Datos inválidos.");
        }

        var nuevaLectura = new ContinuaResidente
        {
            Id = ObjectId.GenerateNewId(),
            ResidenteId = LecturaResidente.ResidenteId,
            DispositivoId = LecturaResidente.DispositivoId,
            RitmoCardiaco = LecturaResidente.RitmoCardiaco,
            Timestamp = DateTime.UtcNow
        };

        try
        {
            _lecturasCollection.InsertOne(nuevaLectura);

            return Ok(MessageResponse.GetReponse(0, "lectura ingresada correctamente", MessageType.Success));
        
        }
        catch (Exception ex)
        {
            return Ok(MessageResponse.GetReponse(999, ex.Message, MessageType.CriticalError));
        }
    }


}
