using System;
using System.Collections.Generic;
using System.Data;
using MySql.Data.MySqlClient;

public class Area
{
    #region Statements

    private static string selectAll = "SELECT id_area, nombre, descripcion FROM AREA";
    private static string select = "SELECT id_area, nombre, descripcion FROM AREA WHERE id_area = @ID";

    #endregion

    #region Attributes

    private int _id;
    private string _nombre;
    private string _descripcion;

    #endregion

    #region Properties

    public int id { get => _id; set => _id = value; }
    public string nombre { get => _nombre; set => _nombre = value; }
    public string descripcion { get => _descripcion; set => _descripcion = value; }

    #endregion

    #region Constructors

    public Area()
    {
        id = 0;
        nombre = "";
        descripcion = "";
    }

    public Area(int id, string nombre, string descripcion)
    {
        this.id = id;
        this.nombre = nombre;
        this.descripcion = descripcion;
    }

    #endregion

    #region Methods

    public static List<Area> Get()
    {
        MySqlCommand command = new MySqlCommand(selectAll);
        return AreaMapper.ToList(SqlServerConnection.ExecuteQuery(command));
    }

    public static Area Get(int id)
    {
        MySqlCommand command = new MySqlCommand(select);
        command.Parameters.AddWithValue("@ID", id);
        DataTable table = SqlServerConnection.ExecuteQuery(command);

        if (table.Rows.Count > 0)
        {
            return AreaMapper.ToObject(table.Rows[0]);
        }
        else
        {
            throw new AreaNotFoundException(id);
        }
    }

    #endregion
}
