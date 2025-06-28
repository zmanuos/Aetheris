using Microsoft.AspNetCore.Mvc;
using System;

[Route("api/[controller]")]
[ApiController]
public class AreaController : ControllerBase
{
    [HttpGet]
    public ActionResult Get()
    {
        return Ok(AreaListResponse.GetResponse(Area.Get()));
    }

    [HttpGet("{id}")]
    public ActionResult Get(int id)
    {
        try
        {
            Area area = Area.Get(id);
            return Ok(AreaResponse.GetResponse(area));
        }
        catch (AreaNotFoundException e)
        {
            return Ok(MessageResponse.GetReponse(1, e.Message, MessageType.Error));
        }
        catch (Exception e)
        {
            return Ok(MessageResponse.GetReponse(999, e.Message, MessageType.CriticalError));
        }
    }
}
