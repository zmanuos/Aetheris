public class ObservacionResponse : JsonResponse
{
    public Observacion Observacion { get; set; }

    public static ObservacionResponse GetResponse(Observacion obs)
    {
        return new ObservacionResponse
        {
            Status = 0,
            Observacion = obs
        };
    }
}
