using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;


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
}
