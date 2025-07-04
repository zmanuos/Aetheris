// Controllers/PersonalController.cs
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using FirebaseAdmin.Auth; // Todavía necesario para FirebaseAuthException y UserRecord
using Microsoft.AspNetCore.Authorization;


[Route("api/[controller]")]
[ApiController]
public class PersonalController : ControllerBase
{
    private readonly IFirebaseAuthService _firebaseAuthService; // Declaración del servicio inyectado

    // Constructor para inyección de dependencia
    public PersonalController(IFirebaseAuthService firebaseAuthService)
    {
        _firebaseAuthService = firebaseAuthService;
    }

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
                return Ok(MessageResponse.GetReponse(0, "Empleado creado exitosamente.", MessageType.Success));
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
                return Conflict(MessageResponse.GetReponse(2, "Ya existe un empleado con el mismo UID de Firebase o datos duplicados.", MessageType.Error));
            }
            return StatusCode(500, MessageResponse.GetReponse(999, $"Error de base de datos MySQL al crear: {ex.Message}", MessageType.CriticalError));
        }
        catch (Exception ex)
        {
            return StatusCode(500, MessageResponse.GetReponse(999, $"Ocurrió un error inesperado al crear el empleado: {ex.Message}", MessageType.CriticalError));
        }
    }

    [HttpPut("{id}")]
    public ActionResult UpdatePersonal(int id, [FromBody] PersonalUpdateDto personalDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            Personal existingPersonal = Personal.Get(id);

            existingPersonal.nombre = personalDto.Nombre;
            existingPersonal.apellido = personalDto.Apellido;
            existingPersonal.fecha_nacimiento = personalDto.Fecha_Nacimiento;
            existingPersonal.genero = personalDto.Genero;
            existingPersonal.telefono = personalDto.Telefono;
            existingPersonal.activo = personalDto.Activo;

            int rowsAffected = existingPersonal.Update();

            if (rowsAffected > 0)
            {
                return Ok(MessageResponse.GetReponse(0, "Empleado actualizado exitosamente.", MessageType.Success));
            }
            else
            {
                return StatusCode(500, MessageResponse.GetReponse(999, "No se pudo actualizar el empleado en la base de datos SQL (0 filas afectadas).", MessageType.Error));
            }
        }
        catch (PersonalNotFoundException e)
        {
            return NotFound(MessageResponse.GetReponse(1, e.Message, MessageType.Error));
        }
        catch (MySql.Data.MySqlClient.MySqlException ex)
        {
            if (ex.Number == 1062)
            {
                return Conflict(MessageResponse.GetReponse(2, "Ya existe un empleado con datos duplicados después de la actualización.", MessageType.Error));
            }
            return StatusCode(500, MessageResponse.GetReponse(999, $"Error de base de datos MySQL al actualizar: {ex.Message}", MessageType.CriticalError));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Ocurrió un error inesperado al actualizar el empleado: {ex.Message}" });
        }
    }

    [HttpPost("manage/update-email")]
    public async Task<ActionResult> UpdateUserEmail([FromBody] UpdateUserEmailDto updateDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            await _firebaseAuthService.UpdateUserEmailAsync(updateDto.FirebaseUid, updateDto.NewEmail);

            return Ok(new { message = "Correo electrónico del usuario actualizado exitosamente en Firebase." });
        }
        catch (FirebaseAuthException ex)
        {
            if (ex.AuthErrorCode == AuthErrorCode.UserNotFound)
            {
                return NotFound(new { message = "Usuario no encontrado en Firebase Authentication." });
            }
            if (ex.AuthErrorCode == AuthErrorCode.EmailAlreadyExists)
            {
                return Conflict(new { message = "El nuevo correo electrónico ya está en uso por otra cuenta de Firebase." });
            }
            return StatusCode(500, new { message = $"Error de Firebase: {ex.Message}", code = ex.AuthErrorCode.ToString() });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Ocurrió un error inesperado al actualizar el correo: {ex.Message}" });
        }
    }

    [HttpPost("manage/update-password")]
    public async Task<ActionResult> SetUserPasswordDirectly([FromBody] ResetPasswordDirectlyDto resetDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            await _firebaseAuthService.SetUserPasswordAsync(resetDto.FirebaseUid, resetDto.NewPassword);

            return Ok(new { message = "Contraseña del usuario actualizada exitosamente en Firebase." });
        }
        catch (FirebaseAuthException ex)
        {
            if (ex.AuthErrorCode == AuthErrorCode.UserNotFound)
            {
                return NotFound(new { message = "Usuario no encontrado en Firebase Authentication." });
            }
            return StatusCode(500, new { message = $"Error de Firebase: {ex.Message}", code = ex.AuthErrorCode.ToString() });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Ocurrió un error inesperado al establecer la contraseña: {ex.Message}" });
        }
    }

    [HttpGet("manage/get-correo/{firebaseUid}")]
    public async Task<ActionResult> GetFirebaseUserInfo(string firebaseUid)
    {
        try
        {
            UserRecord userRecord = await _firebaseAuthService.GetUserByUidAsync(firebaseUid);
            return Ok(new { email = userRecord.Email });
        }
        catch (FirebaseAuthException ex)
        {
            if (ex.AuthErrorCode == AuthErrorCode.UserNotFound)
            {
                return NotFound(new { message = "Usuario no encontrado en Firebase Authentication." });
            }
            return StatusCode(500, new { message = $"Error de Firebase: {ex.Message}", code = ex.AuthErrorCode.ToString() });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Ocurrió un error inesperado al obtener la información del usuario: {ex.Message}" });
        }
    }
}