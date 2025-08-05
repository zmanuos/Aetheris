// ContinuaResidentePost.cs
public class ContinuaResidentePost
{
    public string ResidenteId { get; set; }
    public string DispositivoId { get; set; }
    public int RitmoCardiaco { get; set; }
    public string Estado { get; set; } // **Asegúrate de que este campo exista**
    public double PromedioRitmoReferencia { get; set; } // **Asegúrate de que este campo exista**
}