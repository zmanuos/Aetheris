using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic; // Asegúrate de tener este using si no estaba
using System.Linq; // Asegúrate de tener este using si no estaba

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
            return Ok(CommonApiResponse.GetResponse(1, e.Message, MessageType.Error)); // Usar CommonApiResponse
        }
        catch (Exception e)
        {
            return Ok(CommonApiResponse.GetResponse(999, e.Message, MessageType.CriticalError)); // Usar CommonApiResponse
        }
    }


    [HttpPost]
    public ActionResult Post([FromForm]ResidentePost residente)
    {
        try
        {
            int result = Residente.Post(residente); 
            if (result > 0)
                // --- CAMBIO CLAVE AQUÍ: Usar CommonApiResponse y pasar el ID en el Data ---
                return Ok(CommonApiResponse.GetResponse(0, "Se ha registrado el residente exitosamente", MessageType.Success, new { id_residente = result }));
            else
                return Ok(CommonApiResponse.GetResponse(2, "No se pudo registrar el residente", MessageType.Warning));
        }
        catch (Exception ex)
        {
            return StatusCode(500, CommonApiResponse.GetResponse(3, "Error interno: " + ex.Message, MessageType.Error));
        }
    }


    [HttpPut("{residente}/{dispositivo}")]
    public ActionResult AsignarDispositivo(int residente, int dispositivo)
    {

        try
        {
            if (Residente.Update(residente, dispositivo) > 0)
            {
                return Ok(CommonApiResponse.GetResponse(0, "Dispositivo actualizado correctamente", MessageType.Success));
            } else
            {
                return Ok(CommonApiResponse.GetResponse(1, "No se pudo actualizar el dispositivo", MessageType.Error));
            }
            
        }
        catch (Exception e)
        {
            return Ok(CommonApiResponse.GetResponse(999, e.Message, MessageType.CriticalError));
        }
    }


    [HttpPut("{id}/{telefono}")]
    public ActionResult UpdateTelefono(int id, string telefono)
    {
        bool updated = Residente.UpdateTelefono(id, telefono);
        if (updated)
            return Ok(CommonApiResponse.GetResponse(0, "Telefono actualizado correctamente", MessageType.Success));
        else
            return Ok(CommonApiResponse.GetResponse(2, "No se pudo actualizar el telefono", MessageType.Warning));
    }

    [HttpPut("{id}")]
    public ActionResult UpdateEstado(int id)
    {
        bool updated = Residente.UpdateEstado(id);
        if (updated)
            return Ok(CommonApiResponse.GetResponse(0, "Estado del residente actualizado correctamente", MessageType.Success));
        else
            return Ok(CommonApiResponse.GetResponse(2, "No se pudo actualizar el estado del residente ", MessageType.Warning));
    }
}