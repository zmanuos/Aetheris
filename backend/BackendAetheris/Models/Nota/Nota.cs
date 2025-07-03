using System;
using System.Collections.Generic;
using System.Data;
using MySql.Data.MySqlClient;

public class Nota
{
    #region Statements

    private static string selectAll = "SELECT id_notas, id_familiar, nota, fecha, activo FROM NOTAS";
    private static string select = "SELECT id_notas, id_familiar, nota, fecha, activo FROM NOTAS WHERE activo = 1";
    private static string selectOne = "SELECT id_notas, id_familiar, nota, fecha, activo FROM NOTAS WHERE id_familiar = @ID";
    private static string update = "UPDATE NOTAS SET nota = @Nota WHERE id_notas = @IdNota";
    private static string insert = "INSERT INTO NOTAS (id_familiar, nota) VALUES (@IdFamiliar, @Nota)";

    #endregion

    #region Attributes

    private int _id;
    private int _idFamiliar;
    private string _notaTexto;
    private DateTime _fecha;

    #endregion

    #region Properties

    public int id { get => _id; set => _id = value; }
    public int id_familiar { get => _idFamiliar; set => _idFamiliar = value; }
    public string nota { get => _notaTexto; set => _notaTexto = value; }
    public DateTime fecha { get => _fecha; set => _fecha = value; }
    public bool activo { get; set; }

    #endregion

    #region Constructors

    public Nota()
    {
        id = 0;
        id_familiar = 0;
        nota = "";
        fecha = DateTime.Now;
        activo = false;
    }

    public Nota(int id, int id_familiar, string nota, DateTime fecha, bool activo)
    {
        this.id = id;
        this.id_familiar = id_familiar;
        this.nota = nota;
        this.fecha = fecha;
        this.activo = activo;
    }

    #endregion

    #region Methods

    public static List<Nota> GetAll()
    {
        MySqlCommand command = new MySqlCommand(selectAll);
        return NotaMapper.ToList(SqlServerConnection.ExecuteQuery(command));
    }

    public static List<Nota> Get()
    {
        MySqlCommand command = new MySqlCommand(select);
        return NotaMapper.ToList(SqlServerConnection.ExecuteQuery(command));
    }


    public static Nota Get(int id)
    {
        MySqlCommand command = new MySqlCommand(selectOne);
        command.Parameters.AddWithValue("@ID", id);
        DataTable table = SqlServerConnection.ExecuteQuery(command);

        if (table.Rows.Count > 0)
        {
            return NotaMapper.ToObject(table.Rows[0]);
        }
        else
        {
            throw new Exception($"Nota con ID {id} no encontrada.");
        }
    }


    public static bool Insert(NotaPost nota)
    {
        MySqlCommand command = new MySqlCommand(insert);
        command.Parameters.AddWithValue("@IdFamiliar", nota.id_familiar);
        command.Parameters.AddWithValue("@Nota", nota.notaTexto);

        int rowsAffected = SqlServerConnection.ExecuteCommand(command);
        return rowsAffected > 0;
    }

    
    public static bool Update(int id, string notaTexto)
    {
        MySqlCommand command = new MySqlCommand(update);
        command.Parameters.AddWithValue("@IdNota", id);
        command.Parameters.AddWithValue("@Nota", notaTexto);

        int rowsAffected = SqlServerConnection.ExecuteCommand(command);
        return rowsAffected > 0;
    }


    #endregion
}
