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
        try
        {
            List<Parentesco> parentescos = Parentesco.Get();
            return Ok(MessageResponse.GetReponse(0, "Parentescos obtenidos exitosamente", MessageType.Success, parentescos));
        }
        catch (Exception e)
        {
            return StatusCode(500, MessageResponse.GetReponse(999, "Error interno al obtener parentescos: " + e.Message, MessageType.CriticalError));
        }
    }
}