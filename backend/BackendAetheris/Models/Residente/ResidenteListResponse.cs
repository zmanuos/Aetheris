public class ResidenteListResponse : JsonResponse
{
    public List<Residente> Agents { get; set; }

    public static ResidenteListResponse GetResponse(List<Residente> agents)
    {
        ResidenteListResponse r = new ResidenteListResponse();
        r.Status = 0;
        r.Agents = agents;
        return r;
    }
}
