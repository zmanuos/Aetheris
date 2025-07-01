using System;
using System.Collections.Generic;
using System.Data;
using MySql.Data.MySqlClient;

public class Familiar
{
    #region Statements

    private static string selectAll = "SELECT id_familiar, nombre, apellido, fecha_nacimiento, genero, telefono, id_residente, id_parentesco FROM FAMILIAR";
    private static string select = "SELECT id_familiar, nombre, apellido, fecha_nacimiento, genero, telefono, id_residente, id_parentesco FROM FAMILIAR WHERE id_familiar = @ID";

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
    }

    public Familiar(int id, string nombre, string apellido, DateTime fecha_nacimiento, string genero, string telefono, Residente residente, Parentesco parentesco)
    {
        this.id = id;
        this.nombre = nombre;
        this.apellido = apellido;
        this.fecha_nacimiento = fecha_nacimiento;
        this.genero = genero;
        this.telefono = telefono;
        this.residente = residente;
        this.parentesco = parentesco;
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

   
    public static int RegistrarFamiliar(FamiliarPost familiar)
    {
        MySqlCommand cmd = new MySqlCommand("spRegistrarFamiliar");
        cmd.CommandType = CommandType.StoredProcedure;

        cmd.Parameters.AddWithValue("@nombre", familiar.nombre);
        cmd.Parameters.AddWithValue("@apellido", familiar.apellido);
        cmd.Parameters.AddWithValue("@fecha_nacimiento", familiar.fechaNacimiento);
        cmd.Parameters.AddWithValue("@genero", familiar.genero);
        cmd.Parameters.AddWithValue("@telefono", familiar.telefono);
        cmd.Parameters.AddWithValue("@email", familiar.email);
        cmd.Parameters.AddWithValue("@contrasena", familiar.contra);
        cmd.Parameters.AddWithValue("@id_residente", familiar.residente);
        cmd.Parameters.AddWithValue("@id_parentesco", familiar.parentesco);

        return SqlServerConnection.ExecuteProcedure(cmd);
    }


    #endregion
}
