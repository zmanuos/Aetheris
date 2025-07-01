using System;
using System.Collections.Generic;
using System.Data;
using MySql.Data.MySqlClient;

public class Usuario
{
    #region Statements

    private static string selectAll = "SELECT id_usuario, usuario, contra, email, rol, CreatedAt, isActive FROM USUARIO";
    private static string select = "SELECT id_usuario, usuario, contra, email, rol, CreatedAt, isActive FROM USUARIO WHERE id_usuario = @ID";
    private static string UpdateEstado = "UPDATE USUARIOS SET estado = NOT estado WHERE id_usuario = @id";

    #endregion

    #region Attributes

    private int _id;
    private int _usuario;
    private string _contra;
    private string _email;
    private Rol _rol;
    private DateTime _createdAt;
    private bool _isActive;

    #endregion

    #region Properties

    public int id { get => _id; set => _id = value; }
    public int usuario { get => _usuario; set => _usuario = value; }
    public string contra { get => _contra; set => _contra = value; }
    public string email { get => _email; set => _email = value; }
    public Rol rol { get => _rol; set => _rol = value; }
    public DateTime createdAt { get => _createdAt; set => _createdAt = value; }
    public bool isActive { get => _isActive; set => _isActive = value; }

    #endregion

    #region Constructors

    public Usuario()
    {
        id = 0;
        usuario = 0;
        contra = "";
        email = "";
        rol = new Rol();
        createdAt = DateTime.Now;
        isActive = true;
    }

    public Usuario(int id, int usuario, string contra, string email, Rol rol, DateTime createdAt, bool isActive)
    {
        this.id = id;
        this.usuario = usuario;
        this.contra = contra;
        this.email = email;
        this.rol = rol;
        this.createdAt = createdAt;
        this.isActive = isActive;
    }

    #endregion

    #region Class Methods

    public static List<Usuario> Get()
    {
        MySqlCommand command = new MySqlCommand(selectAll);
        return UsuarioMapper.ToList(SqlServerConnection.ExecuteQuery(command));
    }

    public static Usuario Get(int id)
    {
        MySqlCommand command = new MySqlCommand(select);
        command.Parameters.AddWithValue("@ID", id);
        DataTable table = SqlServerConnection.ExecuteQuery(command);

        if (table.Rows.Count > 0)
        {
            return UsuarioMapper.ToObject(table.Rows[0]);
        }
        else
        {
            throw new UsuarioNotFoundException(id);
        }
    }

    public static bool Update(int id_dispositivo)
    {

        MySqlCommand command = new MySqlCommand(UpdateEstado);
        command.Parameters.AddWithValue("@id", id_dispositivo);

        return SqlServerConnection.ExecuteCommand(command) > 0;
    }

    #endregion
}
