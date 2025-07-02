using System;
using System.Collections.Generic;
using System.Linq;
using MySql.Data.MySqlClient;
using System.Data;


public class Residente
{

    #region statement

    private static string selectAll = "SELECT id_residente, nombre, apellido, fecha_nacimiento, genero, telefono, foto, dispositivo, fecha_ingreso, activo FROM RESIDENTE";

    private static string select = "SELECT id_residente, nombre, apellido, fecha_nacimiento, genero, telefono, foto, dispositivo, fecha_ingreso, activo FROM RESIDENTE where id_residente = @ID";

    private static string insert = "INSERT INTO RESIDENTE (nombre, apellido, fecha_nacimiento, genero, telefono, foto) VALUES (@nombre, @apellido, @fecha_nacimiento, @genero, @telefono, @foto_default);";

    private static string AsignarDispositivo = "UPDATE RESIDENTE SET dispositivo = @dispositivo WHERE id_residente = @id_residente";

    private static string updateTelefono = "UPDATE RESIDENTE SET telefono = @telefono WHERE id_residente = @id";

    private static string updateEstado = "UPDATE RESIDENTE SET activo = not activo WHERE id_residente = @id";

    private static string updateFotoStatement = "UPDATE RESIDENTE SET foto = @foto WHERE id_residente = @id_residente";


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
        Id_residente = 0;
        Nombre = "";
        Apellido = "";
        Fecha_nacimiento = DateTime.MinValue;
        Genero = "";
        Telefono = "";
        Dispositivo = new Dispositivo();
        Foto = "nophoto.png";
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
        return ResidenteMapper.ToList(SqlServerConnection.ExecuteQuery(command));
    }


    public static Residente Get(int id) {
        MySqlCommand command = new MySqlCommand(select);
        command.Parameters.AddWithValue("@ID", id);
        DataTable table = SqlServerConnection.ExecuteQuery(command);

        if (table.Rows.Count > 0)
        {
            return ResidenteMapper.ToObject(table.Rows[0]);
        }
        else
        {
            return null;
        }
    }

    public static int Post(ResidentePost residente)
    {
        MySqlCommand command = new MySqlCommand(insert);

        command.Parameters.AddWithValue("@nombre", residente.nombre);
        command.Parameters.AddWithValue("@apellido", residente.apellido);
        command.Parameters.AddWithValue("@fecha_nacimiento", residente.fechaNacimiento);
        command.Parameters.AddWithValue("@genero", residente.genero);
        command.Parameters.AddWithValue("@telefono", residente.telefono);
        command.Parameters.AddWithValue("@foto_default", "nophoto.png");

        int newId = SqlServerConnection.ExecuteInsertCommandAndGetLastId(command);

        return newId;
    }

    public static bool UpdateFoto(int id_residente, string newFileName)
    {
        MySqlCommand command = new MySqlCommand(updateFotoStatement);
        command.Parameters.AddWithValue("@foto", newFileName);
        command.Parameters.AddWithValue("@id_residente", id_residente);
        return SqlServerConnection.ExecuteCommand(command) > 0;
    }


    public static int Update(int residente, int dispositivo)
    {
        int result = 0;

        MySqlCommand command = new MySqlCommand(AsignarDispositivo);
        command.Parameters.AddWithValue("@dispositivo", dispositivo);
        command.Parameters.AddWithValue("@id_residente", residente);

        return result = SqlServerConnection.ExecuteCommand(command);
    }

    public static bool UpdateTelefono(int id, string nuevoTelefono)
    {
        MySqlCommand command = new MySqlCommand(updateTelefono);
        command.Parameters.AddWithValue("@id", id);
        command.Parameters.AddWithValue("@telefono", nuevoTelefono);
        return SqlServerConnection.ExecuteCommand(command) > 0;
    }

    public static bool UpdateEstado(int id)
    {
        MySqlCommand command = new MySqlCommand(updateEstado);
        command.Parameters.AddWithValue("@id", id);
        return SqlServerConnection.ExecuteCommand(command) > 0;
    }

    #endregion
}