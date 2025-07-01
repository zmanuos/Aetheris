public class ParentescoListResponse : JsonResponse
{
    public List<Parentesco> Parentesco { get; set; }

    public static ParentescoListResponse GetResponse(List<Parentesco> _Parentesco)
    {
        return new ParentescoListResponse
        {
            Status = 0,
            Parentesco = _Parentesco
        };
    }
}