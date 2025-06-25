using System;

public class UsuarioNotFoundException : Exception
{
    private string _message;
    public override string Message => _message;

    public UsuarioNotFoundException(int id)
    {
        _message = $"Could not find usuario with ID {id}.";
    }
}
