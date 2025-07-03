using System;

public class NotaNotFoundException : Exception
{
    private string _message;
    public override string Message => _message;

    public NotaNotFoundException(int id)
    {
        _message = $"No se encontró nota con ID {id}.";
    }
}
