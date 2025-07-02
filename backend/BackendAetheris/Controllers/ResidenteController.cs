using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.IO; // Necesario para FileStream y Path
using Microsoft.AspNetCore.Hosting; // Necesario para IWebHostEnvironment
using Microsoft.AspNetCore.Http; // Necesario para IFormFile
using Microsoft.Extensions.Logging;
// Asumo que ResidentePhotoUploadDto está en el mismo namespace raíz o en una carpeta de modelos accesible
// using YourProjectNamespace.Models; // Ejemplo si está en una carpeta Models

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
        // Asumo que ResidenteListResponse y CommonApiResponse están definidas
        return Ok(ResidenteListResponse.GetResponse(Residente.Get()));
    }

    [HttpGet("{id}")]
    public ActionResult Get(int id)
    {
        try
        {
            Residente a = Residente.Get(id);
            if (a == null) // Manejar el caso si Get(id) retorna null ahora
            {
                _logger.LogWarning($"GET Residente/{id} - Residente no encontrado.");
                return Ok(CommonApiResponse.GetResponse(1, "Residente no encontrado", MessageType.Error));
            }
            // Asumo que ResidenteResponse está definida
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
            // El método Post ahora devuelve el ID insertado
            int newResidentId = Residente.Post(residente);
            if (newResidentId > 0)
            {
                _logger.LogInformation($"POST Residente: Residente {residente.nombre} {residente.apellido} registrado con ID: {newResidentId}");
                // Importante: Devolver el ID en la respuesta para que el frontend lo use
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
            // Asumo que CommonApiResponse y MessageType están definidos
            return StatusCode(500, CommonApiResponse.GetResponse(3, "Error interno al registrar residente: " + ex.Message, MessageType.Error));
        }
    }

    // --- ENDPOINT MODIFICADO PARA SUBIR LA FOTO ---
    [HttpPost("UploadPhoto")]
    public async Task<ActionResult> UploadPhoto([FromForm] ResidentePhotoUploadDto model)
    {
        int id_residente = model.IdResidente;
        IFormFile file = model.FotoArchivo;

        _logger.LogInformation($"[UploadPhoto] Intentando subir foto para residente ID: {id_residente}");

        // Validaciones básicas del archivo
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
        if (file.Length > 5 * 1024 * 1024) // 5 MB de límite
        {
            _logger.LogWarning($"[UploadPhoto] ID: {id_residente} - La imagen excede el tamaño máximo. Tamaño: {file.Length} bytes.");
            return BadRequest(CommonApiResponse.GetResponse(1, "La imagen excede el tamaño máximo permitido (5MB).", MessageType.Error));
        }

        try
        {
            // Ruta de la carpeta donde se guardarán las imágenes
            string uploadsFolder = Path.Combine(_hostingEnvironment.WebRootPath, "images", "residents");
            _logger.LogInformation($"[UploadPhoto] ID: {id_residente} - Carpeta de destino de fotos: {uploadsFolder}");

            // Crear la carpeta si no existe
            if (!Directory.Exists(uploadsFolder))
            {
                _logger.LogInformation($"[UploadPhoto] ID: {id_residente} - La carpeta de destino no existe, intentando crearla.");
                Directory.CreateDirectory(uploadsFolder);
            }

            // Generar nombre de archivo basado en id_residente y la extensión original
            string fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (string.IsNullOrEmpty(fileExtension)) {
                fileExtension = ".png"; // Fallback por si la extensión no viene en el nombre original
            }
            string fileNameToSave = $"{id_residente}{fileExtension}"; // ¡Usamos el ID como nombre!
            string filePath = Path.Combine(uploadsFolder, fileNameToSave);
            _logger.LogInformation($"[UploadPhoto] ID: {id_residente} - Ruta completa del archivo a guardar: {filePath} con nombre '{fileNameToSave}'.");

            // Opcional y recomendado: Eliminar cualquier foto anterior asociada a este residente con diferentes extensiones
            // Esto asegura que solo haya UNA foto para ese ID en la carpeta y no queden "huérfanas" si se cambia el formato.
            string[] commonImageExtensions = { ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".tiff" }; // Lista de extensiones comunes a revisar
            foreach (string ext in commonImageExtensions)
            {
                string oldFilePath = Path.Combine(uploadsFolder, $"{id_residente}{ext}");
                // Verificar que exista y no sea la misma ruta que la nueva foto que se va a guardar
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

            // Guardar el nuevo archivo físicamente
            using (var stream = new FileStream(filePath, FileMode.Create)) // FileMode.Create sobrescribe si ya existe un archivo con ese nombre EXACTO
            {
                await file.CopyToAsync(stream);
            }
            _logger.LogInformation($"[UploadPhoto] ID: {id_residente} - Archivo '{fileNameToSave}' guardado físicamente.");

            // Actualizar la base de datos con el nuevo nombre de archivo
            bool updated = Residente.UpdateFoto(id_residente, fileNameToSave);

            if (updated)
            {
                _logger.LogInformation($"[UploadPhoto] ID: {id_residente} - Ruta de foto '{fileNameToSave}' actualizada exitosamente en la base de datos.");
                return Ok(CommonApiResponse.GetResponse(0, $"Foto de residente {id_residente} subida y actualizada exitosamente.", MessageType.Success, new { fileName = fileNameToSave }));
            }
            else
            {
                _logger.LogError($"[UploadPhoto] ID: {id_residente} - Foto subida ('{fileNameToSave}'), pero fallo al actualizar el registro del residente en la base de datos.");
                // Si falla la actualización en DB, intenta eliminar el archivo que acabas de subir para no dejar basura
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

    [HttpPut("{residente}/{dispositivo}")]
    public ActionResult AsignarDispositivo(int residente, int dispositivo)
    {
        _logger.LogInformation($"PUT AsignarDispositivo: Residente {residente}, Dispositivo {dispositivo}");
        try
        {
            if (Residente.Update(residente, dispositivo) > 0)
            {
                _logger.LogInformation($"PUT AsignarDispositivo: Dispositivo actualizado correctamente para residente {residente}.");
                return Ok(CommonApiResponse.GetResponse(0, "Dispositivo actualizado correctamente", MessageType.Success));
            } else
            {
                _logger.LogWarning($"PUT AsignarDispositivo: No se pudo actualizar el dispositivo para residente {residente}.");
                return Ok(CommonApiResponse.GetResponse(1, "No se pudo actualizar el dispositivo", MessageType.Error));
            }

        }
        catch (Exception e)
        {
            _logger.LogError(e, $"PUT AsignarDispositivo: Error crítico inesperado para residente {residente}, dispositivo {dispositivo}.");
            return Ok(CommonApiResponse.GetResponse(999, e.Message, MessageType.CriticalError));
        }
    }

    [HttpPut("{id}/{telefono}")]
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
}