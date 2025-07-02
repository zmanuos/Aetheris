using Microsoft.AspNetCore.Mvc;
using System;

[Route("api/[controller]")]
[ApiController]
public class FamiliarController : ControllerBase
{
    [HttpGet]
    public ActionResult Get()
    {
        return Ok(FamiliarListResponse.GetResponse(Familiar.Get()));
    }

    [HttpGet("{id}")]
    public ActionResult Get(int id)
    {
        try
        {
            Familiar f = Familiar.Get(id);
            return Ok(FamiliarResponse.GetResponse(f));
        }
        catch (FamiliarNotFoundException e)
        {
            return Ok(MessageResponse.GetReponse(1, e.Message, MessageType.Error));
        }
        catch (Exception e)
        {
            return Ok(MessageResponse.GetReponse(999, e.Message, MessageType.CriticalError));
        }
    }

    [HttpPost]
    public ActionResult Post([FromForm] FamiliarPost familiar) 
    {
        if (!ModelState.IsValid)
            return BadRequest(MessageResponse.GetReponse(1, "Datos inválidos", MessageType.Error));

        try
        {
            int result = Familiar.Post(familiar);
            if (result > 0)
                return Ok(MessageResponse.GetReponse(0, "Se ha registrado el familiar exitosamente con ID: " + result, MessageType.Success));
            else
                return Ok(MessageResponse.GetReponse(2, "No se pudo registrar el familiar", MessageType.Warning));
        }
        catch (Exception ex)
        {
            return StatusCode(500, MessageResponse.GetReponse(3, "Error interno: " + ex.Message, MessageType.Error));
        }
    }

    [HttpPut("{id}/{telefono}")]
    public ActionResult UpdateTelefono(int id, string telefono)
    {
        bool updated = Familiar.UpdateTelefono(id, telefono);
        if (updated)
            return Ok(MessageResponse.GetReponse(0, "Telefono actualizado correctamente", MessageType.Success));
        else
            return Ok(MessageResponse.GetReponse(2, "No se pudo actualizar el telefono", MessageType.Warning));
    }
}