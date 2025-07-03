using System.Collections.Generic;
using System.Data;

public class NotaMapper
{
    public static Nota ToObject(DataRow row)
    {
        int id = (int)row["id_notas"];
        int idFamiliar = (int)row["id_familiar"];
        string notaTexto = (string)row["nota"];
        DateTime fecha = (DateTime)row["fecha"];
        bool activo = (bool)row["activo"];

        return new Nota(id, idFamiliar, notaTexto, fecha, activo);
    }

    public static List<Nota> ToList(DataTable table)
    {
        List<Nota> list = new List<Nota>();
        foreach (DataRow row in table.Rows)
        {
            list.Add(ToObject(row));
        }
        return list;
    }
}
