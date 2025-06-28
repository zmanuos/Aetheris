using System;
using System.Collections.Generic;
using System.Data;
using MySql.Data.MySqlClient;

public class Alerta
{
    #region Statements

    private static string selectAll = "SELECT id_alerta, id_residente, id_alerta_tipo, id_area, fecha, mensaje FROM ALERTA";
    private static string select = @"SELECT id_alerta, id_residente, id_alerta_tipo, id_area, fecha, mensaje FROM ALERTA WHERE id_alerta = @ID";

    #endregion

    #region Attributes

    private int _id;
    private Residente _residente;
    private AlertaTipo _alerta_tipo;
    private Area _area;
    private DateTime _fecha;
    private string _mensaje;

    #endregion

    #region Properties

    public int id { get => _id; set => _id = value; }
    public Residente residente { get => _residente; set => _residente = value; }
    public AlertaTipo alerta_tipo { get => _alerta_tipo; set => _alerta_tipo = value; }
    public Area area { get => _area; set => _area = value; }
    public DateTime fecha { get => _fecha; set => _fecha = value; }
    public string mensaje { get => _mensaje; set => _mensaje = value; }

    #endregion

    #region Constructors

    public Alerta()
    {
        id = 0;
        residente = new Residente();
        alerta_tipo = new AlertaTipo();
        area = new Area();
        fecha = DateTime.Now;
        mensaje = "";
    }

    public Alerta(int id, Residente residente, AlertaTipo alerta_tipo, Area area, DateTime fecha, string mensaje)
    {
        this.id = id;
        this.residente = residente;
        this.alerta_tipo = alerta_tipo;
        this.area = area;
        this.fecha = fecha;
        this.mensaje = mensaje;
    }

    #endregion

    #region Methods

    public static List<Alerta> Get()
    {
        MySqlCommand command = new MySqlCommand(selectAll);
        return AlertaMapper.ToList(SqlServerConnection.ExecuteQuery(command));
    }

    public static Alerta Get(int id)
    {
        MySqlCommand command = new MySqlCommand(select);
        command.Parameters.AddWithValue("@ID", id);
        DataTable table = SqlServerConnection.ExecuteQuery(command);

        if (table.Rows.Count > 0)
        {
            return AlertaMapper.ToObject(table.Rows[0]);
        }
        else
        {
            throw new AlertaNotFoundException(id);
        }
    }

    #endregion
}
