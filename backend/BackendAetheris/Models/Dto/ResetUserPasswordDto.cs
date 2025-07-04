// Models/Dto/ResetUserPasswordDto.cs
using System.ComponentModel.DataAnnotations;

public class ResetUserPasswordDto
{
    [Required(ErrorMessage = "El UID de Firebase del usuario es requerido.")]
    public string FirebaseUid { get; set; } = string.Empty;
}