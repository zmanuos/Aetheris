using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;


[Route("api/[controller]")]
[ApiController]
public class ResidenteController : ControllerBase
{
    [HttpGet]
    public ActionResult Get()
    {
        return Ok(ResidenteListResponse.GetResponse(Residente.Get()));
    }


    [HttpGet("{id}")]
    public ActionResult Get(int id)
    {
        try
        {
            Residente a = Residente.Get(id);
            return Ok(ResidenteResponse.GetResponse(a));
        }
        catch (ResidenteNotFoundException e)
        {
            return Ok(MessageResponse.GetReponse(1, e.Message, MessageType.Error));
        }
        catch (Exception e)
        {
            return Ok(MessageResponse.GetReponse(999, e.Message, MessageType.CriticalError));
        }
    }

  
}
