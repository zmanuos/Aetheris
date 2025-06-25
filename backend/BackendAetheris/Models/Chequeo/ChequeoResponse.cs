public class ChequeoResponse : JsonResponse
{
    public Chequeo Chequeo { get; set; }

    public static ChequeoResponse GetResponse(Chequeo _Chequeo)
    {
        return new ChequeoResponse
        {
            Status = 0,
            Chequeo = _Chequeo
        };
    }
}
