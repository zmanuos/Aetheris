using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;

[Route("api/[controller]")]
[ApiController]
public class NotaController : ControllerBase
{
    [HttpGet]
    public ActionResult Get()
    {
        return Ok(NotaListResponse.GetResponse(Nota.Get()));
    }

    [HttpGet("todo")] // Alias para Get()
    public ActionResult GetAll()
    {
        return Ok(NotaListResponse.GetResponse(Nota.Get()));
    }

    [HttpGet("{id_familiar}")]
    public ActionResult Get(int id_familiar)
    {
        try
        {
            List<Nota> notas = Nota.GetNotesByFamiliarId(id_familiar);
            return Ok(NotaListResponse.GetResponse(notas));
        }
        catch (Exception e)
        {
            return StatusCode(500, MessageResponse.GetReponse(999, "Error interno al obtener notas: " + e.Message, MessageType.CriticalError));
        }
    }

    [HttpPost]
    public ActionResult Post([FromForm] NotaPost nota)
    {
        try
        {
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
            return StatusCode(500, MessageResponse.GetReponse(3, "Error interno: " + ex.Message, MessageType.Error));
        }
    }

    [HttpPut("activo/{id}")]
    public ActionResult UpdateActivo(int id, [FromForm] bool activo)
    {
        try
        {
            bool result = Nota.UpdateActivo(id, activo);

            if (result)
                return Ok(MessageResponse.GetReponse(0, "Estado 'activo' de la nota actualizado exitosamente", MessageType.Success));
            else
                return NotFound(MessageResponse.GetReponse(1, "Nota no encontrada", MessageType.Warning));
        }
        catch (Exception ex)
        {
            return StatusCode(500, MessageResponse.GetReponse(3, "Error interno al actualizar estado 'activo': " + ex.Message, MessageType.Error));
        }
    }
}