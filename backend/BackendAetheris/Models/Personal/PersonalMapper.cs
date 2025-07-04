using System;
using System.Collections.Generic;
using System.Data;

public class PersonalMapper
{
    public static Personal ToObject(DataRow row)
    {
        int id = Convert.ToInt32(row["id_personal"]);
        
        string nombre = row["nombre"] != DBNull.Value ? Convert.ToString(row["nombre"])! : string.Empty;
        string apellido = row["apellido"] != DBNull.Value ? Convert.ToString(row["apellido"])! : string.Empty;
        DateTime fecha_nacimiento = Convert.ToDateTime(row["fecha_nacimiento"]);
        string genero = row["genero"] != DBNull.Value ? Convert.ToString(row["genero"])! : string.Empty;
        string telefono = row["telefono"] != DBNull.Value ? Convert.ToString(row["telefono"])! : string.Empty;
        bool activo = Convert.ToBoolean(row["activo"]);
        
        string? firebaseUid = row["firebase_uid"] != DBNull.Value ? Convert.ToString(row["firebase_uid"]) : null;

        return new Personal(id, nombre, apellido, fecha_nacimiento, genero, telefono, activo, firebaseUid);
    }

    public static List<Personal> ToList(DataTable table)
    {
        List<Personal> list = new List<Personal>();
        foreach (DataRow row in table.Rows)
        {
            list.Add(PersonalMapper.ToObject(row));
        }
        return list;
    }
}