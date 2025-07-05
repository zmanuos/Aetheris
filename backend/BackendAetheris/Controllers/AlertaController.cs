using Microsoft.AspNetCore.Mvc;
using System;

[Route("api/[controller]")]
[ApiController]
public class AlertaController : ControllerBase
{
    [HttpGet]
    public ActionResult Get()
    {
        return Ok(AlertaListResponse.GetResponse(Alerta.Get()));
    }

    [HttpPost("residente")]
    public ActionResult PostAlertaResidente([FromForm]int id_residente, [FromForm] int alertaTipo, [FromForm] string mensaje)
    {
        try
        {
            bool result = Alerta.AlertaResidente(id_residente, alertaTipo , mensaje);
            if (result)
                return Ok(MessageResponse.GetReponse(0, "Alerta ingresada exitosamente", MessageType.Success));
            else
                return Ok(MessageResponse.GetReponse(999, "No se pudo ingresar la alerta", MessageType.Error));
        }
        catch (Exception ex)
        {
            return StatusCode(500, MessageResponse.GetReponse(3, "Error interno: " + ex.Message, MessageType.Error));
        }
    }

    [HttpPost("area")]
    public ActionResult PostAlertaArea([FromForm] int id_area, [FromForm] int alertaTipo, [FromForm] string mensaje)
    {
        try
        {
            bool result = Alerta.AlertaArea(id_area, alertaTipo, mensaje);
            if (result)
                return Ok(MessageResponse.GetReponse(0, "Alerta ingresadaexitosamente", MessageType.Success));
            else
                return Ok(MessageResponse.GetReponse(999, "No se pudo ingresar la alerta", MessageType.Error));
        }
        catch (Exception ex)
        {
            return StatusCode(500, MessageResponse.GetReponse(3, "Error interno: " + ex.Message, MessageType.Error));
        }
    }

    [HttpPost("general")]
    public ActionResult PostAlertaGeneral( [FromForm] int alertaTipo, [FromForm] string mensaje)
    {
        try
        {
            bool result = Alerta.AlertaGeneral(alertaTipo, mensaje);
            if (result)
                return Ok(MessageResponse.GetReponse(0, "Alerta ingresada exitosamente", MessageType.Success));
            else
                return Ok(MessageResponse.GetReponse(999, "No se pudo ingresar la alerta", MessageType.Error));
        }
        catch (Exception ex)
        {
            return StatusCode(500, MessageResponse.GetReponse(3, "Error interno: " + ex.Message, MessageType.Error));
        }
    }
}
