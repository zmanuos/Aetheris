using System.Collections.Generic;

public class ObservacionListResponse : JsonResponse
{
    public List<Observacion> Observaciones { get; set; }

    public static ObservacionListResponse GetResponse(List<Observacion> lista)
    {
        return new ObservacionListResponse
        {
            Status = 0,
            Observaciones = lista
        };
    }
}
