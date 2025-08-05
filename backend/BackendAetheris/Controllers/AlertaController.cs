using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Text.Json; // Se añade el using para JsonSerializer
using System.Threading.Tasks; // Se añade el using para Task

[Route("api/[controller]")]
[ApiController]
public class AlertaController : ControllerBase
{
    private readonly WebSocketHandler _webSocketHandler;

    public AlertaController(WebSocketHandler webSocketHandler)
    {
        _webSocketHandler = webSocketHandler;
    }

    [HttpGet]
    public ActionResult Get()
    {
        return Ok(AlertaListResponse.GetResponse(Alerta.Get()));
    }

    [HttpGet("{id}")]
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
                return Ok(MessageResponse.GetReponse(1, $"No se encontraron alertas para el residente con ID {id_residente}", MessageType.Warning));
            }
        }
        catch (Exception ex)
        {
            return StatusCode(500, MessageResponse.GetReponse(999, "Error interno al obtener alertas por residente: " + ex.Message, MessageType.CriticalError));
        }
    }

    [HttpPost("residente")]
    public async Task<IActionResult> PostAlertaResidente([FromForm]int id_residente, [FromForm] int alertaTipo, [FromForm] string mensaje)
    {
        try
        {
            bool result = Alerta.AlertaResidente(id_residente, alertaTipo , mensaje);
            if (result)
            {
                var nuevaAlerta = Alerta.GetLastCreatedByResidente(id_residente);
                if (nuevaAlerta != null)
                {
                    var json = JsonSerializer.Serialize(nuevaAlerta);
                    await _webSocketHandler.SendMessageToAllAsync(json);
                }
                
                return Ok(MessageResponse.GetReponse(0, "Alerta ingresada exitosamente", MessageType.Success));
            }
            else
            {
                return Ok(MessageResponse.GetReponse(999, "No se pudo ingresar la alerta", MessageType.Error));
            }
        }
        catch (Exception ex)
        {
            return StatusCode(500, MessageResponse.GetReponse(3, "Error interno: " + ex.Message, MessageType.Error));
        }
    }

    [HttpPost("area")]
    public async Task<IActionResult> PostAlertaArea([FromForm] int id_area, [FromForm] int alertaTipo, [FromForm] string mensaje)
    {
        try
        {
            bool result = Alerta.AlertaArea(id_area, alertaTipo, mensaje);
            if (result)
            {
                var nuevaAlerta = Alerta.GetLastCreatedByArea(id_area);
                if (nuevaAlerta != null)
                {
                    var json = JsonSerializer.Serialize(nuevaAlerta);
                    await _webSocketHandler.SendMessageToAllAsync(json);
                }
                
                return Ok(MessageResponse.GetReponse(0, "Alerta ingresadaexitosamente", MessageType.Success));
            }
            else
            {
                return Ok(MessageResponse.GetReponse(999, "No se pudo ingresar la alerta", MessageType.Error));
            }
        }
        catch (Exception ex)
        {
            return StatusCode(500, MessageResponse.GetReponse(3, "Error interno: " + ex.Message, MessageType.Error));
        }
    }

    [HttpPost("general")]
    public async Task<IActionResult> PostAlertaGeneral([FromForm] int alertaTipo, [FromForm] string mensaje)
    {
        try
        {
            bool result = Alerta.AlertaGeneral(alertaTipo, mensaje);
            if (result)
            {
                var nuevaAlerta = Alerta.GetLastCreatedGeneral();
                if (nuevaAlerta != null)
                {
                    var json = JsonSerializer.Serialize(nuevaAlerta);
                    await _webSocketHandler.SendMessageToAllAsync(json);
                }
                
                return Ok(MessageResponse.GetReponse(0, "Alerta ingresada exitosamente", MessageType.Success));
            }
            else
            {
                return Ok(MessageResponse.GetReponse(999, "No se pudo ingresar la alerta", MessageType.Error));
            }
        }
        catch (Exception ex)
        {
            return StatusCode(500, MessageResponse.GetReponse(3, "Error interno: " + ex.Message, MessageType.Error));
        }
    }
}