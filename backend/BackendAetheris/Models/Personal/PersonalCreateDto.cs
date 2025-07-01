// Models/PersonalCreateDto.cs (o una carpeta DTOs)
using System;
using System.ComponentModel.DataAnnotations;

public class PersonalCreateDto
{
    [Required(ErrorMessage = "FirebaseUid es requerido.")]
    [StringLength(28, MinimumLength = 28, ErrorMessage = "FirebaseUid debe tener 28 caracteres.")]
    public string FirebaseUid { get; set; } = string.Empty; // Inicializado

    [Required(ErrorMessage = "El nombre es requerido.")]
    [StringLength(100, ErrorMessage = "El nombre no puede exceder 100 caracteres.")]
    public string Nombre { get; set; } = string.Empty; // Inicializado

    [Required(ErrorMessage = "El apellido es requerido.")]
    [StringLength(100, ErrorMessage = "El apellido no puede exceder 100 caracteres.")]
    public string Apellido { get; set; } = string.Empty; // Inicializado

    [Required(ErrorMessage = "La fecha de nacimiento es requerida.")]
    public DateTime Fecha_Nacimiento { get; set; } = default; // O DateTime.MinValue;

    [Required(ErrorMessage = "El género es requerido.")]
    [StringLength(10, ErrorMessage = "El género no puede exceder 10 caracteres.")]
    public string Genero { get; set; } = string.Empty; // Inicializado

    [Required(ErrorMessage = "El teléfono es requerido.")]
    [StringLength(15, ErrorMessage = "El teléfono no puede exceder 15 caracteres.")]
    public string Telefono { get; set; } = string.Empty; // Inicializado

    public bool Activo { get; set; } = true;
}