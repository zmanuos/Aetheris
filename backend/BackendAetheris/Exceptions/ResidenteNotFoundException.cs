public class ResidenteNotFoundException : Exception
{
    private string _message;
    public override string Message => _message;

    public ResidenteNotFoundException(int id)
    {
        _message = $"Could Not find resident With id {id}";
    }
}