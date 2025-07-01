using System.Data;

public class ParentescoMapper
{
    public static Parentesco ToObject(DataRow row)
    {
        int id = (int)row["id_parentesco"];
        string nombre = (string)row["parentesco"];

        return new Parentesco(id, nombre);
    }

    public static List<Parentesco> ToList(DataTable table)
    {
        List<Parentesco> list = new List<Parentesco>();
        foreach (DataRow row in table.Rows)
        {
            list.Add(ToObject(row));
        }
        return list;
    }
}
