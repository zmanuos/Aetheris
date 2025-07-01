
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;


[Route("api/[controller]")]
[ApiController]
public class PersonalController : ControllerBase
{
    [HttpGet]
    public ActionResult Get()
    {
        return Ok(PersonalListResponse.GetResponse(Personal.Get()));
    }


    [HttpGet("{id}")]
    public ActionResult Get(int id)
    {
        try
        {
            Personal a = Personal.Get(id);
            return Ok(PersonalResponse.GetResponse(a));
        }
        catch (PersonalNotFoundException e)
        {
            return Ok(MessageResponse.GetReponse(1, e.Message, MessageType.Error));
        }
        catch (Exception e)
        {
            return Ok(MessageResponse.GetReponse(999, e.Message, MessageType.CriticalError));
        }
    }

    [HttpPost]
    public ActionResult Post([FromForm] PersonalPost personal)
    {
        if (!ModelState.IsValid)
            return BadRequest(MessageResponse.GetReponse(1, "Datos inválidos", MessageType.Error));

        try
        {
            int result = Personal.RegistrarPersonal(personal);
            if (result > 0)
                return Ok(MessageResponse.GetReponse(0, "Se ha registrado el personal exitosamente", MessageType.Success));
            else
                return Ok(MessageResponse.GetReponse(2, "No se pudo registrar el personal", MessageType.Warning));
        }
        catch (Exception ex)
        {
            return StatusCode(500, MessageResponse.GetReponse(3, "Error interno: " + ex.Message, MessageType.Error));
        }
    }


    [HttpPut("{id}/{telefono}")]
    public ActionResult UpdateTelefono(int id, string telefono) 
    { 
        bool updated = Personal.UpdateTelefono(id, telefono);
        if (updated)
            return Ok(MessageResponse.GetReponse(0, "Telefono actualizado correctamente", MessageType.Success));
        else
            return Ok(MessageResponse.GetReponse(2, "No se pudo actualizar el telefono", MessageType.Warning));
    }

    [HttpPut("{id}")]
    public ActionResult UpdateEstado(int id)
    {
        bool updated = Personal.UpdateEstado(id);
        if (updated)
            return Ok(MessageResponse.GetReponse(0, "Estado del personal actualizado correctamente", MessageType.Success));
        else
            return Ok(MessageResponse.GetReponse(2, "No se pudo actualizar el estado del personal", MessageType.Warning));
    }



}
