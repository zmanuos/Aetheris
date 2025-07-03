using Microsoft.AspNetCore.Mvc;
using System;

[Route("api/[controller]")]
[ApiController]
public class ObservacionController : ControllerBase
{
    [HttpGet]
    public ActionResult Get()
    {
        return Ok(ObservacionListResponse.GetResponse(Observacion.Get()));
    }


    [HttpGet("{id_residente}")]
    public ActionResult Get(int id_residente)
    {
        try
        {
            Observacion obs = Observacion.Get(id_residente);
            return Ok(ObservacionResponse.GetResponse(obs));
        }
        catch (ObservacionNotFoundException e)
        {
            return Ok(MessageResponse.GetReponse(1, e.Message, MessageType.Error));
        }
        catch (Exception e)
        {
            return Ok(MessageResponse.GetReponse(999, e.Message, MessageType.CriticalError));
        }
    }

    [HttpPost]
    public ActionResult Post([FromForm] ObservacionPost observaciones)
    {
        try
        {
            bool result = Observacion.Insert(observaciones);

            if (result)
                return Ok(MessageResponse.GetReponse(0, "Se ha registrado el dispositivo exitosamente", MessageType.Success));
            else
                return Ok(MessageResponse.GetReponse(2, "No se pudo registrar el dispositivo", MessageType.Warning));
        }
        catch (Exception ex)
        {
            return StatusCode(500, MessageResponse.GetReponse(3, "Error interno: " + ex.Message, MessageType.Error));
        }
    }

    [HttpPut("{id}")]
    public ActionResult Put(int id, [FromForm] string observacion)
    {
        try
        {
            bool result = Observacion.Update(id, observacion);

            if (result)
                return Ok(MessageResponse.GetReponse(0, "Observación actualizada exitosamente", MessageType.Success));
            else
                return NotFound(MessageResponse.GetReponse(1, "Observación no encontrada", MessageType.Warning));
        }
        catch (Exception ex)
        {
            return StatusCode(500, MessageResponse.GetReponse(3, "Error interno: " + ex.Message, MessageType.Error));
        }
    }

}
