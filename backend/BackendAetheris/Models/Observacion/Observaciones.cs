using System;
using System.Collections.Generic;
using System.Data;
using MySql.Data.MySqlClient;

public class Observacion
{
    #region Statements

    private static string selectAll = "SELECT id_observaciones, id_residente, observacion FROM OBSERVACIONES";
    private static string select = "SELECT id_observaciones, id_residente, observacion FROM OBSERVACIONES WHERE id_residente = @ID";
    private static string insert = "INSERT INTO OBSERVACIONES (id_residente, observacion) VALUES (@IdResidente, @Observacion)";
    private static string update = "UPDATE OBSERVACIONES SET observacion = @Texto WHERE id_observaciones = @Id";

    #endregion

    #region Attributes

    private int _id;
    private int _idResidente;
    private string _observacionTexto;
    
    #endregion

    #region Properties

    public int id { get => _id; set => _id = value; }
    public int id_residente { get => _idResidente; set => _idResidente = value; }
    public string observacion { get => _observacionTexto; set => _observacionTexto = value; }
    
    #endregion

    #region Constructors

    public Observacion()
    {
        id = 0;
        id_residente = 0;
        observacion = "";
    }

    public Observacion(int id, int id_residente, string observacion)
    {
        this.id = id;
        this.id_residente = id_residente;
        this.observacion = observacion;
    }

    #endregion

    #region Methods

    public static List<Observacion> Get()
    {
        MySqlCommand command = new MySqlCommand(selectAll);
        return ObservacionMapper.ToList(SqlServerConnection.ExecuteQuery(command));
    }

    public static Observacion Get(int id)
    {
        MySqlCommand command = new MySqlCommand(select);
        command.Parameters.AddWithValue("@ID", id);
        DataTable table = SqlServerConnection.ExecuteQuery(command);

        if (table.Rows.Count > 0)
        {
            return ObservacionMapper.ToObject(table.Rows[0]);
        }
        else
        {
            throw new Exception($"Observación con ID {id} no encontrada.");
        }
    }

    public static bool Insert(ObservacionPost observacion)
    {
        
        MySqlCommand command = new MySqlCommand(insert);
        command.Parameters.AddWithValue("@IdResidente", observacion.id_residente);
        command.Parameters.AddWithValue("@Observacion", observacion.observacion);

        int rowsAffected = SqlServerConnection.ExecuteCommand(command);
        return rowsAffected > 0;
    }


    public static bool Update(int id, string texto)
    {
        MySqlCommand command = new MySqlCommand(update);
        command.Parameters.AddWithValue("@Id", id);
        command.Parameters.AddWithValue("@Texto", texto);

        int rowsAffected = SqlServerConnection.ExecuteCommand(command);
        return rowsAffected > 0;
    }


    #endregion
}
