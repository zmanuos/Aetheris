using Microsoft.AspNetCore.Mvc;
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
        var lecturas = _lecturasCollection.Find(_ => true).ToList();
        return Ok(lecturas);
    }

    [HttpGet("{id}")]
    public ActionResult<ContinuaResidente> GetById(string id)
    {
        var lectura = _lecturasCollection
            .Find(x => x.ResidenteId == id)
            .FirstOrDefault();

        if (lectura == null) return NotFound();
        return Ok(lectura);
    }

}
