using System.Collections.Generic;

public class AreaListResponse : JsonResponse
{
    public List<Area> Areas { get; set; }

    public static AreaListResponse GetResponse(List<Area> _Areas)
    {
        return new AreaListResponse
        {
            Status = 0,
            Areas = _Areas
        };
    }
}
