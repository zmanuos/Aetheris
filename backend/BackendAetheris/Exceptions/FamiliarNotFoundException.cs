using System;

public class FamiliarNotFoundException : Exception
{
    private string _message;
    public override string Message => _message;

    public FamiliarNotFoundException(int id)
    {
        _message = $"No se encontro el familiar con ID {id}.";
    }

    public FamiliarNotFoundException(string message)
    {
        _message = message;
    }
}