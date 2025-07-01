using System;
using System.Collections.Generic;
using System.Data;

public class AsiloMapper
{
    public static Asilo ToObject(DataRow row)
    {
        return new Asilo(
            (int)row["id_asilo"],
            (string)row["nombre"],
            (string)row["direccion"],
            (string)row["pais"],
            (string)row["ciudad"],
            (string)row["codigo_postal"],
            (string)row["telefono"],
            (string)row["correo"],
            Convert.ToInt32(row["cantidad_residentes"]),
            Convert.ToInt32(row["cantidad_empleados"])
        );
    }

}
