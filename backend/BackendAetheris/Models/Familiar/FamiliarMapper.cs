using System;
using System.Collections.Generic;
using System.Data;

public class FamiliarMapper
{
    public static Familiar ToObject(DataRow row)
    {
        int id = (int)row["id_familiar"];
        string nombre = (string)row["nombre"];
        string apellido = (string)row["apellido"];
        DateTime fecha_nacimiento = (DateTime)row["fecha_nacimiento"];
        string genero = (string)row["genero"];
        string telefono = row.IsNull("telefono") ? "" : (string)row["telefono"];
        int id_residente = (int)row["id_residente"];
        int id_parentesco = (int)row["id_parentesco"];
        string firebase_uid = (string)row["firebase_uid"];

        Residente residente = Residente.Get(id_residente);

        Parentesco parentesco = Parentesco.Get(id_parentesco);


        return new Familiar(id, nombre, apellido, fecha_nacimiento, genero, telefono, residente, parentesco, firebase_uid);
    }

    public static List<Familiar> ToList(DataTable table)
    {
        List<Familiar> list = new List<Familiar>();
        foreach (DataRow row in table.Rows)
        {
            list.Add(ToObject(row));
        }
        return list;
    }
}
