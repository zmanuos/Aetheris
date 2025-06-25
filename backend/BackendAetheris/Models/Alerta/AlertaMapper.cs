using System;
using System.Collections.Generic;
using System.Data;

public class AlertaMapper
{
    public static Alerta ToObject(DataRow row)
    {
        Residente residente = new Residente();  
        AlertaTipo alerta = new AlertaTipo();   
        Area area = new Area(); 

        int id = (int)row["id_alerta"];
        int id_residente = row.IsNull("id_residente") ? 0 : (Int32)row["id_residente"];
        int id_alerta_tipo = row.IsNull("id_alerta_tipo") ? 0 : (Int32)row["id_alerta_tipo"];
        int id_area = row.IsNull("id_area") ? 0 : (Int32)row["id_area"];
        DateTime fecha = (DateTime)row["fecha"];
        string mensaje = row.IsNull("mensaje") ? "" : (string)row["mensaje"];

        if (id_residente != 0)
        {
            residente = Residente.Get(id_residente);
        }

        if (id_alerta_tipo != 0)
        {
            alerta = AlertaTipo.Get(id_alerta_tipo);
        }

        if (id_area != 0)
        {
            area = Area.Get(id_area);
        }


        return new Alerta(id, residente, alerta, area, fecha, mensaje);
    }

    public static List<Alerta> ToList(DataTable table)
    {
        List<Alerta> list = new List<Alerta>();
        foreach (DataRow row in table.Rows)
        {
            list.Add(ToObject(row));
        }
        return list;
    }
}
