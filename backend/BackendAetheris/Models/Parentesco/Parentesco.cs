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


    public static List<Parentesco> Get()
    {
        MySqlCommand command = new MySqlCommand(selectAll);
        return ParentescoMapper.ToList(SqlServerConnection.ExecuteQuery(command));
    }

    public static Parentesco Get(int id)
    {
        MySqlCommand command = new MySqlCommand(select);
        command.Parameters.AddWithValue("@ID", id);
        DataTable table = SqlServerConnection.ExecuteQuery(command);

        if (table.Rows.Count > 0)
        {
            return ParentescoMapper.ToObject(table.Rows[0]);
        }
        else
        {
            throw new FamiliarNotFoundException(id);
        }
    }


    #endregion
}