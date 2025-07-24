using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks; // Necesario para métodos asíncronos
using FirebaseAdmin.Auth; // Necesario para FirebaseAuthException y UserRecord

[Route("api/[controller]")]
[ApiController]
public class FamiliarController : ControllerBase
{
    private readonly IFirebaseAuthService _firebaseAuthService; // Declaración del servicio inyectado

    // Constructor para inyección de dependencia
    public FamiliarController(IFirebaseAuthService firebaseAuthService)
    {
        _firebaseAuthService = firebaseAuthService;
    }

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

    [HttpGet("firebase/{firebaseUid}")]
    public ActionResult GetByFirebaseUid(string firebaseUid)
    {
        try
        {
            Familiar f = Familiar.GetByFirebaseUid(firebaseUid);
            return Ok(FamiliarResponse.GetResponse(f));
        }
        catch (FamiliarNotFoundException e)
        {
            return NotFound(MessageResponse.GetReponse(1, e.Message, MessageType.Error));
        }
        catch (Exception e)
        {
            return StatusCode(500, MessageResponse.GetReponse(999, e.Message, MessageType.CriticalError));
        }
    }

    [HttpGet("byresidente/{idResidente}")]
    public ActionResult GetByResidenteId(int idResidente)
    {
        try
        {
            List<Familiar> familiares = Familiar.GetByResidenteId(idResidente);
            if (familiares.Count > 0)
            {
                return Ok(FamiliarListResponse.GetResponse(familiares));
            }
            else
            {
                return NotFound(MessageResponse.GetReponse(1, $"No se encontraron familiares para el Residente con ID: {idResidente}", MessageType.Error));
            }
        }
        catch (Exception e)
        {
            return StatusCode(500, MessageResponse.GetReponse(999, e.Message, MessageType.CriticalError));
        }
    }

    [HttpPost]
    public ActionResult Post([FromForm] FamiliarPost familiar)
    {
        if (!ModelState.IsValid)
            return BadRequest(MessageResponse.GetReponse(1, "Datos inválidos", MessageType.Error));

        try
        {
            int result = Familiar.Post(familiar);
            if (result > 0)
                return Ok(MessageResponse.GetReponse(0, "Se ha registrado el familiar exitosamente con ID: " + result, MessageType.Success));
            else
                return Ok(MessageResponse.GetReponse(2, "No se pudo registrar el familiar", MessageType.Warning));
        }
        catch (Exception ex)
        {
            return StatusCode(500, MessageResponse.GetReponse(3, "Error interno: " + ex.Message, MessageType.Error));
        }
    }

    [HttpPut("{id}/{telefono}")]
    public ActionResult UpdateTelefono(int id, string telefono)
    {
        bool updated = Familiar.UpdateTelefono(id, telefono);
        if (updated)
            return Ok(MessageResponse.GetReponse(0, "Telefono actualizado correctamente", MessageType.Success));
        else
            return Ok(MessageResponse.GetReponse(2, "No se pudo actualizar el telefono", MessageType.Warning));
    }

    [HttpPut]
    public ActionResult UpdateFamiliar([FromBody] FamiliarPutDto familiarDto)
    {
        if (!ModelState.IsValid)
            return BadRequest(MessageResponse.GetReponse(1, "Datos inválidos para la actualización", MessageType.Error));

        try
        {
            Familiar existingFamiliar = Familiar.Get(familiarDto.id);

            Residente residente = Residente.Get(familiarDto.id_residente);
            if (residente == null)
            {
                return NotFound(MessageResponse.GetReponse(4, $"Residente con ID {familiarDto.id_residente} no encontrado.", MessageType.Error));
            }

            Parentesco parentesco = Parentesco.Get(familiarDto.id_parentesco);
            if (parentesco == null)
            {
                return NotFound(MessageResponse.GetReponse(5, $"Parentesco con ID {familiarDto.id_parentesco} no encontrado.", MessageType.Error));
            }

            existingFamiliar.nombre = familiarDto.nombre;
            existingFamiliar.apellido = familiarDto.apellido;
            existingFamiliar.fecha_nacimiento = familiarDto.fechaNacimiento;
            existingFamiliar.genero = familiarDto.genero;
            existingFamiliar.telefono = familiarDto.telefono;
            existingFamiliar.firebase_uid = familiarDto.firebase_uid;
            existingFamiliar.residente = residente;
            existingFamiliar.parentesco = parentesco;

            bool updated = Familiar.Update(existingFamiliar);

            if (updated)
                return Ok(MessageResponse.GetReponse(0, "Familiar actualizado correctamente", MessageType.Success));
            else
                return Ok(MessageResponse.GetReponse(2, "No se pudo actualizar el familiar", MessageType.Warning));
        }
        catch (FamiliarNotFoundException e)
        {
            return NotFound(MessageResponse.GetReponse(1, e.Message, MessageType.Error));
        }
        catch (Exception ex)
        {
            return StatusCode(500, MessageResponse.GetReponse(3, "Error interno al actualizar el familiar: " + ex.Message, MessageType.Error));
        }
    }

    // NUEVO ENDPOINT: Obtener el correo del familiar por el id de firebase.
    [HttpGet("email/firebase/{firebaseUid}")]
    public async Task<ActionResult> GetFamiliarEmailByFirebaseUid(string firebaseUid)
    {
        try
        {
            UserRecord userRecord = await _firebaseAuthService.GetUserByUidAsync(firebaseUid);
            return Ok(EmailResponse.GetResponse(userRecord.Email));
        }
        catch (FirebaseAuthException ex)
        {
            if (ex.AuthErrorCode == AuthErrorCode.UserNotFound)
            {
                return NotFound(MessageResponse.GetReponse(1, "Familiar no encontrado en Firebase Authentication.", MessageType.Error));
            }
            return StatusCode(500, MessageResponse.GetReponse(999, $"Error de Firebase: {ex.Message}", MessageType.CriticalError));
        }
        catch (Exception ex)
        {
            return StatusCode(500, MessageResponse.GetReponse(999, $"Ocurrió un error inesperado al obtener el correo del familiar: {ex.Message}", MessageType.CriticalError));
        }
    }

    // NUEVO ENDPOINT: Cambiar la contraseña del correo del firebase del familiar, teniendo el id del firebase del familiar.
    [HttpPost("password/firebase")] // Se cambió a POST y toma un DTO para la nueva contraseña
    public async Task<ActionResult> UpdateFamiliarPasswordByFirebaseUid([FromBody] FamiliarUpdatePasswordDto updateDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            await _firebaseAuthService.SetUserPasswordAsync(updateDto.firebaseUid, updateDto.newPassword);
            return Ok(MessageResponse.GetReponse(0, "Contraseña del familiar actualizada exitosamente en Firebase.", MessageType.Success));
        }
        catch (FirebaseAuthException ex)
        {
            if (ex.AuthErrorCode == AuthErrorCode.UserNotFound)
            {
                return NotFound(MessageResponse.GetReponse(1, "Familiar no encontrado en Firebase Authentication.", MessageType.Error));
            }
            return StatusCode(500, MessageResponse.GetReponse(999, $"Error de Firebase: {ex.Message}", MessageType.CriticalError));
        }
        catch (Exception ex)
        {
            return StatusCode(500, MessageResponse.GetReponse(999, $"Ocurrió un error inesperado al actualizar la contraseña del familiar: {ex.Message}", MessageType.CriticalError));
        }
    }

    // NUEVO ENDPOINT: Cambiar el correo, teniendo como parametro el id del firebase del familiar.
    [HttpPost("email/firebase")] // Se cambió a POST para consistencia y toma un DTO
    public async Task<ActionResult> UpdateFamiliarEmail([FromBody] FamiliarUpdateEmailDto updateDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            await _firebaseAuthService.UpdateUserEmailAsync(updateDto.firebaseUid, updateDto.newEmail);
            return Ok(MessageResponse.GetReponse(0, "Correo electrónico del familiar actualizado exitosamente en Firebase.", MessageType.Success));
        }
        catch (FirebaseAuthException ex)
        {
            if (ex.AuthErrorCode == AuthErrorCode.UserNotFound)
            {
                return NotFound(MessageResponse.GetReponse(1, "Familiar no encontrado en Firebase Authentication.", MessageType.Error));
            }
            if (ex.AuthErrorCode == AuthErrorCode.EmailAlreadyExists)
            {
                return Conflict(MessageResponse.GetReponse(2, "El nuevo correo electrónico ya está en uso por otra cuenta de Firebase.", MessageType.Warning));
            }
            return StatusCode(500, MessageResponse.GetReponse(999, $"Error de Firebase: {ex.Message}", MessageType.CriticalError));
        }
        catch (Exception ex)
        {
            return StatusCode(500, MessageResponse.GetReponse(999, $"Ocurrió un error inesperado al actualizar el correo del familiar: {ex.Message}", MessageType.CriticalError));
        }
    }
}