using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;

[Route("api/[controller]")]
[ApiController]
public class AlertaController : ControllerBase
{
    [HttpGet]
    public ActionResult Get()
    {
        return Ok(AlertaListResponse.GetResponse(Alerta.Get()));
    }

    [HttpGet("{id}")] // Este endpoint ya existe para obtener una alerta por su ID de alerta
    public ActionResult Get(int id)
    {
        try
        {
            Alerta c = Alerta.Get(id);
            return Ok(AlertaResponse.GetResponse(c));
        }
        catch (AlertaNotFoundException e)
        {
            return Ok(MessageResponse.GetReponse(1, e.Message, MessageType.Error));
        }
        catch (Exception e)
        {
            return Ok(MessageResponse.GetReponse(999, e.Message, MessageType.CriticalError));
        }
    }

    // Nuevo endpoint para obtener alertas por ID de residente
    [HttpGet("residente/{id_residente}")]
    public ActionResult GetAlertasByResidente(int id_residente)
    {
        try
        {
            List<Alerta> alertas = Alerta.GetByResidente(id_residente);
            if (alertas.Count > 0)
            {
                return Ok(AlertaListResponse.GetResponse(alertas));
            }
            else
            {
                // Si no se encuentran alertas para el residente, devuelve una respuesta adecuada
                return Ok(MessageResponse.GetReponse(1, $"No se encontraron alertas para el residente con ID {id_residente}", MessageType.Warning));
            }
        }
        catch (Exception ex)
        {
            return StatusCode(500, MessageResponse.GetReponse(999, "Error interno al obtener alertas por residente: " + ex.Message, MessageType.CriticalError));
        }
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