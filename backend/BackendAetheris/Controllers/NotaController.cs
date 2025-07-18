using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic; // Asegúrate de tenerlo si no estaba

[Route("api/[controller]")]
[ApiController]
public class NotaController : ControllerBase
{
    [HttpGet]
    public ActionResult Get()
    {
        return Ok(NotaListResponse.GetResponse(Nota.Get()));
    }

    [HttpGet("todo")]
    public ActionResult GetAll()
    {
        return Ok(NotaListResponse.GetResponse(Nota.Get()));
    }

    [HttpGet("{id_familiar}")]
    public ActionResult Get(int id_familiar)
    {
        try
        {
            // MODIFICADO: Llamar al nuevo método que devuelve una LISTA de notas
            List<Nota> notas = Nota.GetNotesByFamiliarId(id_familiar);
            // Si no se encuentran notas, simplemente se devuelve una lista vacía, lo cual es normal.
            return Ok(NotaListResponse.GetResponse(notas));
        }
        catch (Exception e)
        {
            // Este catch es para errores inesperados del sistema o base de datos.
            // Si no se encuentran notas, el método GetNotesByFamiliarId devolverá una lista vacía,
            // por lo que no se lanzará una excepción de "no encontrada" aquí.
            return StatusCode(500, MessageResponse.GetReponse(999, "Error interno al obtener notas: " + e.Message, MessageType.CriticalError));
        }
    }

    [HttpPost]
    public ActionResult Post([FromForm] NotaPost nota)
    {
        try
        {
            // El objeto 'nota' (de tipo NotaPost) ahora incluye id_personal y puede ser null
            bool result = Nota.Insert(nota);

            if (result)
                return Ok(MessageResponse.GetReponse(0, "Nota registrada exitosamente", MessageType.Success));
            else
                return Ok(MessageResponse.GetReponse(2, "No se pudo registrar la nota", MessageType.Warning));
        }
        catch (Exception ex)
        {
            return StatusCode(500, MessageResponse.GetReponse(3, "Error interno: " + ex.Message, MessageType.Error));
        }
    }

    [HttpPut("{id}")]
    public ActionResult Put(int id, [FromForm] string nota)
    {
        try
        {
            bool result = Nota.Update(id, nota);

            if (result)
                return Ok(MessageResponse.GetReponse(0, "Nota actualizada exitosamente", MessageType.Success));
            else
                return NotFound(MessageResponse.GetReponse(1, "Nota no encontrada", MessageType.Warning));
        }
        catch (Exception ex)
        {
            return StatusCode(500, MessageResponse.GetReponse(3, "Error interno: " + ex.Message, MessageType.CriticalError));
        }
    }
}