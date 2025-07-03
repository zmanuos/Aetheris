public class NotaResponse : JsonResponse
{
    public Nota Nota { get; set; }

    public static NotaResponse GetResponse(Nota nota)
    {
        return new NotaResponse
        {
            Status = 0,
            Nota = nota
        };
    }
}
