using Microsoft.AspNetCore.Http; // Necesario para IFormFile

public class ResidentePhotoUploadDto
{
    public int IdResidente { get; set; }
    public IFormFile FotoArchivo { get; set; }
}