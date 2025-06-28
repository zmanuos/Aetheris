public class RolResponse : JsonResponse
{
    public Rol Rol { get; set; }

    public static RolResponse GetResponse(Rol _Rol)
    {
        return new RolResponse
        {
            Status = 0,
            Rol = _Rol
        };
    }
}
