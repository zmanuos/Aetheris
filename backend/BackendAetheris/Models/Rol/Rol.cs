using System;
using System.Data;
using MySql.Data.MySqlClient;

public class Rol
{
    #region Statements

    private static string select = "SELECT id_role, nombre FROM ROL WHERE id_role = @ID";

    #endregion

    #region Attributes

    private int _id;
    private string _nombre;

    #endregion

    #region Properties

    public int id { get => _id; set => _id = value; }
    public string nombre { get => _nombre; set => _nombre = value; }

    #endregion

    #region Constructors

    public Rol()
    {
        id = 0;
        nombre = "";
    }

    public Rol(int id, string nombre)
    {
        this.id = id;
        this.nombre = nombre;
    }

    #endregion

    #region Methods

    public static Rol Get(int id)
    {
        MySqlCommand command = new MySqlCommand(select);
        command.Parameters.AddWithValue("@ID", id);
        DataTable table = SqlServerConnection.ExecuteQuery(command);

        if (table.Rows.Count > 0)
        {
            return RolMapper.ToObject(table.Rows[0]);
        }
        else
        {
            return null; // Puedes retornar null o manejar con mensaje si gustas.
        }
    }

    #endregion
}
