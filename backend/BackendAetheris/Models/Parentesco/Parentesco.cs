// Parentesco.cs (Versión Actualizada)
using System;
using System.Collections.Generic; // Necesario para List
using System.Data;
using MySql.Data.MySqlClient;

public class Parentesco
{
    #region Statements

    private static string selectAll = "SELECT id_parentesco, parentesco FROM PARENTESCO"; // ¡NUEVO! Para obtener todos
    private static string select = "SELECT id_parentesco, parentesco FROM PARENTESCO WHERE id_parentesco = @ID";

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

    public Parentesco()
    {
        id = 0;
        nombre = "";
    }

    public Parentesco(int id, string nombre)
    {
        this.id = id;
        this.nombre = nombre;
    }

    #endregion

    #region Methods

    // NUEVO MÉTODO: Para obtener todos los parentescos
    public static List<Parentesco> Get()
    {
        MySqlCommand command = new MySqlCommand(selectAll);
        DataTable table = SqlServerConnection.ExecuteQuery(command);
        List<Parentesco> parentescos = new List<Parentesco>();
        foreach (DataRow row in table.Rows)
        {
            parentescos.Add(new Parentesco
            {
                id = Convert.ToInt32(row["id_parentesco"]),
                nombre = row["parentesco"].ToString()
            });
        }
        return parentescos;
    }

    // Tu método Get(int id) existente
    public static Parentesco Get(int id)
    {
        MySqlCommand command = new MySqlCommand(select);
        command.Parameters.AddWithValue("@ID", id);
        DataTable table = SqlServerConnection.ExecuteQuery(command);

        if (table.Rows.Count > 0)
        {
            // Asegúrate de que ParentescoMapper.ToObject esté definido y mapee correctamente
            // O puedes hacer el mapeo aquí mismo como en Get() si no usas un mapper
            return ParentescoMapper.ToObject(table.Rows[0]);
        }
        else
        {
            return null;
        }
    }

    #endregion
}