using Microsoft.AspNetCore.Mvc;
using System;

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
            Nota c = Nota.Get(id_familiar);
            return Ok(NotaResponse.GetResponse(c));
        }
        catch (NotaNotFoundException e)
        {
            return Ok(MessageResponse.GetReponse(1, e.Message, MessageType.Error));
        }
        catch (Exception e)
        {
            return Ok(MessageResponse.GetReponse(999, e.Message, MessageType.CriticalError));
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


}
