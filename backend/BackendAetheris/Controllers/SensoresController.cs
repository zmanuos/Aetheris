using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using BackendAetheris.Models.Dto;

[ApiController]
[Route("api/[controller]")]
public class SensoresController : ControllerBase
{
    private readonly WebSocketHandler _webSocketHandler;

    public SensoresController(WebSocketHandler webSocketHandler)
    {
        _webSocketHandler = webSocketHandler;
    }

    [HttpPost]
    public async Task<IActionResult> RecibirDatos([FromForm] DatosSensorDto datos)
    {
        // Serializa los datos y envíalos a todos los clientes WebSocket conectados
        var json = JsonSerializer.Serialize(datos);
        await _webSocketHandler.SendMessageToAllAsync(json);
        return Ok();
    }
}