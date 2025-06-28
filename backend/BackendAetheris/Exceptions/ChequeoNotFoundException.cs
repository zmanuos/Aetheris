using System;

public class ChequeoNotFoundException : Exception
{
    private string _message;
    public override string Message => _message;

    public ChequeoNotFoundException(int id)
    {
        _message = $"No se encontró el chequeo con ID {id}.";
    }
}
