using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Microsoft.Data.SqlClient;
using MySql.Data.MySqlClient;
using System.Data;

public class Dispositivo
{

    #region statement

    private static string selectAll = "SELECT id_dispositivo, direccion_MAC, estado, fecha_asignacion FROM DISPOSITIVO";

    private static string select = "SELECT id_dispositivo, direccion_MAC, estado, fecha_asignacion FROM DISPOSITIVO where id_dispositivo = @ID";

    private static string UpdateEstado = "UPDATE DISPOSITIVO SET estado = NOT estado WHERE id_dispositivo = @id;";

    private static string insert = "INSERT INTO DISPOSITIVO (direccion_MAC) VALUES (@direccion_mac);";

    #endregion

    #region attributes

    private int _id;
    private string _direccion_MAC;
    private bool _estado;
    private DateTime _fecha_asignacion;


    #endregion

    #region properties

    public int id { get => _id; set => _id = value; }
    public string direccion_MAC { get => _direccion_MAC; set => _direccion_MAC = value; }
    public bool estado { get => _estado; set => _estado = value; }
    public DateTime fecha_asignacion { get => _fecha_asignacion; set => _fecha_asignacion = value; }

    #endregion

    #region constructors

    public Dispositivo()
    {
        //Default values
        id = 0;
        direccion_MAC = "";
        estado = false;
        fecha_asignacion = DateTime.MinValue;
    }

    public Dispositivo(int _id,string _direccion_MAC, bool _estado, DateTime _fecha_asignacion)
    {
        id = _id;
        direccion_MAC = _direccion_MAC;
        estado = _estado;
        fecha_asignacion = _fecha_asignacion;
    } 

    #endregion

    #region Class Methods


    public static List<Dispositivo> Get()
    {
        MySqlCommand command = new MySqlCommand(selectAll);
        //Populate
        return DispositivoMapper.ToList(SqlServerConnection.ExecuteQuery(command));
    }


    public static Dispositivo Get(int id) {
        MySqlCommand command = new MySqlCommand(select);
        command.Parameters.AddWithValue("@ID", id);
        //Populate
        DataTable table = SqlServerConnection.ExecuteQuery(command);

        if (table.Rows.Count > 0)
        {
            return DispositivoMapper.ToObject(table.Rows[0]);
        }
        else
        {
            throw new DispositivoNotFoundException(id);
        }
    }

    public static int post(string direccion_mac)
    {
        int result = 0;

        MySqlCommand command = new MySqlCommand(insert);
        command.Parameters.AddWithValue("@direccion_mac", direccion_mac);

        result = SqlServerConnection.ExecuteCommand(command);
        return result;
    }

    public static bool Update(int id_dispositivo)
    {

        MySqlCommand command = new MySqlCommand(UpdateEstado);
        command.Parameters.AddWithValue("@id", id_dispositivo);
        
        return SqlServerConnection.ExecuteCommand(command) > 0;
    }

    #endregion

    #region x


    #endregion
}