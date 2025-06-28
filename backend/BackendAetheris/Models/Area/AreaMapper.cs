using System.Collections.Generic;
using System.Data;

public class AreaMapper
{
    public static Area ToObject(DataRow row)
    {
        int id = (int)row["id_area"];
        string nombre = (string)row["nombre"];
        string descripcion = row.IsNull("descripcion") ? "" : (string)row["descripcion"];

        return new Area(id, nombre, descripcion);
    }

    public static List<Area> ToList(DataTable table)
    {
        List<Area> list = new List<Area>();
        foreach (DataRow row in table.Rows)
        {
            list.Add(ToObject(row));
        }
        return list;
    }
}
