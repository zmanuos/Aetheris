using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Microsoft.Data.SqlClient;
using MySql.Data.MySqlClient;
using System.Data;

public class Residente
{

    #region statement

    private static string selectAll = "SELECT id_residente, nombre, apellido, fecha_nacimiento, genero, telefono, foto, dispositivo, fecha_ingreso, activo FROM RESIDENTE";

    private static string select = "SELECT id_residente, nombre, apellido, fecha_nacimiento, genero, telefono, foto, dispositivo, fecha_ingreso, activo FROM RESIDENTE where id_residente = @ID";


    #endregion

    #region attributes

    private int _id_residente;
    private string _nombre;
    private string _apellido;
    private DateTime _fecha_nacimiento;
    private string _genero;
    private string _telefono;
    private Dispositivo _dispositivo;
    private string _foto;
    private DateTime _fecha_ingreso;
    private bool _activo;


    #endregion

    #region properties

    public int Id_residente { get => _id_residente; set => _id_residente = value; }
    public string Nombre { get => _nombre; set => _nombre = value; }
    public string Apellido { get => _apellido; set => _apellido = value; }
    public DateTime Fecha_nacimiento { get => _fecha_nacimiento; set => _fecha_nacimiento = value; }
    public string Genero { get => _genero; set => _genero = value; }
    public string Telefono { get => _telefono; set => _telefono = value; }
    public Dispositivo Dispositivo { get => _dispositivo; set => _dispositivo = value; }
    public string Foto { get => _foto; set => _foto = value; }
    public DateTime Fecha_ingreso { get => _fecha_ingreso; set => _fecha_ingreso = value; }
    public bool Activo { get => _activo; set => _activo = value; }

    #endregion

    #region constructors

    public Residente()
    {
        //Default values
        Id_residente = 0;
        Nombre = "";
        Apellido = "";
        Fecha_nacimiento = DateTime.MinValue;
        Genero = "";
        Telefono = "";
        Dispositivo = new Dispositivo();
        Foto = "";
        Fecha_ingreso = DateTime.MinValue;
        Activo = false;
    }

    public Residente(int id_residente, string nombre, string apellido, DateTime fecha_nacimiento, string genero, string telefono, Dispositivo dispositivo, string foto, DateTime fecha_ingreso, bool activo)
    {
        Id_residente = id_residente;
        Nombre = nombre;
        Apellido = apellido;
        Fecha_nacimiento = fecha_nacimiento;
        Genero = genero;
        Telefono = telefono;
        Dispositivo = dispositivo;
        Foto = foto;
        Fecha_ingreso = fecha_ingreso;
        Activo = activo;
    }

    #endregion

    #region Class Methods


    public static List<Residente> Get()
    {
        MySqlCommand command = new MySqlCommand(selectAll);
        //Populate
        return ResidenteMapper.ToList(SqlServerConnection.ExecuteQuery(command));
    }


    public static Residente Get(int id) {
        MySqlCommand command = new MySqlCommand(select);
        command.Parameters.AddWithValue("@ID", id);
        //Populate
        DataTable table = SqlServerConnection.ExecuteQuery(command);

        if (table.Rows.Count > 0)
        {
            return ResidenteMapper.ToObject(table.Rows[0]);
        }
        else
        {
            throw new ResidenteNotFoundException(id);
        }
    }

    #endregion

    #region x
 
  
    #endregion
}