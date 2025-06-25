using System.Data;

public class ParentescoMapper
{
    public static Parentesco ToObject(DataRow row)
    {
        int id = (int)row["id_parentesco"];
        string nombre = (string)row["parentesco"];

        return new Parentesco(id, nombre);
    }
}
