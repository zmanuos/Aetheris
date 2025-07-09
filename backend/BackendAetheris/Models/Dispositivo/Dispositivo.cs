using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Microsoft.Data.SqlClient;
using MySql.Data.MySqlClient;
using System.Data;

public class Dispositivo
{
    private static string selectAll = "SELECT id_dispositivo, direccion_MAC, estado, nombre FROM DISPOSITIVO";
    private static string select = "SELECT id_dispositivo, direccion_MAC, estado, nombre FROM DISPOSITIVO where id_dispositivo = @ID";
    private static string UpdateEstado = "UPDATE DISPOSITIVO SET estado = NOT estado WHERE id_dispositivo = @id;";
    private static string insert = "INSERT INTO DISPOSITIVO (direccion_MAC, nombre) VALUES (@direccion_mac, @nombre);";

    private int _id;
    private string _direccion_MAC;
    private bool _estado;
    private string _nombre;

    public int id { get => _id; set => _id = value; }
    public string direccion_MAC { get => _direccion_MAC; set => _direccion_MAC = value; }
    public bool estado { get => _estado; set => _estado = value; }
    public string nombre { get => _nombre; set => _nombre = value; }

    public Dispositivo()
    {
        id = 0;
        direccion_MAC = "";
        estado = false;
        nombre = "";
    }

    public Dispositivo(int _id,string _direccion_MAC, bool _estado, string _nombre)
    {
        id = _id;
        direccion_MAC = _direccion_MAC;
        estado = _estado;
        nombre = _nombre;
    } 

    public static List<Dispositivo> Get()
    {
        MySqlCommand command = new MySqlCommand(selectAll);
        return DispositivoMapper.ToList(SqlServerConnection.ExecuteQuery(command));
    }

    public static Dispositivo Get(int id) {
        MySqlCommand command = new MySqlCommand(select);
        command.Parameters.AddWithValue("@ID", id);
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

    public static int post(string direccion_mac, string nombre)
    {
        int result = 0;

        MySqlCommand command = new MySqlCommand(insert);
        command.Parameters.AddWithValue("@direccion_mac", direccion_mac);
        command.Parameters.AddWithValue("@nombre", nombre);

        result = SqlServerConnection.ExecuteCommand(command);
        return result;
    }

    public static bool Update(int id_dispositivo)
    {
        MySqlCommand command = new MySqlCommand(UpdateEstado);
        command.Parameters.AddWithValue("@id", id_dispositivo);
        
        return SqlServerConnection.ExecuteCommand(command) > 0;
    }
}