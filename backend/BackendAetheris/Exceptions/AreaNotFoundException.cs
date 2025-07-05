using System;

public class AreaNotFoundException : Exception
{
    private string _message;
    public override string Message => _message;

    public AreaNotFoundException(int id)
    {
        _message = $"No se encontró la area con ID {id}.";
    }
}
