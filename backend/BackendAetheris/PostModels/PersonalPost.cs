// Models/Dto/PersonalPost.cs
using System.Diagnostics.Contracts;

public class PersonalPost
{
    public string nombre { get; set; }
    public string apellido { get; set; }
    public DateTime fechaNacimiento { get; set; }
    public string genero { get; set; }
    public string telefono { get; set; }
    public string contra { get; set; }
}