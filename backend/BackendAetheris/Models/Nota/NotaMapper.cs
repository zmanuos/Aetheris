using System.Collections.Generic;
using System.Data;
using System; // Asegúrate de tenerlo si no estaba

public class NotaMapper
{
    public static Nota ToObject(DataRow row)
    {
        int id = (int)row["id_notas"];
        int idFamiliar = (int)row["id_familiar"];
        // MODIFICADO: Leer id_personal y manejar DBNull.Value
        int? idPersonal = row["id_personal"] == DBNull.Value ? (int?)null : Convert.ToInt32(row["id_personal"]);
        string notaTexto = (string)row["nota"];
        DateTime fecha = (DateTime)row["fecha"];
        bool activo = (bool)row["activo"];

        // ACTUALIZADO: Pasar idPersonal (ahora int?) al constructor
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