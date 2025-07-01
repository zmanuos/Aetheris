using System;

public class ParentescoNotFoundException : Exception
{
    private string _message;
    public override string Message => _message;

    public ParentescoNotFoundException(int id)
    {
        _message = $"No se encontró la alerta con ID {id}.";
    }
}
