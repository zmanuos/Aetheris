using System.Data;

public class RolMapper
{
    public static Rol ToObject(DataRow row)
    {
        int id = (int)row["id_role"];
        string nombre = (string)row["nombre"];

        return new Rol(id, nombre);
    }
}
