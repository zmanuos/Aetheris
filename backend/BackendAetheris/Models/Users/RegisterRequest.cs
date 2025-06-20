using System.ComponentModel.DataAnnotations;

namespace BackendAetheris.Models.Users
{
    public class RegisterRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = "";
        
        [Required]
        [MinLength(6)]
        public string Password { get; set; } = "";
        
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
    }
}
