using System;
using System.Collections.Generic;
using System.Data;
using MySql.Data.MySqlClient;

public class Asilo
{
    #region Statements
    private static string select = "SELECT id_asilo, nombre, direccion, pais, ciudad, codigo_postal, telefono, correo, cantidad_residentes, cantidad_empleados FROM ASILO WHERE id_asilo = 1";
    private static string update = "UPDATE ASILO SET " +
        "nombre = @nombre, " +
        "direccion = @direccion, " +
        "pais = @pais, " +
        "ciudad = @ciudad, " +
        "codigo_postal = @cp, " +
        "telefono = @telefono, " +
        "correo = @correo";

    #endregion

    #region Attributes
    private int _id;
    private string _nombre;
    private string _direccion;
    private string _pais;
    private string _ciudad;
    private string _codigo_postal;
    private string _telefono;
    private string _correo;
    private int _cantidad_residentes;
    private int _cantidad_empleados;
    #endregion

    #region Properties
    public int id { get => _id; set => _id = value; }
    public string nombre { get => _nombre; set => _nombre = value; }
    public string direccion { get => _direccion; set => _direccion = value; }
    public string pais { get => _pais; set => _pais = value; }
    public string ciudad { get => _ciudad; set => _ciudad = value; }
    public string codigo_postal { get => _codigo_postal; set => _codigo_postal = value; }
    public string telefono { get => _telefono; set => _telefono = value; }
    public string correo { get => _correo; set => _correo = value; }
    public int cantidad_residentes { get => _cantidad_residentes; set => _cantidad_residentes = value; }
    public int cantidad_empleados { get => _cantidad_empleados; set => _cantidad_empleados = value; }
    #endregion

    #region Constructors
    public Asilo()
    {
        id = 0;
        nombre = "";
        direccion = "";
        pais = "";
        ciudad = "";
        codigo_postal = "";
        telefono = "";
        correo = "";
        cantidad_residentes = 0;
        cantidad_empleados = 0;
    }

    public Asilo(int id, string nombre, string direccion, string pais, string ciudad, string codigo_postal, string telefono, string correo, int cantidad_residentes, int cantidad_empleados)
    {
        this.id = id;
        this.nombre = nombre;
        this.direccion = direccion;
        this.pais = pais;
        this.ciudad = ciudad;
        this.codigo_postal = codigo_postal;
        this.telefono = telefono;
        this.correo = correo;
        this.cantidad_residentes = cantidad_residentes;
        this.cantidad_empleados = cantidad_empleados;
    }
    #endregion

    #region Class Methods

    public static Asilo Get()
    {
        MySqlCommand command = new MySqlCommand(select);
        DataTable table = SqlServerConnection.ExecuteQuery(command);

        return AsiloMapper.ToObject(table.Rows[0]);
    }

    public static bool Update(AsiloPut asilo)
    {

        MySqlCommand command = new MySqlCommand(update);
        command.Parameters.AddWithValue("@nombre", asilo.nombre);
        command.Parameters.AddWithValue("@direccion", asilo.direccion);
        command.Parameters.AddWithValue("@pais", asilo.pais);
        command.Parameters.AddWithValue("@ciudad", asilo.ciudad);
        command.Parameters.AddWithValue("@cp", asilo.codigo_postal);
        command.Parameters.AddWithValue("@telefono", asilo.telefono);
        command.Parameters.AddWithValue("@correo", asilo.correo);

        return SqlServerConnection.ExecuteCommand(command) > 0;
    }


    #endregion
}
