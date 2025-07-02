using Microsoft.AspNetCore.Http;
public class ResidentePhotoUploadDto
{
    public int IdResidente { get; set; }
    public IFormFile? FotoArchivo { get; set; }
}