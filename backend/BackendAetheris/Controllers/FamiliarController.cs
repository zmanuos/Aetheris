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
}
