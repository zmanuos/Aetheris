namespace BackendAetheris.Models.Dto
{
    public class DatosSensorDto
    {
        public int? Spo2 { get; set; }
        public int? Pulso { get; set; }
        public double? TemperaturaCorporal { get; set; }
        public double? Peso { get; set; }
        public double? Altura { get; set; }
        public double? Imc { get; set; }
        public string? Observaciones { get; set; }
        public DateTime? FechaChequeo { get; set; }
        // Otros campos si los necesitas
    }
}