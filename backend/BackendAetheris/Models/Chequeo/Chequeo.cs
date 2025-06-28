using System;
using System.Collections.Generic;
using System.Data;
using MySql.Data.MySqlClient;

public class Chequeo
{
    #region Statements

    private static string selectAll = "SELECT id_chequeo, id_residente, fecha, frecuencia_cardiaca, oxigeno, peso, observaciones FROM CHEQUEO";
    private static string select = "SELECT id_chequeo, id_residente, fecha, frecuencia_cardiaca, oxigeno, peso, observaciones FROM CHEQUEO WHERE id_chequeo = @ID";

    #endregion

    #region Attributes

    private int _id;
    private Residente _residente;
    private DateTime _fecha;
    private int _frecuencia_cardiaca;
    private decimal _oxigeno;
    private decimal _peso;
    private string _observaciones;

    #endregion

    #region Properties

    public int id { get => _id; set => _id = value; }
    public Residente residente { get => _residente; set => _residente = value; }
    public DateTime fecha { get => _fecha; set => _fecha = value; }
    public int frecuencia_cardiaca { get => _frecuencia_cardiaca; set => _frecuencia_cardiaca = value; }
    public decimal oxigeno { get => _oxigeno; set => _oxigeno = value; }
    public decimal peso { get => _peso; set => _peso = value; }
    public string observaciones { get => _observaciones; set => _observaciones = value; }

    #endregion

    #region Constructors

    public Chequeo()
    {
        id = 0;
        residente = new Residente();
        fecha = DateTime.Now;
        frecuencia_cardiaca = 0;
        oxigeno = 0;
        peso = 0;
        observaciones = "";
    }

    public Chequeo(int id, Residente residente, DateTime fecha, int frecuencia_cardiaca, decimal oxigeno, decimal peso, string observaciones)
    {
        this.id = id;
        this.residente = residente;
        this.fecha = fecha;
        this.frecuencia_cardiaca = frecuencia_cardiaca;
        this.oxigeno = oxigeno;
        this.peso = peso;
        this.observaciones = observaciones;
    }

    #endregion

    #region Class Methods

    public static List<Chequeo> Get()
    {
        MySqlCommand command = new MySqlCommand(selectAll);
        return ChequeoMapper.ToList(SqlServerConnection.ExecuteQuery(command));
    }

    public static Chequeo Get(int id)
    {
        MySqlCommand command = new MySqlCommand(select);
        command.Parameters.AddWithValue("@ID", id);
        DataTable table = SqlServerConnection.ExecuteQuery(command);

        if (table.Rows.Count > 0)
        {
            return ChequeoMapper.ToObject(table.Rows[0]);
        }
        else
        {
            throw new ChequeoNotFoundException(id);
        }
    }

    #endregion
}
