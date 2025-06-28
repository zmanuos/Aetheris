public class DispositivoNotFoundException : Exception
{
    private string _message;
    public override string Message => _message;

    public DispositivoNotFoundException(int id)
    {
        _message = $"Could Not find Device With id {id}";
    }
}