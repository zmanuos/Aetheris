public class ParentescoResponse : JsonResponse
{
    public Parentesco Parentesco { get; set; }

    public static ParentescoResponse GetResponse(Parentesco _Parentesco)
    {
        return new ParentescoResponse
        {
            Status = 0,
            Parentesco = _Parentesco
        };
    }
}
