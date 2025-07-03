using System.Collections.Generic;

public class NotaListResponse : JsonResponse
{
    public List<Nota> Notas { get; set; }

    public static NotaListResponse GetResponse(List<Nota> lista)
    {
        return new NotaListResponse
        {
            Status = 0,
            Notas = lista
        };
    }
}
