// fileName: LecturasUbicacionController.cs (Ejemplo de un controlador ASP.NET Core)
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using MongoDB.Driver;
using MongoDB.Bson;
using System.Threading.Tasks;

[ApiController]
[Route("[controller]")]
public class LecturasUbicacionController : ControllerBase
{
    private readonly MongoDbContext _context;

    public LecturasUbicacionController()
    {
        _context = new MongoDbContext();
    }

    [HttpGet("residentes")] // Este será tu nuevo endpoint: /LecturasUbicacion/residentes
    public async Task<ActionResult<IEnumerable<LecturaUbicacionResidente>>> GetLecturasUbicacionResidentes()
    {
        var collection = _context.GetCollection<LecturaUbicacionResidente>("lecturas_ubicacion_residentes");
        var lecturas = await collection.Find(new BsonDocument()).ToListAsync();
        return Ok(lecturas);
    }
}