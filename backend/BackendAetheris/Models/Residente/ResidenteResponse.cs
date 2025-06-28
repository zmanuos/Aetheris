public class ResidenteResponse : JsonResponse
{
    public Residente Residente { get; set; }

    public static ResidenteResponse GetResponse(Residente _Residente)
    {
        ResidenteResponse r = new ResidenteResponse();
        r.Status = 0;
        r.Residente = _Residente;
        return r;
    }
}