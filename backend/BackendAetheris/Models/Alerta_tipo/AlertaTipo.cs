using System;
using System.Data;
using MySql.Data.MySqlClient;

public class AlertaTipo
{
    #region Statements

    private static string select = "SELECT id_alerta_tipo, nombre, descripcion FROM ALERTA_TIPO WHERE id_alerta_tipo = @ID";

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

    public AlertaTipo()
    {
        id = 0;
        nombre = "";
        descripcion = "";
    }

    public AlertaTipo(int id, string nombre, string descripcion)
    {
        this.id = id;
        this.nombre = nombre;
        this.descripcion = descripcion;
    }

    #endregion

    #region Methods

    public static AlertaTipo Get(int id)
    {
        MySqlCommand command = new MySqlCommand(select);
        command.Parameters.AddWithValue("@ID", id);
        DataTable table = SqlServerConnection.ExecuteQuery(command);

        if (table.Rows.Count > 0)
        {
            return AlertaTipoMapper.ToObject(table.Rows[0]);
        }
        else
        {
            return null;
        }
    }

    #endregion
}
