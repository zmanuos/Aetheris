using System.ComponentModel.DataAnnotations;

public class FamiliarUpdateEmailDto
{
    [Required(ErrorMessage = "El UID de Firebase es obligatorio.")]
    public string firebaseUid { get; set; }

    [Required(ErrorMessage = "El nuevo correo es obligatorio.")]
    [EmailAddress(ErrorMessage = "El formato del correo no es válido.")]
    public string newEmail { get; set; }
}