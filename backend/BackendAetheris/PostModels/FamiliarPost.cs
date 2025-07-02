using System;
using System.ComponentModel.DataAnnotations; // ¡Importante! Necesario para los atributos de validación

// Quita 'using System.Diagnostics.Contracts;' si no lo usas para otra cosa,
// ya que no es el namespace estándar para DataAnnotations.

public class FamiliarPost
{
    [Required(ErrorMessage = "El nombre es obligatorio.")]
    public string nombre { get; set; }

    [Required(ErrorMessage = "El apellido es obligatorio.")]
    public string apellido { get; set; }

    [Required(ErrorMessage = "La fecha de nacimiento es obligatoria.")]
    public DateTime fechaNacimiento { get; set; }

    [Required(ErrorMessage = "El género es obligatorio.")]
    public string genero { get; set; }

    [Required(ErrorMessage = "El teléfono es obligatorio.")]
    public string telefono { get; set; }

    // --- CAMBIOS AQUÍ: Atributos de validación explícitos ---
    [Required(ErrorMessage = "El email es obligatorio.")]
    [EmailAddress(ErrorMessage = "El formato del email no es válido.")]
    public string email { get; set; }

    [Required(ErrorMessage = "La contraseña es obligatoria.")]
    [MinLength(6, ErrorMessage = "La contraseña debe tener al menos 6 caracteres.")] // Ejemplo: mínimo 6 caracteres
    public string contra { get; set; }

    // --- CAMBIOS AQUÍ: Nombres de propiedades para coincidir con el frontend ---
    [Required(ErrorMessage = "El ID del residente es obligatorio.")]
    public int id_residente { get; set; } // Cambiado de 'residente' a 'id_residente'

    [Required(ErrorMessage = "El parentesco es obligatorio.")]
    public int id_parentesco { get; set; } // Cambiado de 'parentesco' a 'id_parentesco'

    [Required(ErrorMessage = "El UID de Firebase es obligatorio.")] // Asumiendo que siempre viene del frontend
    public string firebase_uid { get; set; }
}