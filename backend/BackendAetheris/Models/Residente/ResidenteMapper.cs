using System.Collections.Generic;
using System.Data;

public class ResidenteMapper
{
    /// <summary>
    /// Convert DataRow to Agent object
    /// </summary>
    /// <param name="row" > Data Row </param>
    /// <returns></returns>
    /// 

    /*
        private int _id_residente;
    private string _nombre;
    private string _apellido;
    private DateTime _fecha_nacimiento;
    private string _genero;
    private string _telefono;
    private string _dispositivo;
    private string _foto;
    private DateTime _fecha_ingreso;
    private bool _activo;

    private static string selectAll = "SELECT id_residente, nombre, apellido, fecha_nacimiento, genero, telefono, foto, dispositivo, fecha_ingreso, activo FROM RESIDENTE";

     */

    public static Residente ToObject(DataRow row)
    {
        Dispositivo dispositivo = new Dispositivo();

        int id = (Int32)row["id_residente"];
        string nombre = (String)row["nombre"];
        string apellido = (String)row["apellido"];
        DateTime fecha_nacimiento = (DateTime)row["fecha_nacimiento"];
        string genero = (String)row["genero"];
        string telefono = row.IsNull("telefono") ? "" : (string)row["telefono"];
        int id_dispositivo = row.IsNull("dispositivo") ? 0 : (Int32)row["dispositivo"];
        string foto = row.IsNull("foto") ? "" : (string)row["foto"];
        DateTime fecha_ingreso = (DateTime)row["fecha_ingreso"];
        bool activo = (bool)row["activo"];

        // return agent

        if (id_dispositivo != 0)
        {
            dispositivo = Dispositivo.Get(id_dispositivo);
        } 


        return new Residente(id, nombre, apellido, fecha_nacimiento, genero, telefono, dispositivo, foto, fecha_ingreso, activo);
    }
    /// <summary>
    /// 
    /// </summary>
    /// <param name="Table"></param>
    /// <returns></returns>
    public static List<Residente> ToList(DataTable table)
    {

        List<Residente> list = new List<Residente>();
        foreach (DataRow row in table.Rows)
        {
            //add to list
            list.Add(ResidenteMapper.ToObject(row));
        }
        return list;
    }
}