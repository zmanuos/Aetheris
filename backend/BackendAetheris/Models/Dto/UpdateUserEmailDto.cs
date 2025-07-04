// Models/Dto/UpdateUserEmailDto.cs
using System.ComponentModel.DataAnnotations;

public class UpdateUserEmailDto
{
    [Required(ErrorMessage = "El UID de Firebase del usuario es requerido.")]
    public string FirebaseUid { get; set; } = string.Empty;

    [Required(ErrorMessage = "El nuevo correo electrónico es requerido.")]
    [EmailAddress(ErrorMessage = "El formato del correo electrónico no es válido.")]
    public string NewEmail { get; set; } = string.Empty;
}