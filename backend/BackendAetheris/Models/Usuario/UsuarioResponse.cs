public class UsuarioResponse : JsonResponse
{
    public Usuario Usuario { get; set; }

    public static UsuarioResponse GetResponse(Usuario _Usuario)
    {
        return new UsuarioResponse
        {
            Status = 0,
            Usuario = _Usuario
        };
    }
}
