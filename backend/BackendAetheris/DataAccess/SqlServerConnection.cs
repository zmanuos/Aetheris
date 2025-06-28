using System.Data;
using Microsoft.Data.SqlClient;
using MySql.Data.MySqlClient;

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
        return _configuration.GetConnectionString("DefaultConnection");
    }

    private static MySqlConnection GetConnection()
    {
        var connection = new MySqlConnection(GetConnectionString());
        connection.Open();
        return connection;
    }


    #endregion

    #region methods

    public static DataTable ExecuteQuery(MySqlCommand command)
    {
        //Result
        DataTable table = new DataTable();
        //Get connection
        MySqlConnection connection = GetConnection();
        //Connection is open
        if (connection.State == ConnectionState.Open)
        {
            try
            {
                //Assign connection
                command.Connection = connection;
                //Adapter
                MySqlDataAdapter adapter = new MySqlDataAdapter(command);
                // execute querry

                adapter.Fill(table);

            }
            catch (SqlException e)
            {
            }
            catch (Exception e)
            {
            }
        }
        return table;
    }


    public static int ExecuteProcedure(MySqlCommand command)
    {
        //result
        int result = 999;
        // conectivity
        MySqlConnection connection = GetConnection();
        //Check if connection is open
        if (connection.State == ConnectionState.Open)
        {
            // Assign connection
            command.Connection = connection;
            // Declare Command as Store procedure
            command.CommandType = CommandType.StoredProcedure;
            // add return parameter
            MySqlParameter returnParameter = new MySqlParameter("@status", DbType.Int32);
            // parameter is output
            returnParameter.Direction = ParameterDirection.Output;
            // add parameter 
            command.Parameters.Add(returnParameter);
            // execute procedure
            command.ExecuteNonQuery();
            // read parameter result
            result = (Int32)command.Parameters["@status"].Value;
        }

        return result;
    }


    public static int ExecuteCommand(MySqlCommand command)
    {
        //result
        int result = 0;
        // Connection
        MySqlConnection connection = GetConnection();
        //Check if connection is open
        if (connection.State == ConnectionState.Open)
        {
            try
            {
                // Assign connection
                command.Connection = connection;
                
                // execute Query
                result = command.ExecuteNonQuery(); // regresa numero de registros afectados por el comando
                
                // close connection
                connection.Close();
                connection.Dispose();
            }
            catch (ArgumentException e)
            {
                result = 0;
            }
            catch (MySqlException e) 
            {
                result = 0;
            }
            catch (Exception e)
            {
                result = 0;
            }        
        }

        return result;
    }




    #endregion

}