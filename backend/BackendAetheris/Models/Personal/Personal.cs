﻿// Personal.cs
using System;
using System.Collections.Generic;
using System.Data;
using MySql.Data.MySqlClient;

public class Personal
{
    #region statement

    private static string selectAll = "SELECT id_personal, nombre, apellido, fecha_nacimiento, genero, telefono, activo, firebase_uid FROM PERSONAL";
    private static string select = "SELECT id_personal, nombre, apellido, fecha_nacimiento, genero, telefono, activo, firebase_uid FROM PERSONAL WHERE id_personal = @ID";
    private static string insert = "INSERT INTO PERSONAL (nombre, apellido, fecha_nacimiento, genero, telefono, activo, firebase_uid) VALUES (@nombre, @apellido, @fecha_nacimiento, @genero, @telefono, @activo, @firebase_uid)";

    #endregion

    #region attributes

    private int _id;
    private string _nombre;
    private string _apellido;
    private DateTime _fecha_nacimiento;
    private string _genero;
    private string _telefono;
    private bool _activo;
    private string? _firebaseUid; // Ahora es nullable con '?'

    #endregion

    #region properties

    public int id { get => _id; set => _id = value; }
    public string nombre { get => _nombre; set => _nombre = value; }
    public string apellido { get => _apellido; set => _apellido = value; }
    public DateTime fecha_nacimiento { get => _fecha_nacimiento; set => _fecha_nacimiento = value; }
    public string genero { get => _genero; set => _genero = value; }
    public string telefono { get => _telefono; set => _telefono = value; }
    public bool activo { get => _activo; set => _activo = value; }
    public string? firebaseUid { get => _firebaseUid; set => _firebaseUid = value; } // Ahora la propiedad es nullable

    #endregion

    #region constructors

    public Personal()
    {
        // Inicializa todas las propiedades con valores por defecto no nulos
        id = 0;
        nombre = string.Empty; // Usar string.Empty en lugar de "" o null para strings no nulos
        apellido = string.Empty;
        fecha_nacimiento = DateTime.MinValue;
        genero = string.Empty;
        telefono = string.Empty;
        activo = false;
        firebaseUid = null; // 'null' es válido para 'string?'
    }

    public Personal(int id, string nombre, string apellido, DateTime fecha_nacimiento, string genero, string telefono, bool activo, string? firebaseUid)
    {
        this.id = id;
        this.nombre = nombre;
        this.apellido = apellido;
        this.fecha_nacimiento = fecha_nacimiento;
        this.genero = genero;
        this.telefono = telefono;
        this.activo = activo;
        this.firebaseUid = firebaseUid;
    }

    #endregion

    #region Class Methods

    public static List<Personal> Get()
    {
        MySqlCommand command = new MySqlCommand(selectAll);
        return PersonalMapper.ToList(SqlServerConnection.ExecuteQuery(command));
    }

    public static Personal Get(int id)
    {
        MySqlCommand command = new MySqlCommand(select);
        command.Parameters.AddWithValue("@ID", id);
        DataTable table = SqlServerConnection.ExecuteQuery(command);

        if (table.Rows.Count > 0)
        {
            return PersonalMapper.ToObject(table.Rows[0]);
        }
        else
        {
            throw new PersonalNotFoundException(id);
        }
    }

    public int Add()
    {
        MySqlCommand command = new MySqlCommand(insert);
        command.Parameters.AddWithValue("@nombre", this.nombre);
        command.Parameters.AddWithValue("@apellido", this.apellido);
        command.Parameters.AddWithValue("@fecha_nacimiento", this.fecha_nacimiento);
        command.Parameters.AddWithValue("@genero", this.genero);
        command.Parameters.AddWithValue("@telefono", this.telefono);
        command.Parameters.AddWithValue("@activo", this.activo);
        command.Parameters.AddWithValue("@firebase_uid", (object)this.firebaseUid ?? DBNull.Value);

        int rowsAffected = SqlServerConnection.ExecuteCommand(command);
        return rowsAffected;
    }

    #endregion
}