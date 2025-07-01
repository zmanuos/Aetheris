public class ResidenteResponse : JsonResponse
{
    public Residente Residente { get; set; }
    public int id { get => Residente.Id_residente; set => Residente.Id_residente = value; }

    public static ResidenteResponse GetResponse(Residente _Residente)
    {
        ResidenteResponse r = new ResidenteResponse();
        r.Status = 0;
        r.Residente = _Residente;
        return r;
    }

    public static ResidenteResponse GetResponseId(Residente _Residente)
    {
        ResidenteResponse r = new ResidenteResponse();
        r.Status = 0;
        r.Residente = _Residente;
        r.Residente.Id_residente = _Residente.Id_residente;
        return r;
    }
}