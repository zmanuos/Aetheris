using System.Collections.Generic;

public class UsuarioListResponse : JsonResponse
{
    public List<Usuario> Usuarios { get; set; }

    public static UsuarioListResponse GetResponse(List<Usuario> _Usuarios)
    {
        return new UsuarioListResponse
        {
            Status = 0,
            Usuarios = _Usuarios
        };
    }
}
