using System.Collections.Generic;
using System.Data;

public class DispositivoMapper
{
    /// <summary>
    /// Convert DataRow to Agent object
    /// </summary>
    /// <param name="row" > Data Row </param>
    /// <returns></returns>
    /// 

    /*
    
    private static string selectAll = "SELECT SELECT id_dispositivo, direccion_MAC, estado, fecha_asignacion FROM DISPOSITIVO";

    private static string select = "SELECT id_dispositivo, direccion_MAC, estado, fecha_asignacion FROM DISPOSITIVO where id_dispositivo = @ID";

    #endregion

    #region attributes

    private int _id;
    private string _direccion_MAC;
    private bool _estado;
    private DateTime _fecha_asignacion;



     */

    public static Dispositivo ToObject(DataRow row)
    {
        int id = (Int32)row["id_dispositivo"];
        string direccion_MAC = (String)row["direccion_MAC"];
        bool estado = (bool)row["estado"];
        DateTime fecha_asignacion = (DateTime)row["fecha_asignacion"];

        return new Dispositivo(id, direccion_MAC, estado, fecha_asignacion);
    }

    public static List<Dispositivo> ToList(DataTable table)
    {

        List<Dispositivo> list = new List<Dispositivo>();
        foreach (DataRow row in table.Rows)
        {
            //add to list
            list.Add(DispositivoMapper.ToObject(row));
        }
        return list;
    }
}