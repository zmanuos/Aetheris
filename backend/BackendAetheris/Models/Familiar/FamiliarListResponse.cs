using System.Collections.Generic;

public class FamiliarListResponse : JsonResponse
{
    public List<Familiar> Familiares { get; set; }

    public static FamiliarListResponse GetResponse(List<Familiar> _Familiares)
    {
        return new FamiliarListResponse
        {
            Status = 0,
            Familiares = _Familiares
        };
    }
}
