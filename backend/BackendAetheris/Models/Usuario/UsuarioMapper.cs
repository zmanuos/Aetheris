using System;
using System.Collections.Generic;
using System.Data;

public class UsuarioMapper
{
    public static Usuario ToObject(DataRow row)
    {
        Rol rol_usuario = new Rol();

        int id = (int)row["id_usuario"];
        int usuario = (int)row["usuario"];
        string contra = (string)row["contra"];
        string email = row.IsNull("email") ? "" : (string)row["email"];
        int rol = (int)row["rol"];
        DateTime createdAt = (DateTime)row["CreatedAt"];
        bool isActive = (bool)row["isActive"];

        rol_usuario = Rol.Get(rol);

        return new Usuario(id, usuario, contra, email, rol_usuario, createdAt, isActive);
    }

    public static List<Usuario> ToList(DataTable table)
    {
        List<Usuario> list = new List<Usuario>();
        foreach (DataRow row in table.Rows)
        {
            list.Add(ToObject(row));
        }
        return list;
    }
}
