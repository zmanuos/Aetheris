using System.ComponentModel.DataAnnotations;

public class FamiliarUpdatePasswordDto
{
    [Required(ErrorMessage = "El UID de Firebase es obligatorio.")]
    public string firebaseUid { get; set; }

    [Required(ErrorMessage = "La nueva contraseña es obligatoria.")]
    [StringLength(100, MinimumLength = 6, ErrorMessage = "La contraseña debe tener al menos 6 caracteres.")]
    public string newPassword { get; set; }
}