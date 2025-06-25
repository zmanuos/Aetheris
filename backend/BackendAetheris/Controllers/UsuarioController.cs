/*
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;


[Route("api/[controller]")]
[ApiController]
public class Controller : ControllerBase
{
    [HttpGet]
    public ActionResult Get()
    {
        return Ok( ListResponse.GetResponse( .Get()));
    }


    [HttpGet("{id}")]
    public ActionResult Get(int id)
    {
        try
        {
            Residente a = Residente.Get(id);
            return Ok(Response.GetResponse(a));
        }
        catch (NotFoundException e)
        {
            return Ok(MessageResponse.GetReponse(1, e.Message, MessageType.Error));
        }
        catch (Exception e)
        {
            return Ok(MessageResponse.GetReponse(999, e.Message, MessageType.CriticalError));
        }
    }

  
}
*/