
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Microsoft.Data.SqlClient;
using MySql.Data.MySqlClient;
using System.Data;

public class Personal
{

    #region statement

    private static string selectAll = "SELECT id_personal, nombre, apellido, fecha_nacimiento, genero, telefono, activo FROM PERSONAL";

    private static string select = "SELECT id_personal, nombre, apellido, fecha_nacimiento, genero, telefono, activo FROM PERSONAL where id_personal = @ID";

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

    #endregion

}
