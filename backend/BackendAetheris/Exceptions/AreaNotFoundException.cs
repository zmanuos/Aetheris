public class PersonalNotFoundException : Exception
{
    private string _message;
    public override string Message => _message;

    public PersonalNotFoundException(int id)
    {
        _message = $"Could Not find personal With id {id}";
    }
}