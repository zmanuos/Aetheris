using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System; // Asegúrate de incluirlo para Exception

[Route("api/[controller]")]
[ApiController]
public class NotificacionesCombinadasController : ControllerBase
{
    [HttpGet]
    public ActionResult GetLatest()
    {
        try
        {
            List<NotificacionCombinada> latestNotifications = NotificacionesData.GetLatestCombinedNotifications(10);
            return Ok(NotificacionesCombinadasResponse.GetResponse(latestNotifications));
        }
        catch (Exception ex)
        {
            // Puedes usar tu clase MessageResponse si lo prefieres para una respuesta de error consistente
            // return StatusCode(500, MessageResponse.GetReponse(500, "Error interno del servidor: " + ex.Message, MessageType.Error));
            return StatusCode(500, new { message = "Error interno del servidor al obtener notificaciones: " + ex.Message });
        }
    }
}