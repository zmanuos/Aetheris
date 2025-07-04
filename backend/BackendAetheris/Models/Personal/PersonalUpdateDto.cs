using System;
using System.ComponentModel.DataAnnotations;

public class PersonalUpdateDto
{
    [Required(ErrorMessage = "El nombre es requerido.")]
    [StringLength(100, ErrorMessage = "El nombre no puede exceder 100 caracteres.")]
    public string Nombre { get; set; } = string.Empty;

    [Required(ErrorMessage = "El apellido es requerido.")]
    [StringLength(100, ErrorMessage = "El apellido no puede exceder 100 caracteres.")]
    public string Apellido { get; set; } = string.Empty;

    [Required(ErrorMessage = "La fecha de nacimiento es requerida.")]
    public DateTime Fecha_Nacimiento { get; set; } = default;

    [Required(ErrorMessage = "El género es requerido.")]
    [StringLength(10, ErrorMessage = "El género no puede exceder 10 caracteres.")]
    public string Genero { get; set; } = string.Empty;

    [Required(ErrorMessage = "El teléfono es requerido.")]
    [StringLength(15, ErrorMessage = "El teléfono no puede exceder 15 caracteres.")]
    public string Telefono { get; set; } = string.Empty;

    public bool Activo { get; set; } = true;
}