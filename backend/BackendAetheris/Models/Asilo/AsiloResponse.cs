public class AsiloResponse : JsonResponse
{
    public Asilo Asilo { get; set; }

    public static AsiloResponse GetResponse(Asilo a)
    {
        return new AsiloResponse
        {
            Status = 0,
            Asilo = a
        };
    }
}
