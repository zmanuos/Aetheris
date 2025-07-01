// ParentescoController.cs
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic; // Necesario para List<Parentesco>

[Route("api/[controller]")] // Esto mapea a /api/Parentesco
[ApiController]
public class ParentescoController : ControllerBase
{
    [HttpGet] // Este es el método que responderá a GET /api/Parentesco
    public ActionResult Get()
    {
        try
        {
            // Llama al método Get() del modelo Parentesco para obtener la lista
            List<Parentesco> parentescos = Parentesco.Get(); // ASUME QUE PARENTESCO.GET() DEVUELVE UNA LISTA
            
            // Envuelve la lista de parentescos en tu MessageResponse para el frontend
            // Es crucial que 'parentescos' (la lista) vaya en el campo 'data'
            return Ok(MessageResponse.GetReponse(0, "Parentescos obtenidos exitosamente", MessageType.Success, parentescos));
        }
        catch (Exception e)
        {
            // Para depuración, puedes devolver un error 500 con el mensaje de excepción
            return StatusCode(500, MessageResponse.GetReponse(999, "Error interno al obtener parentescos: " + e.Message, MessageType.CriticalError));
        }
    }

    // Si tuvieras un GET por ID para Parentesco (ej. /api/Parentesco/1)
    // [HttpGet("{id}")]
    // public ActionResult Get(int id)
    // {
    //     try
    //     {
    //         Parentesco p = Parentesco.Get(id);
    //         if (p != null)
    //             return Ok(MessageResponse.GetReponse(0, "Parentesco obtenido", MessageType.Success, p));
    //         else
    //             return NotFound(MessageResponse.GetReponse(1, "Parentesco no encontrado", MessageType.Error));
    //     }
    //     catch (Exception e)
    //     {
    //         return StatusCode(500, MessageResponse.GetReponse(999, "Error al obtener parentesco por ID: " + e.Message, MessageType.CriticalError));
    //     }
    // }
}