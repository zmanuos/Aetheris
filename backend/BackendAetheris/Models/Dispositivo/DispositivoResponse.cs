public class DispositivoResponse : JsonResponse
{
    public Dispositivo Dispositivo { get; set; }

    public static DispositivoResponse GetResponse(Dispositivo _Dispositivo)
    {
        DispositivoResponse r = new DispositivoResponse();
        r.Status = 0;
        r.Dispositivo = _Dispositivo;
        return r;
    }
}