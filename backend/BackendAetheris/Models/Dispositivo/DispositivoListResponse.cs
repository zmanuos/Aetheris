using System.Collections.Generic;

public class DispositivoListResponse : JsonResponse
{
    public List<Dispositivo> Dispositivo { get; set; }

    public static DispositivoListResponse GetResponse(List<Dispositivo> _Dispositivo)
    {
        DispositivoListResponse r = new DispositivoListResponse();
        r.Status = 0;
        r.Dispositivo = _Dispositivo;
        return r;
    }
}