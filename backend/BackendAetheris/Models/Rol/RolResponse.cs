public class RolResponse : JsonResponse
{
    public Rol rol { get; set; }

    public static RolResponse GetResponse(Rol _Rol)
    {
        return new RolResponse
        {
            Status = 0,
            rol = _Rol
        };
    }
}
