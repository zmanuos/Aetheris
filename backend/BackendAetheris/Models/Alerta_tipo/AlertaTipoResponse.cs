public class AlertaTipoResponse : JsonResponse
{
    public AlertaTipo AlertaTipo { get; set; }

    public static AlertaTipoResponse GetResponse(AlertaTipo _AlertaTipo)
    {
        return new AlertaTipoResponse
        {
            Status = 0,
            AlertaTipo = _AlertaTipo
        };
    }
}
