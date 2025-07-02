using System;
using System.Collections.Generic;
using System.Data;
using MySql.Data.MySqlClient;

public class Familiar
{
    #region Statements

    // Actualiza los SELECT para incluir firebase_uid
    private static string selectAll = "SELECT id_familiar, nombre, apellido, fecha_nacimiento, genero, telefono, id_residente, id_parentesco, firebase_uid FROM FAMILIAR";
    private static string select = "SELECT id_familiar, nombre, apellido, fecha_nacimiento, genero, telefono, id_residente, id_parentesco, firebase_uid FROM FAMILIAR WHERE id_familiar = @ID";

    // ¡NUEVO INSERT! Para registrar Familiar con firebase_uid, sin lógica de usuario SQL
    private static string insertFamiliar = "INSERT INTO FAMILIAR (nombre, apellido, fecha_nacimiento, genero, telefono, id_residente, id_parentesco, firebase_uid) VALUES (@nombre, @apellido, @fecha_nacimiento, @genero, @telefono, @id_residente, @id_parentesco, @firebase_uid); SELECT LAST_INSERT_ID();";
    
    private static string updateTelefono = "UPDATE FAMILIAR SET telefono = @telefono WHERE id_familiar = @id";
    
    #endregion

    #region Attributes

    private int _id;
    private string _nombre;
    private string _apellido;
    private DateTime _fecha_nacimiento;
    private string _genero;
    private string _telefono;
    private Residente _residente;
    private Parentesco _parentesco; 
    private string _firebase_uid; 

    #endregion

    #region Properties

    public int id { get => _id; set => _id = value; }
    public string nombre { get => _nombre; set => _nombre = value; }
    public string apellido { get => _apellido; set => _apellido = value; }
    public DateTime fecha_nacimiento { get => _fecha_nacimiento; set => _fecha_nacimiento = value; }
    public string genero { get => _genero; set => _genero = value; }
    public string telefono { get => _telefono; set => _telefono = value; }
    public Residente residente { get => _residente; set => _residente = value; }
    public Parentesco parentesco { get => _parentesco; set => _parentesco = value; }
    public string firebase_uid { get => _firebase_uid; set => _firebase_uid = value; } // ¡NUEVA PROPIEDAD!

    #endregion

    #region Constructors

    public Familiar()
    {
        id = 0;
        nombre = "";
        apellido = "";
        fecha_nacimiento = DateTime.MinValue;
        genero = "";
        telefono = "";
        residente = new Residente();
        parentesco = new Parentesco();
        firebase_uid = ""; // Inicializa
    }

    public Familiar(int id, string nombre, string apellido, DateTime fecha_nacimiento, string genero, string telefono, Residente residente, Parentesco parentesco, string firebase_uid)
    {
        this.id = id;
        this.nombre = nombre;
        this.apellido = apellido;
        this.fecha_nacimiento = fecha_nacimiento;
        this.genero = genero;
        this.telefono = telefono;
        this.residente = residente;
        this.parentesco = parentesco;
        this.firebase_uid = firebase_uid;
    }

    #endregion

    #region Class Methods

    public static List<Familiar> Get()
    {
        MySqlCommand command = new MySqlCommand(selectAll);
        return FamiliarMapper.ToList(SqlServerConnection.ExecuteQuery(command));
    }

    public static Familiar Get(int id)
    {
        MySqlCommand command = new MySqlCommand(select);
        command.Parameters.AddWithValue("@ID", id);
        DataTable table = SqlServerConnection.ExecuteQuery(command);

        if (table.Rows.Count > 0)
        {
            // Asegúrate de que FamiliarMapper.ToObject pueda manejar la nueva columna firebase_uid
            return FamiliarMapper.ToObject(table.Rows[0]);
        }
        else
        {
            throw new FamiliarNotFoundException(id);
        }
    }

    public static bool UpdateTelefono(int id, string nuevoTelefono)
    {
        MySqlCommand command = new MySqlCommand(updateTelefono);
        command.Parameters.AddWithValue("@id", id);
        command.Parameters.AddWithValue("@telefono", nuevoTelefono);
        return SqlServerConnection.ExecuteCommand(command) > 0;
    }

    // ¡NUEVO MÉTODO POST para registrar Familiar!
    // Ahora recibe FamiliarPost que incluye firebase_uid
    // En Familiar.cs, dentro del método Post
    public static int Post(FamiliarPost familiar)
    {
        MySqlCommand cmd = new MySqlCommand(insertFamiliar);

        cmd.Parameters.AddWithValue("@nombre", familiar.nombre);
        cmd.Parameters.AddWithValue("@apellido", familiar.apellido);
        cmd.Parameters.AddWithValue("@fecha_nacimiento", familiar.fechaNacimiento);
        cmd.Parameters.AddWithValue("@genero", familiar.genero);
        cmd.Parameters.AddWithValue("@telefono", familiar.telefono);
        
        // --- CAMBIOS AQUÍ: Usar los nuevos nombres de propiedades del DTO ---
        cmd.Parameters.AddWithValue("@id_residente", familiar.id_residente); // Era familiar.residente
        cmd.Parameters.AddWithValue("@id_parentesco", familiar.id_parentesco); // Era familiar.parentesco
        
        cmd.Parameters.AddWithValue("@firebase_uid", familiar.firebase_uid);

        return SqlServerConnection.ExecuteInsertCommandAndGetLastId(cmd); // Asumo que usas este método ahora
    }

    #endregion
}