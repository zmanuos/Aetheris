
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;


[Route("api/[controller]")]
[ApiController]
public class UsuarioController : ControllerBase
{
    [HttpGet]
    public ActionResult Get()
    {
        return Ok( UsuarioListResponse.GetResponse(Usuario.Get()));
    }


    [HttpGet("{id}")]
    public ActionResult Get(int id)
    {
        try
        {
            Usuario a = Usuario.Get(id);
            return Ok(UsuarioResponse.GetResponse(a));
        }
        catch (UsuarioNotFoundException e)
        {
            return Ok(MessageResponse.GetReponse(1, e.Message, MessageType.Error));
        }
        catch (Exception e)
        {
            return Ok(MessageResponse.GetReponse(999, e.Message, MessageType.CriticalError));
        }
    }


    [HttpPut("{id}")]
    public ActionResult Put(int id)
    {
        bool updated = Usuario.Update(id);
        if (updated)
            return Ok(MessageResponse.GetReponse(0, "Asilo actualizado correctamente", MessageType.Success));
        else
            return Ok(MessageResponse.GetReponse(2, "No se pudo actualizar el asilo", MessageType.Warning));
    }


}