using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;

[Route("api/[controller]")]
[ApiController]
public class DispositivoController : ControllerBase
{
    [HttpGet]
    public ActionResult Get()
    {
        return Ok(DispositivoListResponse.GetResponse(Dispositivo.Get()));
    }

    [HttpGet("{id}")]
    public ActionResult Get(int id)
    {
        try
        {
            Dispositivo a = Dispositivo.Get(id);
            return Ok(DispositivoResponse.GetResponse(a));
        }
        catch (DispositivoNotFoundException e)
        {
            return Ok(MessageResponse.GetReponse(1, e.Message, MessageType.Error));
        }
        catch (Exception e)
        {
            return Ok(MessageResponse.GetReponse(999, e.Message, MessageType.CriticalError));
        }
    }

    [HttpPost("{direccion_MAC}/{nombre}")]
    public ActionResult Post(string direccion_MAC, string nombre)
    {
        try
        {
            int result = Dispositivo.post(direccion_MAC, nombre);
            if (result > 0)
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
    public ActionResult Put(int id)
    {
        bool updated = Dispositivo.Update(id);
        if (updated)
            return Ok(MessageResponse.GetReponse(0, "Dispositivo actualizado correctamente", MessageType.Success));
        else
            return Ok(MessageResponse.GetReponse(2, "No se pudo actualizar el asilo", MessageType.Warning));
    }
}