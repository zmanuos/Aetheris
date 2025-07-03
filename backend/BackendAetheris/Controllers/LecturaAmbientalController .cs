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
        return _coleccion.Find(_ => true).ToList();
    }

    
    [HttpGet("zona/{zona}")]
    public ActionResult<List<LecturaAmbiental>> GetPorZona(string zona)
    {
        var lecturas = _coleccion.Find(x => x.Zona == zona).ToList();
        return lecturas.Count == 0 ? NotFound() : Ok(lecturas);
    }

}
