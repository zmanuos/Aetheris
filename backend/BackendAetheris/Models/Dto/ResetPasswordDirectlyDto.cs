using System.ComponentModel.DataAnnotations;

public class ResetPasswordDirectlyDto
{
    [Required(ErrorMessage = "El FirebaseUid es requerido.")]
    public string FirebaseUid { get; set; } = string.Empty;

    [Required(ErrorMessage = "La nueva contraseña es requerida.")]
    [StringLength(100, MinimumLength = 6, ErrorMessage = "La contraseña debe tener al menos 6 caracteres y no exceder 100.")]
    public string NewPassword { get; set; } = string.Empty;
}