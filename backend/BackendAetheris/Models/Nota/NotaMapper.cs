using System.Collections.Generic;
using System.Data;
using System;

public class NotaMapper
{
    public static Nota ToObject(DataRow row)
    {
        int id = (int)row["id_notas"];
        int idFamiliar = (int)row["id_familiar"];
        int? idPersonal = row["id_personal"] == DBNull.Value ? (int?)null : Convert.ToInt32(row["id_personal"]);
        string notaTexto = (string)row["nota"];
        DateTime fecha = (DateTime)row["fecha"];
        bool activo = (bool)row["activo"]; // Asegura que 'activo' se lea como booleano

        return new Nota(id, idFamiliar, idPersonal, notaTexto, fecha, activo);
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