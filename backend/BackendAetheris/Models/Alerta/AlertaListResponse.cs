using System.Collections.Generic;

public class AlertaListResponse : JsonResponse
{
    public List<Alerta> Alertas { get; set; }

    public static AlertaListResponse GetResponse(List<Alerta> _Alertas)
    {
        return new AlertaListResponse
        {
            Status = 0,
            Alertas = _Alertas
        };
    }
}
