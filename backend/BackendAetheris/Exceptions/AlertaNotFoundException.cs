using System;

public class AlertaNotFoundException : Exception
{
    private string _message;
    public override string Message => _message;

    public AlertaNotFoundException(int id)
    {
        _message = $"No se encontró la alerta con ID {id}.";
    }
}
