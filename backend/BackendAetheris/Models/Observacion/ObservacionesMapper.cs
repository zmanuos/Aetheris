using System.Collections.Generic;
using System.Data;

public class ObservacionMapper
{
    public static Observacion ToObject(DataRow row)
    {
        int id = (int)row["id_observaciones"];
        int idResidente = (int)row["id_residente"];
        string observacionTexto = (string)row["observacion"];

        return new Observacion(id, idResidente, observacionTexto);
    }

    public static List<Observacion> ToList(DataTable table)
    {
        List<Observacion> list = new List<Observacion>();
        foreach (DataRow row in table.Rows)
        {
            list.Add(ToObject(row));
        }
        return list;
    }

}
