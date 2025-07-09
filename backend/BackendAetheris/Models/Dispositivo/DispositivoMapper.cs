using System.Collections.Generic;
using System.Data;
using System;

public class DispositivoMapper
{
    public static Dispositivo ToObject(DataRow row)
    {
        int id = (Int32)row["id_dispositivo"];
        string direccion_MAC = (String)row["direccion_MAC"];
        bool estado = (bool)row["estado"];
        string nombre = (String)row["nombre"];
        
        return new Dispositivo(id, direccion_MAC, estado, nombre);
    }

    public static List<Dispositivo> ToList(DataTable table)
    {
        List<Dispositivo> list = new List<Dispositivo>();
        foreach (DataRow row in table.Rows)
        {
            list.Add(DispositivoMapper.ToObject(row));
        }
        return list;
    }
}