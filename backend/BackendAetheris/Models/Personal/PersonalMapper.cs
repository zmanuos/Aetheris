

using System.Collections.Generic;
using System.Data;

public class PersonalMapper
{
    /// <summary>
    /// Convert DataRow to Agent object
    /// </summary>
    /// <param name="row" > Data Row </param>
    /// <returns></returns>
    /// 

    /*
     * 
        #region properties

    public int id { get => _id; set => _id = value; }
    public string nombre { get => _nombre; set => _nombre = value; }
    public string apellido { get => _apellido; set => _apellido = value; }
    public DateTime fecha_nacimiento { get => _fecha_nacimiento; set => _fecha_nacimiento = value; }
    public string genero { get => _genero; set => _genero = value; }
    public string telefono { get => _telefono; set => _telefono = value; }
    public bool activo { get => _activo; set => _activo = value; }


    SELECT id_personal, nombre, apellido, fecha_nacimiento, genero, telefono, activo FROM PERSONAL;

    */

    #region attributes

    private int id;
    public string nombre;
    public string apellido;
    public DateTime fecha_nacimiento;
    public string genero;
    public string telefono;
    public bool activo;






    public static Personal ToObject(DataRow row)
    {
        int id = (Int32)row["id_personal"];
        string nombre = (String)row["nombre"];
        string apellido = (String)row["apellido"];
        DateTime fecha_nacimiento = (DateTime)row["fecha_nacimiento"];
        string genero = (String)row["genero"];
        string telefono = row.IsNull("telefono") ? "" : (string)row["telefono"];
        bool activo = (bool)row["activo"];


        return new Personal(id, nombre, apellido, fecha_nacimiento, genero, telefono, activo);
    }

    public static List<Personal> ToList(DataTable table)
    {

        List<Personal> list = new List<Personal>();
        foreach (DataRow row in table.Rows)
        {
            //add to list
            list.Add(PersonalMapper.ToObject(row));
        }
        return list;
    }
}

    #endregion