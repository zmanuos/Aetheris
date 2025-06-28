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

    [HttpGet("{id}")]
    public ActionResult Get(int id)
    {
        try
        {
            Alerta alerta = Alerta.Get(id);
            return Ok(AlertaResponse.GetResponse(alerta));
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
}
