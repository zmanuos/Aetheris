using System;
using System.ComponentModel.DataAnnotations;

public class FamiliarPost
{
    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [StringLength(100, ErrorMessage = "El nombre no puede exceder 100 caracteres.")]
    public string nombre { get; set; } = string.Empty;

    [Required(ErrorMessage = "El apellido es obligatorio.")]
    [StringLength(100, ErrorMessage = "El apellido no puede exceder 100 caracteres.")]
    public string apellido { get; set; } = string.Empty;

    [Required(ErrorMessage = "La fecha de nacimiento es obligatoria.")]
    public DateTime fechaNacimiento { get; set; } = default;

    [Required(ErrorMessage = "El género es obligatorio.")]
    [StringLength(10, ErrorMessage = "El género no puede exceder 10 caracteres.")]
    public string genero { get; set; } = string.Empty;

    [Required(ErrorMessage = "El teléfono es obligatorio.")]
    [StringLength(15, ErrorMessage = "El teléfono no puede exceder 15 caracteres.")]
    public string telefono { get; set; } = string.Empty;

    [Required(ErrorMessage = "El ID del residente es obligatorio.")]
    public int id_residente { get; set; }

    [Required(ErrorMessage = "El parentesco es obligatorio.")]
    public int id_parentesco { get; set; }

    [Required(ErrorMessage = "El UID de Firebase es obligatorio.")]
    [StringLength(28, MinimumLength = 28, ErrorMessage = "El UID de Firebase debe tener 28 caracteres.")]
    public string firebase_uid { get; set; } = string.Empty;
}