using System.Collections.Generic;

public class ChequeoListResponse : JsonResponse
{
    public List<Chequeo> Chequeos { get; set; }

    public static ChequeoListResponse GetResponse(List<Chequeo> _Chequeos)
    {
        return new ChequeoListResponse
        {
            Status = 0,
            Chequeos = _Chequeos
        };
    }
}
