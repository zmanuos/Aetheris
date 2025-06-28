public class AreaResponse : JsonResponse
{
    public Area Area { get; set; }

    public static AreaResponse GetResponse(Area _Area)
    {
        return new AreaResponse
        {
            Status = 0,
            Area = _Area
        };
    }
}
