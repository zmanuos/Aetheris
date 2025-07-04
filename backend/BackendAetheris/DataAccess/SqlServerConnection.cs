using System.Data;
using MySql.Data.MySqlClient;
using Microsoft.Extensions.Configuration;
using System;

public class SqlServerConnection
{

    #region connections

    private static IConfiguration _configuration;

    public static void InitializeConfiguration(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    private static string GetConnectionString()
    {
        string connectionString = _configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrEmpty(connectionString))
        {
            Console.WriteLine("Error: La cadena de conexión 'DefaultConnection' no está configurada.");
            throw new InvalidOperationException("La cadena de conexión 'DefaultConnection' no está configurada.");
        }
        return connectionString;
    }

    private static MySqlConnection GetConnection()
    {
        MySqlConnection connection = null;
        try
        {
            connection = new MySqlConnection(GetConnectionString());
            connection.Open();
            return connection;
        }
        catch (MySqlException ex)
        {
            Console.WriteLine($"Error de MySQL al abrir la conexión: {ex.Message}");
            throw;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error general al abrir la conexión: {ex.Message}");
            throw;
        }
    }


    #endregion

    #region methods

    public static DataTable ExecuteQuery(MySqlCommand command)
    {
        DataTable table = new DataTable();
        MySqlConnection connection = null;

        try
        {
            connection = GetConnection();

            if (connection == null || connection.State != ConnectionState.Open)
            {
                Console.WriteLine("La conexión a la base de datos no está abierta.");
                return table;
            }

            command.Connection = connection;
            MySqlDataAdapter adapter = new MySqlDataAdapter(command);
            adapter.Fill(table);
        }
        catch (MySqlException ex)
        {
            Console.WriteLine($"Error de MySQL al ejecutar la consulta: {ex.Message}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error general al ejecutar la consulta: {ex.Message}");
        }
        finally
        {
            if (connection != null && connection.State == ConnectionState.Open)
            {
                connection.Close();
                connection.Dispose();
            }
        }
        return table;
    }


    public static int ExecuteProcedure(MySqlCommand command)
    {
        int result = 999;
        MySqlConnection connection = null;

        try
        {
            connection = GetConnection();
            if (connection == null || connection.State != ConnectionState.Open)
            {
                Console.WriteLine("La conexión a la base de datos no está abierta para el procedimiento.");
                return result;
            }

            command.Connection = connection;
            command.CommandType = CommandType.StoredProcedure;
            MySqlParameter returnParameter = new MySqlParameter("@status", DbType.Int32);
            returnParameter.Direction = ParameterDirection.Output;
            command.Parameters.Add(returnParameter);
            command.ExecuteNonQuery();
            result = (Int32)command.Parameters["@status"].Value;
        }
        catch (MySqlException ex)
        {
            Console.WriteLine($"Error de MySQL al ejecutar el procedimiento: {ex.Message}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error general al ejecutar el procedimiento: {ex.Message}");
        }
        finally
        {
            if (connection != null && connection.State == ConnectionState.Open)
            {
                connection.Close();
                connection.Dispose();
            }
        }
        return result;
    }

    // Nuevo método para ejecutar comandos de inserción y obtener el último ID generado
    public static int ExecuteInsertCommandAndGetLastId(MySqlCommand command)
    {
        int lastInsertId = 0;
        MySqlConnection connection = null;

        try
        {
            connection = GetConnection();
            if (connection == null || connection.State != ConnectionState.Open)
            {
                Console.WriteLine("La conexión a la base de datos no está abierta para el comando de inserción.");
                return 0; // O un valor que indique error
            }

            command.Connection = connection;

            // Ejecuta la inserción
            command.ExecuteNonQuery();

            // Obtiene el último ID insertado (para MySQL)
            // Asegúrate de que el CommandText no tenga un punto y coma al final si se concatena
            command.CommandText = "SELECT LAST_INSERT_ID();";
            command.Parameters.Clear(); // Limpia los parámetros del INSERT para la nueva consulta
            object result = command.ExecuteScalar(); // Ejecuta la consulta para obtener el ID

            if (result != null && result != DBNull.Value)
            {
                lastInsertId = Convert.ToInt32(result);
            }
        }
        catch (ArgumentException ex)
        {
            Console.WriteLine($"Error de argumento al ejecutar comando de inserción: {ex.Message}");
            lastInsertId = 0;
        }
        catch (MySqlException ex)
        {
            Console.WriteLine($"Error de MySQL al ejecutar comando de inserción: {ex.Message}");
            lastInsertId = 0;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error general al ejecutar comando de inserción: {ex.Message}");
            lastInsertId = 0;
        }
        finally
        {
            if (connection != null && connection.State == ConnectionState.Open)
            {
                connection.Close();
                connection.Dispose();
            }
        }
        return lastInsertId;
    }


    public static int ExecuteCommand(MySqlCommand command)
    {
        int result = 0;
        MySqlConnection connection = null;

        try
        {
            connection = GetConnection();
            if (connection == null || connection.State != ConnectionState.Open)
            {
                Console.WriteLine("La conexión a la base de datos no está abierta para el comando.");
                return result;
            }

            command.Connection = connection;

            result = command.ExecuteNonQuery();
        }
        catch (ArgumentException ex)
        {
            Console.WriteLine($"Error de argumento al ejecutar comando: {ex.Message}");
            result = 0;
        }
        catch (MySqlException ex)
        {
            Console.WriteLine($"Error de MySQL al ejecutar comando: {ex.Message}");
            result = 0;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error general al ejecutar comando: {ex.Message}");
            result = 0;
        }
        finally 
        {
            if (connection != null && connection.State == ConnectionState.Open)
            {
                connection.Close();
                connection.Dispose();
            }
        }
        return result;
    }

    #endregion
}