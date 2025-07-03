using System;

public class ObservacionNotFoundException : Exception
{
    private string _message;
    public override string Message => _message;

    public ObservacionNotFoundException(int id)
    {
        _message = $"No se encontró el chequeo con ID {id}.";
    }
}
