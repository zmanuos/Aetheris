using Microsoft.AspNetCore.Mvc;
using System;

[Route("api/[controller]")]
[ApiController]
public class ChequeoController : ControllerBase
{
    [HttpGet]
    public ActionResult Get()
    {
        return Ok(ChequeoListResponse.GetResponse(Chequeo.Get()));
    }

    [HttpGet("{id}")]
    public ActionResult Get(int id)
    {
        try
        {
            Chequeo c = Chequeo.Get(id);
            return Ok(ChequeoResponse.GetResponse(c));
        }
        catch (ChequeoNotFoundException e)
        {
            return Ok(MessageResponse.GetReponse(1, e.Message, MessageType.Error));
        }
        catch (Exception e)
        {
            return Ok(MessageResponse.GetReponse(999, e.Message, MessageType.CriticalError));
        }
    }
}
