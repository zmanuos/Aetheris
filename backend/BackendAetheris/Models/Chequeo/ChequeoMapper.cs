using System;
using System.Collections.Generic;
using System.Data;

public class ChequeoMapper
{
    public static Chequeo ToObject(DataRow row)
    {
        int id = (int)row["id_chequeo"];
        int id_residente = (int)row["id_residente"];
        DateTime fecha = (DateTime)row["fecha"];
        int frecuencia = (int)row["frecuencia_cardiaca"];
        decimal oxigeno = (decimal)row["oxigeno"];
        decimal peso = (decimal)row["peso"];
        string observaciones = row.IsNull("observaciones") ? "" : (string)row["observaciones"];

        Residente residente = Residente.Get(id_residente);

        return new Chequeo(id, residente, fecha, frecuencia, oxigeno, peso, observaciones);
    }

    public static List<Chequeo> ToList(DataTable table)
    {
        List<Chequeo> list = new List<Chequeo>();
        foreach (DataRow row in table.Rows)
        {
            list.Add(ToObject(row));
        }
        return list;
    }
}
