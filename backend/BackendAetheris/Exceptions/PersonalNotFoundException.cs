using System; // Asegúrate de tener esta línea si no la tienes

public class PersonalNotFoundException : Exception
{
    private string _message;
    public override string Message => _message;

    public PersonalNotFoundException(int id)
    {
        _message = $"No se encontro personal con el id {id}";
    }

    // NUEVO CONSTRUCTOR: Para aceptar un mensaje de cadena directamente
    public PersonalNotFoundException(string message)
    {
        _message = message;
    }
}