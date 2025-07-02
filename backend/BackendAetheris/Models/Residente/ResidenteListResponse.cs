public class ResidenteListResponse : JsonResponse
{
    public List<Residente> Data { get; set; } 

    public static ResidenteListResponse GetResponse(List<Residente> residentes)
    {
        ResidenteListResponse r = new ResidenteListResponse();
        r.Status = 0;
        r.Data = residentes; 
        return r;
    }
}