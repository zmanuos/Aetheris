public class PersonalNotFoundException : Exception
{
    private string _message;
    public override string Message => _message;

    public PersonalNotFoundException(int id)
    {
        _message = $"No se encontro personal con el id {id}";
    }
}