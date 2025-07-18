using System;
using System.Collections.Generic;
using System.Data;
using MySql.Data.MySqlClient;

public class Nota
{
    #region Statements

    // ACTUALIZADO: Se añade id_personal a todas las sentencias SELECT
    private static string selectAll = "SELECT id_notas, id_familiar, id_personal, nota, fecha, activo FROM NOTAS";
    // Mantener select como para notas activas en general
    private static string select = "SELECT id_notas, id_familiar, id_personal, nota, fecha, activo FROM NOTAS WHERE activo = 1";
    // Renombramos 'selectOne' lógicamente a 'selectByFamiliar' para claridad, aunque el nombre de la variable no tiene que cambiar
    private static string selectByFamiliar = "SELECT id_notas, id_familiar, id_personal, nota, fecha, activo FROM NOTAS WHERE id_familiar = @IDFAMILIAR";
    private static string update = "UPDATE NOTAS SET nota = @Nota WHERE id_notas = @IdNota";
    // ACTUALIZADO: Se añade id_personal a la sentencia INSERT
    private static string insert = "INSERT INTO NOTAS (id_familiar, id_personal, nota) VALUES (@IdFamiliar, @IdPersonal, @Nota)";

    #endregion

    #region Attributes

    private int _id;
    private int _idFamiliar;
    private int? _idPersonal; // MODIFICADO: Ahora es nullable (int?)
    private string _notaTexto;
    private DateTime _fecha;

    #endregion

    #region Properties

    public int id { get => _id; set => _id = value; }
    public int id_familiar { get => _idFamiliar; set => _idFamiliar = value; }
    public int? id_personal { get => _idPersonal; set => _idPersonal = value; } // MODIFICADO: Ahora es nullable (int?)
    public string nota { get => _notaTexto; set => _notaTexto = value; }
    public DateTime fecha { get => _fecha; set => _fecha = value; }
    public bool activo { get; set; }

    #endregion

    #region Constructors

    public Nota()
    {
        id = 0;
        id_familiar = 0;
        id_personal = null; // Inicializar nuevo atributo como null
        nota = "";
        fecha = DateTime.Now;
        activo = false;
    }

    // Constructor para mapeo desde la base de datos (NotaMapper lo usará)
    public Nota(int id, int idFamiliar, int? idPersonal, string notaTexto, DateTime fecha, bool activo) // MODIFICADO: idPersonal es int?
    {
        this.id = id;
        this.id_familiar = idFamiliar;
        this.id_personal = idPersonal; // Asignar nuevo atributo
        this.nota = notaTexto;
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

    // NUEVO MÉTODO: Para obtener TODAS las notas de un familiar
    public static List<Nota> GetNotesByFamiliarId(int familiarId)
    {
        MySqlCommand command = new MySqlCommand(selectByFamiliar); // Usa la sentencia SQL que filtra por id_familiar
        command.Parameters.AddWithValue("@IDFAMILIAR", familiarId); // Pasa el parámetro correctamente
        DataTable table = SqlServerConnection.ExecuteQuery(command);

        // Retorna la lista de notas usando el mapeador, incluso si está vacía
        return NotaMapper.ToList(table);
    }

    // Opcional: Si necesitas un método para obtener una ÚNICA nota por su propio ID (id_notas)
    // public static Nota GetById(int notaId)
    // {
    //     // Necesitarías una nueva sentencia SQL si el ID de la nota es diferente al id_familiar
    //     // Por ejemplo: "SELECT ... FROM NOTAS WHERE id_notas = @IDNOTA"
    //     // MySqlCommand command = new MySqlCommand("SELECT id_notas, id_familiar, id_personal, nota, fecha, activo FROM NOTAS WHERE id_notas = @IDNOTA");
    //     // command.Parameters.AddWithValue("@IDNOTA", notaId);
    //     // DataTable table = SqlServerConnection.ExecuteQuery(command);
    //     // if (table.Rows.Count > 0)
    //     // {
    //     //     return NotaMapper.ToObject(table.Rows[0]);
    //     // }
    //     // else
    //     // {
    //     //     throw new Exception($"Nota con ID {notaId} no encontrada.");
    //     // }
    // }


    public static bool Insert(NotaPost nota)
    {
        MySqlCommand command = new MySqlCommand(insert);
        command.Parameters.AddWithValue("@IdFamiliar", nota.id_familiar);
        // MODIFICADO: Manejar id_personal nullable. Si es null, envía DBNull.Value
        command.Parameters.AddWithValue("@IdPersonal", (object)nota.id_personal ?? DBNull.Value);
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