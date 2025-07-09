using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.IO;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

[Route("api/[controller]")]
[ApiController]
public class ResidenteController : ControllerBase
{
    private readonly IWebHostEnvironment _hostingEnvironment;
    private readonly ILogger<ResidenteController> _logger;

    public ResidenteController(IWebHostEnvironment hostingEnvironment, ILogger<ResidenteController> logger)
    {
        _hostingEnvironment = hostingEnvironment;
        _logger = logger;
    }

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
            if (a == null)
            {
                _logger.LogWarning($"GET Residente/{id} - Residente no encontrado.");
                return Ok(CommonApiResponse.GetResponse(1, "Residente no encontrado", MessageType.Error));
            }
            return Ok(ResidenteResponse.GetResponse(a));
        }
        catch (Exception e)
        {
            _logger.LogError(e, $"GET Residente/{id} - Error crítico inesperado.");
            return Ok(CommonApiResponse.GetResponse(999, e.Message, MessageType.CriticalError));
        }
    }

    [HttpPost]
    public ActionResult Post([FromForm]ResidentePost residente)
    {
        _logger.LogInformation($"POST Residente: Intentando registrar residente {residente.nombre} {residente.apellido}");
        try
        {
            int newResidentId = Residente.Post(residente);
            if (newResidentId > 0)
            {
                _logger.LogInformation($"POST Residente: Residente {residente.nombre} {residente.apellido} registrado con ID: {newResidentId}");
                return Ok(CommonApiResponse.GetResponse(0, "Se ha registrado el residente exitosamente", MessageType.Success, new { id_residente = newResidentId }));
            }
            else
            {
                _logger.LogWarning($"POST Residente: No se pudo registrar el residente {residente.nombre} {residente.apellido}. No se obtuvo ID.");
                return Ok(CommonApiResponse.GetResponse(2, "No se pudo registrar el residente", MessageType.Warning));
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"POST Residente: Error interno al registrar residente {residente.nombre} {residente.apellido}.");
            return StatusCode(500, CommonApiResponse.GetResponse(3, "Error interno al registrar residente: " + ex.Message, MessageType.Error));
        }
    }

    [HttpPost("UploadPhoto")]
    public async Task<ActionResult> UploadPhoto([FromForm] ResidentePhotoUploadDto model)
    {
        int id_residente = model.IdResidente;
        IFormFile file = model.FotoArchivo;

        _logger.LogInformation($"[UploadPhoto] Intentando subir foto para residente ID: {id_residente}");

        if (file == null || file.Length == 0)
        {
            _logger.LogWarning($"[UploadPhoto] ID: {id_residente} - Archivo no proporcionado o vacío.");
            return BadRequest(CommonApiResponse.GetResponse(1, "No se ha proporcionado ningún archivo de foto.", MessageType.Error));
        }
        if (!file.ContentType.StartsWith("image/"))
        {
            _logger.LogWarning($"[UploadPhoto] ID: {id_residente} - Archivo no es una imagen válida. ContentType: {file.ContentType}");
            return BadRequest(CommonApiResponse.GetResponse(1, "El archivo no es una imagen válida.", MessageType.Error));
        }
        if (file.Length > 5 * 1024 * 1024)
        {
            _logger.LogWarning($"[UploadPhoto] ID: {id_residente} - La imagen excede el tamaño máximo. Tamaño: {file.Length} bytes.");
            return BadRequest(CommonApiResponse.GetResponse(1, "La imagen excede el tamaño máximo permitido (5MB).", MessageType.Error));
        }

        try
        {
            string uploadsFolder = Path.Combine(_hostingEnvironment.WebRootPath, "images", "residents");
            _logger.LogInformation($"[UploadPhoto] ID: {id_residente} - Carpeta de destino de fotos: {uploadsFolder}");

            if (!Directory.Exists(uploadsFolder))
            {
                _logger.LogInformation($"[UploadPhoto] ID: {id_residente} - La carpeta de destino no existe, intentando crearla.");
                Directory.CreateDirectory(uploadsFolder);
            }

            string fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (string.IsNullOrEmpty(fileExtension)) {
                fileExtension = ".png";
            }
            string fileNameToSave = $"{id_residente}{fileExtension}";
            string filePath = Path.Combine(uploadsFolder, fileNameToSave);
            _logger.LogInformation($"[UploadPhoto] ID: {id_residente} - Ruta completa del archivo a guardar: {filePath} con nombre '{fileNameToSave}'.");

            string[] commonImageExtensions = { ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".tiff" };
            foreach (string ext in commonImageExtensions)
            {
                string oldFilePath = Path.Combine(uploadsFolder, $"{id_residente}{ext}");
                if (System.IO.File.Exists(oldFilePath) && oldFilePath != filePath)
                {
                    try
                    {
                        System.IO.File.Delete(oldFilePath);
                        _logger.LogInformation($"[UploadPhoto] ID: {id_residente} - Foto existente '{Path.GetFileName(oldFilePath)}' eliminada.");
                    }
                    catch (Exception deleteEx)
                    {
                        _logger.LogWarning($"[UploadPhoto] ID: {id_residente} - No se pudo eliminar la foto antigua '{Path.GetFileName(oldFilePath)}': {deleteEx.Message}");
                    }
                }
            }

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }
            _logger.LogInformation($"[UploadPhoto] ID: {id_residente} - Archivo '{fileNameToSave}' guardado físicamente.");

            bool updated = Residente.UpdateFoto(id_residente, fileNameToSave);

            if (updated)
            {
                _logger.LogInformation($"[UploadPhoto] ID: {id_residente} - Ruta de foto '{fileNameToSave}' actualizada exitosamente en la base de datos.");
                return Ok(CommonApiResponse.GetResponse(0, $"Foto de residente {id_residente} subida y actualizada exitosamente.", MessageType.Success, new { fileName = fileNameToSave }));
            }
            else
            {
                _logger.LogError($"[UploadPhoto] ID: {id_residente} - Foto subida ('{fileNameToSave}'), pero fallo al actualizar el registro del residente en la base de datos.");
                if (System.IO.File.Exists(filePath))
                {
                    System.IO.File.Delete(filePath);
                    _logger.LogWarning($"[UploadPhoto] ID: {id_residente} - Archivo '{fileNameToSave}' eliminado por fallo en DB.");
                }
                return StatusCode(500, CommonApiResponse.GetResponse(2, "Foto subida, pero no se pudo actualizar el registro del residente en la base de datos.", MessageType.Error));
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"[UploadPhoto] ID: {id_residente} - Error interno del servidor al subir la foto.");
            return StatusCode(500, CommonApiResponse.GetResponse(3, $"Error interno del servidor al subir la foto: {ex.Message}", MessageType.CriticalError));
        }
    }

    [HttpPut("{residenteId}/dispositivo/{dispositivoId?}")] // '?' makes dispositivoId optional
    public ActionResult AsignarDispositivo(int residenteId, int? dispositivoId) // 'int?' allows null
    {
        _logger.LogInformation($"PUT AsignarDispositivo: Residente {residenteId}, Dispositivo {dispositivoId}");
        try
        {
            // If dispositivoId is null, treat it as 0 for de-assignment
            int deviceToAssign = dispositivoId.GetValueOrDefault(0);

            if (Residente.Update(residenteId, deviceToAssign) > 0)
            {
                if (deviceToAssign == 0)
                {
                    _logger.LogInformation($"PUT AsignarDispositivo: Dispositivo desasignado correctamente para residente {residenteId}.");
                    return Ok(CommonApiResponse.GetResponse(0, "Dispositivo desasignado correctamente", MessageType.Success));
                }
                else
                {
                    _logger.LogInformation($"PUT AsignarDispositivo: Dispositivo actualizado correctamente para residente {residenteId}.");
                    return Ok(CommonApiResponse.GetResponse(0, "Dispositivo actualizado correctamente", MessageType.Success));
                }
            } else
            {
                _logger.LogWarning($"PUT AsignarDispositivo: No se pudo actualizar/desasignar el dispositivo para residente {residenteId}.");
                return Ok(CommonApiResponse.GetResponse(1, "No se pudo actualizar/desasignar el dispositivo", MessageType.Error));
            }

        }
        catch (Exception e)
        {
            _logger.LogError(e, $"PUT AsignarDispositivo: Error crítico inesperado para residente {residenteId}, dispositivo {dispositivoId}.");
            return Ok(CommonApiResponse.GetResponse(999, e.Message, MessageType.CriticalError));
        }
    }

    [HttpPut("{id}/telefono/{telefono}")]
    public ActionResult UpdateTelefono(int id, string telefono)
    {
        _logger.LogInformation($"PUT UpdateTelefono: Residente {id}, Teléfono {telefono}");
        bool updated = Residente.UpdateTelefono(id, telefono);
        if (updated)
        {
            _logger.LogInformation($"PUT UpdateTelefono: Teléfono actualizado correctamente para residente {id}.");
            return Ok(CommonApiResponse.GetResponse(0, "Telefono actualizado correctamente", MessageType.Success));
        }
        else
        {
            _logger.LogWarning($"PUT UpdateTelefono: No se pudo actualizar el teléfono para residente {id}.");
            return Ok(CommonApiResponse.GetResponse(2, "No se pudo actualizar el telefono", MessageType.Warning));
        }
    }

    [HttpPut("{id}")]
    public ActionResult UpdateEstado(int id)
    {
        _logger.LogInformation($"PUT UpdateEstado: Residente {id}");
        bool updated = Residente.UpdateEstado(id);
        if (updated)
        {
            _logger.LogInformation($"PUT UpdateEstado: Estado del residente {id} actualizado correctamente.");
            return Ok(CommonApiResponse.GetResponse(0, "Estado del residente actualizado correctamente", MessageType.Success));
        }
        else
        {
            _logger.LogWarning($"PUT UpdateEstado: No se pudo actualizar el estado del residente {id}.");
            return Ok(CommonApiResponse.GetResponse(2, "No se pudo actualizar el estado del residente ", MessageType.Warning));
        }
    }

    [HttpPut("ritmo")]
    public ActionResult UpdatePromedioRitmos([FromForm] int id, [FromForm] int promedioReposo, [FromForm] int promedioActivo, [FromForm] int promedioAgitado)
    {
        _logger.LogInformation($"PUT UpdatePromedioRitmos: Residente {id}");
        bool updated = Residente.UpdatePromedioRitmos(id, promedioReposo, promedioActivo, promedioAgitado);
        if (updated)
        {
            _logger.LogInformation($"PUT UpdatePromedioRitmos: Ritmos promedios del residente con id {id} actualizado correctamente.");
            return Ok(CommonApiResponse.GetResponse(0, "Ritmos promedios actualizados correctamente", MessageType.Success));
        }
        else
        {
            _logger.LogWarning($"PUT UpdatePromedioRitmos: No se pudieron actualizar los ritmos promedio del residente {id}.");
            return Ok(CommonApiResponse.GetResponse(2, "No se pudo actualizar los ritmos promedio", MessageType.Warning));
        }
    }

    [HttpPut("ritmo/reposo")]
    public ActionResult UpdatePromedioReposo([FromForm]int id, [FromForm] int promedio)
    {
        _logger.LogInformation($"PUT UpdatePromedioReposo: Residente {id}");
        bool updated = Residente.UpdatePromedioReposo(id, promedio);
        if (updated)
        {
            _logger.LogInformation($"PUT UpdatePromedioReposo: Ritmo promedio en reposo de {promedio} del residente con id {id} actualizado correctamente.");
            return Ok(CommonApiResponse.GetResponse(0, "Ritmo promedio en reposo actualizado correctamente", MessageType.Success));
        }
        else
        {
            _logger.LogWarning($"PUT UpdatePromedioReposo: No se pudo actualizar el ritmo promedio en reposo del residente {id}.");
            return Ok(CommonApiResponse.GetResponse(2, "No se pudo actualizar el ritmo promedio en reposo", MessageType.Warning));
        }
    }

    [HttpPut("ritmo/activo")]
    public ActionResult UpdatePromedioActivo([FromForm] int id, [FromForm] int promedio)
    {
        _logger.LogInformation($"PUT UpdatePromedioActivo: Residente {id}");
        bool updated = Residente.UpdatePromedioActivo(id, promedio);
        if (updated)
        {
            _logger.LogInformation($"PUT UpdatePromedioActivo: Ritmo promedio activado de {promedio} del residente con id {id} actualizado correctamente.");
            return Ok(CommonApiResponse.GetResponse(0, "Ritmo promedio activado actualizado correctamente", MessageType.Success));
        }
        else
        {
            _logger.LogWarning($"PUT UpdatePromedioActivo: No se pudo actualizar el ritmo promedio activado del residente {id}.");
            return Ok(CommonApiResponse.GetResponse(2, "No se pudo actualizar el ritmo promedio activado ", MessageType.Warning));
        }
    }

    [HttpPut("ritmo/agitado")]
    public ActionResult UpdatePromedioAgitado([FromForm] int id, [FromForm] int promedio)
    {
        _logger.LogInformation($"PUT UpdatePromedioAgitado: Residente {id}");
        bool updated = Residente.UpdatePromedioAgitado(id, promedio);
        if (updated)
        {
            _logger.LogInformation($"PUT UpdatePromedioAgitado: Ritmo promedio agitado de {promedio} del residente con id {id} actualizado correctamente.");
            return Ok(CommonApiResponse.GetResponse(0, "Ritmo promedio agitado actualizado correctamente", MessageType.Success));
        }
        else
        {
            _logger.LogWarning($"PUT UpdatePromedioAgitado: No se pudo actualizar el ritmo promedio agitado del residente {id}.");
            return Ok(CommonApiResponse.GetResponse(2, "No se pudo actualizar el ritmo promedio agitado ", MessageType.Warning));
        }
    }
}