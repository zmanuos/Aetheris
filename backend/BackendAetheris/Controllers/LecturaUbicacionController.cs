// fileName: LecturasUbicacionController.cs
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using MongoDB.Driver;
using MongoDB.Bson;
using System.Threading.Tasks;
using System;

[ApiController]
[Route("[controller]")]
public class LecturasUbicacionController : ControllerBase
{
    private readonly MongoDbContext _context;

    public LecturasUbicacionController()
    {
        _context = new MongoDbContext();
    }

    [HttpGet("residentes")]
    public async Task<ActionResult<IEnumerable<LecturaUbicacionResidente>>> GetLecturasUbicacionResidentes()
    {
        var collection = _context.GetCollection<LecturaUbicacionResidente>("lecturas_ubicacion_residentes");
        var lecturas = await collection.Find(new BsonDocument()).ToListAsync();
        return Ok(lecturas);
    }

    [HttpGet("residente/{residenteId}")]
    public async Task<ActionResult<LecturaUbicacionResidente>> GetUltimaUbicacionResidente(string residenteId)
    {
        var collection = _context.GetCollection<LecturaUbicacionResidente>("lecturas_ubicacion_residentes");

        var ultimaLectura = await collection
            .Find(l => l.ResidenteId == residenteId)
            .SortByDescending(l => l.Timestamp)
            .FirstOrDefaultAsync();

        if (ultimaLectura == null)
        {
            return NotFound($"No se encontró ninguna ubicación para el residente con ID: {residenteId}.");
        }

        return Ok(ultimaLectura);
    }
    
    [HttpPost("residentes")]
    public async Task<ActionResult<LecturaUbicacionResidente>> PostLecturaUbicacionResidente([FromForm] LecturaUbicacionResidenteDto nuevaLecturaDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        // Mapear el DTO a la clase del modelo de la base de datos
        var nuevaLectura = new LecturaUbicacionResidente
        {
            ResidenteId = nuevaLecturaDto.ResidenteId,
            Area = nuevaLecturaDto.Area,
            // El timestamp se asigna automáticamente en el servidor
            Timestamp = DateTime.UtcNow
        };
        
        var collection = _context.GetCollection<LecturaUbicacionResidente>("lecturas_ubicacion_residentes");
        
        await collection.InsertOneAsync(nuevaLectura);
        
        // La respuesta devolverá el objeto completo con el Id y Timestamp generados.
        return CreatedAtAction(nameof(GetLecturasUbicacionResidentes), new { id = nuevaLectura.Id }, nuevaLectura);
    }
}