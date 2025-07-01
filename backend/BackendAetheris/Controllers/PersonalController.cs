using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;


[Route("api/[controller]")]
[ApiController]
public class PersonalController : ControllerBase
{
    [HttpGet]
    public ActionResult Get()
    {
        return Ok(PersonalListResponse.GetResponse(Personal.Get()));
    }

    [HttpGet("{id}")]
    public ActionResult Get(int id)
    {
        try
        {
            Personal a = Personal.Get(id);
            return Ok(PersonalResponse.GetResponse(a));
        }
        catch (PersonalNotFoundException e)
        {
            return Ok(MessageResponse.GetReponse(1, e.Message, MessageType.Error));
        }
        catch (Exception e)
        {
            return Ok(MessageResponse.GetReponse(999, e.Message, MessageType.CriticalError));
        }
    }

    [HttpPost]
    public ActionResult CreatePersonal([FromBody] PersonalCreateDto personalDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            Personal newPersonal = new Personal
            {
                firebaseUid = personalDto.FirebaseUid,
                nombre = personalDto.Nombre,
                apellido = personalDto.Apellido,
                fecha_nacimiento = personalDto.Fecha_Nacimiento,
                genero = personalDto.Genero,
                telefono = personalDto.Telefono,
                activo = personalDto.Activo
            };

            int rowsAffected = newPersonal.Add();

            if (rowsAffected > 0)
            {
                return StatusCode(201, MessageResponse.GetReponse(0, "Empleado creado exitosamente.", MessageType.Success));
            }
            else
            {
                return StatusCode(500, MessageResponse.GetReponse(999, "No se pudo crear el empleado en la base de datos SQL (0 filas afectadas).", MessageType.Error));
            }
        }
        catch (MySql.Data.MySqlClient.MySqlException ex)
        {
            if (ex.Number == 1062)
            {
                return Conflict(MessageResponse.GetReponse(2, "Ya existe un empleado con este Firebase UID o datos duplicados.", MessageType.Error));
            }
            return StatusCode(500, MessageResponse.GetReponse(999, $"Error de base de datos MySQL: {ex.Message}", MessageType.CriticalError));
        }
        catch (Exception ex)
        {
            return StatusCode(500, MessageResponse.GetReponse(999, $"Ocurrió un error inesperado al crear el empleado: {ex.Message}", MessageType.CriticalError));
        }
    }
}