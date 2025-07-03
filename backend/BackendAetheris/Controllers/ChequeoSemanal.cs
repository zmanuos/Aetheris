using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using System.Collections.Generic;

[ApiController]
[Route("api/[controller]")]
public class ChequeoSemanalController : ControllerBase
{
    private readonly IMongoCollection<ChequeoSemanal> _coleccion;

    public ChequeoSemanalController()
    {
        var context = new MongoDbContext();
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


    [HttpGet("residente/{residenteId}/ultimo")]
    public ActionResult<ChequeoSemanal> GetUltimoPorResidente(string residenteId)
    {
        var chequeo = _coleccion
            .Find(x => x.ResidenteId == residenteId)
            .SortByDescending(x => x.FechaChequeo)
            .FirstOrDefault();

        return chequeo == null ? NotFound() : Ok(chequeo);
    }
}
