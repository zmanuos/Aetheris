using System.ComponentModel.DataAnnotations;

    public class CategoryRequest
    {
        [Required(ErrorMessage = "El nombre de la categoría es requerido")]
        [StringLength(50, ErrorMessage = "El nombre no puede exceder 50 caracteres")]
        public string Name { get; set; } = "";
        
        [StringLength(200, ErrorMessage = "La descripción no puede exceder 200 caracteres")]
        public string? Description { get; set; }
        
        public string? Icon { get; set; }
    }
