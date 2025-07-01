using System;
using System.Collections.Generic;
using System.Data;

public class PersonalMapper
{
    // He eliminado los campos privados y públicos 'id', 'nombre', 'apellido', etc.
    // ya que no son atributos de PersonalMapper, sino variables locales dentro de ToObject
    // o propiedades del objeto Personal que se está mapeando.

    /// <summary>
    /// Convierte un DataRow a un objeto Personal.
    /// </summary>
    /// <param name="row">Fila de datos.</param>
    /// <returns>Objeto Personal.</returns>
    public static Personal ToObject(DataRow row)
    {
        int id = Convert.ToInt32(row["id_personal"]);
        
        // Uso de Convert.ToString() o manejo de DBNull.Value para evitar InvalidCastException
        // y asegurar que los strings no nulos no sean realmente null.
        string nombre = row["nombre"] != DBNull.Value ? Convert.ToString(row["nombre"])! : string.Empty;
        string apellido = row["apellido"] != DBNull.Value ? Convert.ToString(row["apellido"])! : string.Empty;
        DateTime fecha_nacimiento = Convert.ToDateTime(row["fecha_nacimiento"]);
        string genero = row["genero"] != DBNull.Value ? Convert.ToString(row["genero"])! : string.Empty;
        string telefono = row["telefono"] != DBNull.Value ? Convert.ToString(row["telefono"])! : string.Empty;
        bool activo = Convert.ToBoolean(row["activo"]);
        
        // Manejo de firebase_uid: puede ser NULL en la base de datos
        // Se obtiene como string? (nullable string)
        string? firebaseUid = row["firebase_uid"] != DBNull.Value ? Convert.ToString(row["firebase_uid"]) : null;

        // Se pasa firebaseUid al constructor de Personal
        return new Personal(id, nombre, apellido, fecha_nacimiento, genero, telefono, activo, firebaseUid);
    }

    /// <summary>
    /// Convierte un DataTable a una lista de objetos Personal.
    /// </summary>
    /// <param name="table">Tabla de datos.</param>
    /// <returns>Lista de objetos Personal.</returns>
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