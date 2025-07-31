using System;
using System.Collections.Generic;
using System.Data;
using MySql.Data.MySqlClient;

public class Nota
{
    #region Statements

    // ACTUALIZADO: Se añade id_personal a todas las sentencias SELECT
    // Esta sentencia selectAll asegura que se obtengan TODAS las notas, sin filtrar por 'activo'.
    private static string selectAll = "SELECT id_notas, id_familiar, id_personal, nota, fecha, activo FROM NOTAS";
    
    // Esta sentencia 'select' con WHERE activo = 1 no se usa en Get() ni GetNotesByFamiliarId() actualmente.
    // La mantengo si tiene algún otro uso específico en tu aplicación. Si no, puedes eliminarla.
    private static string select = "SELECT id_notas, id_familiar, id_personal, nota, fecha, activo FROM NOTAS WHERE activo = 1";
    
    // selectByFamiliar también asegura que se obtengan TODAS las notas para un familiar, sin filtrar por 'activo'.
    private static string selectByFamiliar = "SELECT id_notas, id_familiar, id_personal, nota, fecha, activo FROM NOTAS WHERE id_familiar = @IDFAMILIAR";
    private static string update = "UPDATE NOTAS SET nota = @Nota WHERE id_notas = @IdNota";
    
    // ACTUALIZADO: Se añade id_personal y 'activo' a la sentencia INSERT
    private static string insert = "INSERT INTO NOTAS (id_familiar, id_personal, nota, activo) VALUES (@IdFamiliar, @IdPersonal, @Nota, @Activo)"; 
    private static string updateActivo = "UPDATE NOTAS SET activo = @Activo WHERE id_notas = @IdNota"; // Statement para actualizar solo 'activo'


    #endregion

    #region Attributes

    private int _id;
    private int _idFamiliar;
    private int? _idPersonal;
    private string _notaTexto;
    private DateTime _fecha;
    private bool _activo; // Atributo para el estado activo/inactivo

    #endregion

    #region Properties

    public int id { get => _id; set => _id = value; }
    public int id_familiar { get => _idFamiliar; set => _idFamiliar = value; }
    public int? id_personal { get => _idPersonal; set => _idPersonal = value; }
    public string nota { get => _notaTexto; set => _notaTexto = value; }
    public DateTime fecha { get => _fecha; set => _fecha = value; }
    public bool activo { get => _activo; set => _activo = value; } // Propiedad para activo

    #endregion

    #region Constructors

    public Nota(int id, int idFamiliar, int? idPersonal, string notaTexto, DateTime fecha, bool activo)
    {
        _id = id;
        _idFamiliar = idFamiliar;
        _idPersonal = idPersonal;
        _notaTexto = notaTexto;
        _fecha = fecha;
        _activo = activo;
    }

    #endregion

    #region Methods

    public static List<Nota> Get()
    {
        // Este método usa 'selectAll' para obtener TODAS las notas.
        MySqlCommand command = new MySqlCommand(selectAll);
        return NotaMapper.ToList(SqlServerConnection.ExecuteQuery(command));
    }

    public static List<Nota> GetNotesByFamiliarId(int familiarId)
    {
        // Este método usa 'selectByFamiliar' para obtener TODAS las notas de un familiar.
        MySqlCommand command = new MySqlCommand(selectByFamiliar);
        command.Parameters.AddWithValue("@IDFAMILIAR", familiarId);
        return NotaMapper.ToList(SqlServerConnection.ExecuteQuery(command));
    }
    
    public static bool Insert(NotaPost nota)
    {
        MySqlCommand command = new MySqlCommand(insert);
        command.Parameters.AddWithValue("@IdFamiliar", nota.id_familiar);
        command.Parameters.AddWithValue("@IdPersonal", (object)nota.id_personal ?? DBNull.Value);
        command.Parameters.AddWithValue("@Nota", nota.notaTexto);
        command.Parameters.AddWithValue("@Activo", true); // Por defecto, una nota nueva se inserta como activa (no leída)

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

    public static bool UpdateActivo(int id, bool activo)
    {
        MySqlCommand command = new MySqlCommand(updateActivo);
        command.Parameters.AddWithValue("@IdNota", id);
        command.Parameters.AddWithValue("@Activo", activo);

        int rowsAffected = SqlServerConnection.ExecuteCommand(command);
        return rowsAffected > 0;
    }

    #endregion
}