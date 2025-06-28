public class FamiliarResponse : JsonResponse
{
    public Familiar Familiar { get; set; }

    public static FamiliarResponse GetResponse(Familiar _Familiar)
    {
        return new FamiliarResponse
        {
            Status = 0,
            Familiar = _Familiar
        };
    }
}
