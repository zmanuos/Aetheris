using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;

[Route("api/[controller]")]
[ApiController]
public class AsiloController : ControllerBase
{
   
    [HttpGet]
    public ActionResult Get()
    {
        try
        {
            Asilo a = Asilo.Get();
            return Ok(AsiloResponse.GetResponse(a));
        }
        catch (Exception e)
        {
            return Ok(MessageResponse.GetReponse(1, e.Message, MessageType.Error));
        }
    }

    [HttpPut]
    public ActionResult Put([FromForm] AsiloPut model)
    {
        bool updated = Asilo.Update(model);
        if (updated)
            return Ok(MessageResponse.GetReponse(0, "Asilo actualizado correctamente", MessageType.Success));
        else
            return Ok(MessageResponse.GetReponse(2, "No se pudo actualizar el asilo", MessageType.Warning));
    }

}
