
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Microsoft.Data.SqlClient;
using MySql.Data.MySqlClient;
using System.Data;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory.Database;

public class Personal
{

    #region statement

    private static string selectAll = "SELECT id_personal, nombre, apellido, fecha_nacimiento, genero, telefono, activo FROM PERSONAL";

    private static string select = "SELECT id_personal, nombre, apellido, fecha_nacimiento, genero, telefono, activo FROM PERSONAL where id_personal = @ID";

    private static string updateTelefono = "UPDATE PERSONAL SET telefono = @telefono WHERE id_personal = @id";

    private static string updateEstado = "UPDATE PERSONAL SET activo = not activo WHERE id_personal = @id";


    #endregion

    #region attributes

    private int _id;
    private string _nombre;
    private string _apellido;
    private DateTime _fecha_nacimiento;
    private string _genero;
    private string _telefono;
    private bool _activo;


    #endregion

    #region properties

    public int id { get => _id; set => _id = value; }
    public string nombre { get => _nombre; set => _nombre = value; }
    public string apellido { get => _apellido; set => _apellido = value; }
    public DateTime fecha_nacimiento { get => _fecha_nacimiento; set => _fecha_nacimiento = value; }
    public string genero { get => _genero; set => _genero = value; }
    public string telefono { get => _telefono; set => _telefono = value; }
    public bool activo { get => _activo; set => _activo = value; }


    #endregion

    #region constructors

    public Personal()
    {
        //Default values
        id = 0;
        nombre = "";
        apellido = "";
        fecha_nacimiento = DateTime.MinValue;
        genero = "";
        telefono = "";
        activo = false;
    }

    public Personal(int id, string nombre, string apellido, DateTime fecha_nacimiento, string genero, string telefono, bool activo)
    {
        this.id = id;
        this.nombre = nombre;
        this.apellido = apellido;
        this.fecha_nacimiento = fecha_nacimiento;
        this.genero = genero;
        this.telefono = telefono;
        this.activo = activo;
    }

    #endregion

    #region Class Methods


    public static List<Personal> Get()
    {
        MySqlCommand command = new MySqlCommand(selectAll);
        //Populate
        return PersonalMapper.ToList(SqlServerConnection.ExecuteQuery(command));
    }


    public static Personal Get(int id) {
        MySqlCommand command = new MySqlCommand(select);
        command.Parameters.AddWithValue("@ID", id);
        //Populate
        DataTable table = SqlServerConnection.ExecuteQuery(command);

        if (table.Rows.Count > 0)
        {
            return PersonalMapper.ToObject(table.Rows[0]);
        }
        else
        {
            throw new PersonalNotFoundException(id);
        }
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

    public static int RegistrarPersonal(PersonalPost personal)
    {
        MySqlCommand cmd = new MySqlCommand("spRegistrarEmpleado");
        cmd.CommandType = CommandType.StoredProcedure;

        cmd.Parameters.AddWithValue("@nombre", personal.nombre);
                cmd.Parameters.AddWithValue("@apellido", personal.apellido);
                cmd.Parameters.AddWithValue("@fecha_nacimiento", personal.fechaNacimiento);
                cmd.Parameters.AddWithValue("@genero", personal.genero);
                cmd.Parameters.AddWithValue("@telefono", personal.telefono);
                cmd.Parameters.AddWithValue("@email", personal.email);
                cmd.Parameters.AddWithValue("@contra", personal.contra);

            return SqlServerConnection.ExecuteProcedure(cmd);
    }

    #endregion

}
