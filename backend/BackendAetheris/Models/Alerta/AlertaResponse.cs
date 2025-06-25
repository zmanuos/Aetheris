public class AlertaResponse : JsonResponse
{
    public Alerta Alerta { get; set; }

    public static AlertaResponse GetResponse(Alerta _Alerta)
    {
        return new AlertaResponse
        {
            Status = 0,
            Alerta = _Alerta
        };
    }
}
