using System;
using System.ComponentModel.DataAnnotations;

public class ResidentePutDto
{
    [Required(ErrorMessage = "El ID del residente es obligatorio.")]
    public int id_residente { get; set; }

    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [StringLength(100, ErrorMessage = "El nombre no puede exceder 100 caracteres.")]    
    public string nombre { get; set; } = string.Empty;

    [Required(ErrorMessage = "El apellido es obligatorio.")]
    [StringLength(100, ErrorMessage = "El apellido no puede exceder 100 caracteres.")]
    public string apellido { get; set; } = string.Empty;

    [Required(ErrorMessage = "La fecha de nacimiento es obligatoria.")]
    public DateTime fechaNacimiento { get; set; }

    [Required(ErrorMessage = "El género es obligatorio.")]
    [StringLength(10, ErrorMessage = "El género no puede exceder 10 caracteres.")]
    public string genero { get; set; } = string.Empty;

    [Required(ErrorMessage = "El teléfono es obligatorio.")]
    [StringLength(15, ErrorMessage = "El teléfono no puede exceder 15 caracteres.")]
    public string telefono { get; set; } = string.Empty;

    [Required(ErrorMessage = "La URL de la foto es obligatoria. Use una cadena vacía si no hay foto.")]
    public string foto { get; set; } = string.Empty;

    // CAMBIO IMPORTANTE AQUÍ: De string a int
    [Required(ErrorMessage = "El ID del dispositivo es obligatorio. Use 0 si no hay dispositivo asignado o para desasignar.")]
    public int dispositivo { get; set; }

    [Required(ErrorMessage = "El estado activo es obligatorio.")]
    public bool activo { get; set; }

    [Required(ErrorMessage = "El promedio de reposo es obligatorio.")]
    public int promedio_reposo { get; set; }

    [Required(ErrorMessage = "El promedio activo es obligatorio.")]
    public int promedio_activo { get; set; }

    [Required(ErrorMessage = "El promedio agitado es obligatorio.")]
    public int promedio_agitado { get; set; }
}