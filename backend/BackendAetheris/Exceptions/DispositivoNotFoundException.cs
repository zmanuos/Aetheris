public class DispositivoNotFoundException : Exception
{
    private string _message;
    public override string Message => _message;

    public DispositivoNotFoundException(int id)
    {
        _message = $"No se encontro el dispositivo con ID {id}";
    }
}