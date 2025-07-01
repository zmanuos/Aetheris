// PersonalController.cs
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

// Asegúrate de que tus DTOs y Models estén en los namespaces correctos
// (ej. using TuProyecto.Models; si PersonalCreateDto está en esa carpeta/namespace)
// (ej. using TuProyecto.Exceptions; si tus excepciones tienen un namespace específico)


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

<<<<<<< HEAD
    // NUEVO: Método para crear un nuevo Personal
    [HttpPost]
    public ActionResult CreatePersonal([FromBody] PersonalCreateDto personalDto)
    {
        // Valida el DTO usando Data Annotations
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState); // Devuelve errores de validación
        }

        try
        {
            Personal newPersonal = new Personal
            {
                firebaseUid = personalDto.FirebaseUid, // Asigna el UID de Firebase
                nombre = personalDto.Nombre,
                apellido = personalDto.Apellido,
                fecha_nacimiento = personalDto.Fecha_Nacimiento,
                genero = personalDto.Genero,
                telefono = personalDto.Telefono,
                activo = personalDto.Activo
            };

            int rowsAffected = newPersonal.Add(); // Llama al método Add del modelo

            if (rowsAffected > 0)
            {
                // Devolver 201 Created es apropiado para una creación exitosa
                // Podrías devolver el ID del nuevo personal si tu método Add lo obtuviera
                return StatusCode(201, MessageResponse.GetReponse(0, "Empleado creado exitosamente.", MessageType.Success));
            }
            else
            {
                // Esto podría indicar que la operación de inserción no afectó ninguna fila
                return StatusCode(500, MessageResponse.GetReponse(999, "No se pudo crear el empleado en la base de datos SQL (0 filas afectadas).", MessageType.Error));
            }
        }
        catch (MySql.Data.MySqlClient.MySqlException ex) // Captura excepciones específicas de MySQL
        {
            // Código 1062 es para entrada duplicada (ej. si firebase_uid ya existe y es UNIQUE)
            if (ex.Number == 1062) 
            {
                return Conflict(MessageResponse.GetReponse(2, "Ya existe un empleado con este Firebase UID o datos duplicados.", MessageType.Error));
            }
            // Otros errores de MySQL
            return StatusCode(500, MessageResponse.GetReponse(999, $"Error de base de datos MySQL: {ex.Message}", MessageType.CriticalError));
        }
        catch (Exception ex)
        {
            // Captura cualquier otra excepción inesperada
            return StatusCode(500, MessageResponse.GetReponse(999, $"Ocurrió un error inesperado al crear el empleado: {ex.Message}", MessageType.CriticalError));
        }
    }
}
=======
    [HttpPost]
    public ActionResult Post([FromForm] PersonalPost personal)
    {
        if (!ModelState.IsValid)
            return BadRequest(MessageResponse.GetReponse(1, "Datos inválidos", MessageType.Error));

        try
        {
            int result = Personal.RegistrarPersonal(personal);
            if (result > 0)
                return Ok(MessageResponse.GetReponse(0, "Se ha registrado el personal exitosamente", MessageType.Success));
            else
                return Ok(MessageResponse.GetReponse(2, "No se pudo registrar el personal", MessageType.Warning));
        }
        catch (Exception ex)
        {
            return StatusCode(500, MessageResponse.GetReponse(3, "Error interno: " + ex.Message, MessageType.Error));
        }
    }


    [HttpPut("{id}/{telefono}")]
    public ActionResult UpdateTelefono(int id, string telefono) 
    { 
        bool updated = Personal.UpdateTelefono(id, telefono);
        if (updated)
            return Ok(MessageResponse.GetReponse(0, "Telefono actualizado correctamente", MessageType.Success));
        else
            return Ok(MessageResponse.GetReponse(2, "No se pudo actualizar el telefono", MessageType.Warning));
    }

    [HttpPut("{id}")]
    public ActionResult UpdateEstado(int id)
    {
        bool updated = Personal.UpdateEstado(id);
        if (updated)
            return Ok(MessageResponse.GetReponse(0, "Estado del personal actualizado correctamente", MessageType.Success));
        else
            return Ok(MessageResponse.GetReponse(2, "No se pudo actualizar el estado del personal", MessageType.Warning));
    }



}
>>>>>>> 22b546b82f5b1d9fe5f8c30c1799cbc4f2314ed1
