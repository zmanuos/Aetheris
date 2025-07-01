using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;

[Route("api/[controller]")]
[ApiController]
public class ParentescoController : ControllerBase
{
    [HttpGet]
    public ActionResult Get()
    {
        return Ok(ParentescoListResponse.GetResponse(Parentesco.Get()));
    }

    [HttpGet("{id}")]
    public ActionResult Get(int id)
    {
        try
        {
            Parentesco f = Parentesco.Get(id);
            return Ok(ParentescoResponse.GetResponse(f));
        }
        catch (ParentescoNotFoundException e)
        {
            return Ok(MessageResponse.GetReponse(1, e.Message, MessageType.Error));
        }
        catch (Exception e)
        {
            return Ok(MessageResponse.GetReponse(999, e.Message, MessageType.CriticalError));
        }
    }
}