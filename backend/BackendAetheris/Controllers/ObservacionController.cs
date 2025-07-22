using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using MySql.Data.MySqlClient; // Make sure this is imported if using MySqlCommand directly

[Route("api/[controller]")]
[ApiController]
public class ObservacionController : ControllerBase
{
    [HttpGet]
    public ActionResult Get()
    {
        return Ok(ObservacionListResponse.GetResponse(Observacion.Get()));
    }


    [HttpGet("{id_residente}")]
    public ActionResult Get(int id_residente)
    {
        try
        {
            List<Observacion> obsList = Observacion.GetByResidentId(id_residente);
            
            if (obsList.Count > 0)
            {
                return Ok(ObservacionListResponse.GetResponse(obsList));
            }
            else
            {
                return Ok(MessageResponse.GetReponse(1, $"No se encontraron observaciones para el residente con ID {id_residente}", MessageType.Warning));
            }
        }
        catch (Exception e)
        {
            return Ok(MessageResponse.GetReponse(999, e.Message, MessageType.CriticalError));
        }
    }

    [HttpPost]
    public ActionResult Post([FromForm] ObservacionPost observaciones)
    {
        try
        {
            // Assuming Observacion.Insert now returns the ID or a boolean indicating success
            bool result = Observacion.Insert(observaciones);

            if (result)
                return Ok(MessageResponse.GetReponse(0, "Se ha registrado la observación exitosamente", MessageType.Success));
            else
                return Ok(MessageResponse.GetReponse(2, "No se pudo registrar la observación", MessageType.Warning));
        }
        catch (Exception ex)
        {
            return StatusCode(500, MessageResponse.GetReponse(3, "Error interno: " + ex.Message, MessageType.Error));
        }
    }

    [HttpPut("{id}")]
    public ActionResult Put(int id, [FromForm] string observacion)
    {
        try
        {
            bool result = Observacion.Update(id, observacion);

            if (result)
                return Ok(MessageResponse.GetReponse(0, "Observación actualizada exitosamente", MessageType.Success));
            else
                return NotFound(MessageResponse.GetReponse(1, "Observación no encontrada", MessageType.Warning));
        }
        catch (Exception ex)
        {
            return StatusCode(500, MessageResponse.GetReponse(3, "Error interno: " + ex.Message, MessageType.Error));
        }
    }

    [HttpDelete("{id}")]
    public ActionResult Delete(int id)
    {
        try
        {
            bool result = Observacion.Delete(id); // Call the new Delete method

            if (result)
                return Ok(MessageResponse.GetReponse(0, "Observación eliminada exitosamente", MessageType.Success));
            else
                return NotFound(MessageResponse.GetReponse(1, "Observación no encontrada", MessageType.Warning));
        }
        catch (Exception ex)
        {
            return StatusCode(500, MessageResponse.GetReponse(3, "Error interno: " + ex.Message, MessageType.Error));
        }
    }
}


// You also need to make sure your Observacion class has a Delete method that uses SqlServerConnection.ExecuteCommand:

/*
public class Observacion
{
    public int Id { get; set; }
    public int Id_Residente { get; set; }
    public string observacion { get; set; }

    // ... other properties and methods

    public static bool Insert(ObservacionPost observacionData)
    {
        using (MySqlCommand command = new MySqlCommand("INSERT INTO Observaciones (id_residente, observacion) VALUES (@id_residente, @observacion);"))
        {
            command.Parameters.AddWithValue("@id_residente", observacionData.id_residente);
            command.Parameters.AddWithValue("@observacion", observacionData.observacion);
            int rowsAffected = SqlServerConnection.ExecuteCommand(command); // Or ExecuteInsertCommandAndGetLastId if you need the ID back
            return rowsAffected > 0;
        }
    }

    public static bool Update(int id, string newObservacionText)
    {
        using (MySqlCommand command = new MySqlCommand("UPDATE Observaciones SET observacion = @observacion WHERE id = @id;"))
        {
            command.Parameters.AddWithValue("@observacion", newObservacionText);
            command.Parameters.AddWithValue("@id", id);
            int rowsAffected = SqlServerConnection.ExecuteCommand(command);
            return rowsAffected > 0;
        }
    }

    public static bool Delete(int id)
    {
        using (MySqlCommand command = new MySqlCommand("DELETE FROM Observaciones WHERE id = @id;"))
        {
            command.Parameters.AddWithValue("@id", id);
            int rowsAffected = SqlServerConnection.ExecuteCommand(command);
            return rowsAffected > 0;
        }
    }

    public static List<Observacion> GetByResidentId(int id_residente)
    {
        List<Observacion> observations = new List<Observacion>();
        using (MySqlCommand command = new MySqlCommand("SELECT id, id_residente, observacion FROM Observaciones WHERE id_residente = @id_residente;"))
        {
            command.Parameters.AddWithValue("@id_residente", id_residente);
            DataTable dt = SqlServerConnection.ExecuteQuery(command);

            foreach (DataRow row in dt.Rows)
            {
                observations.Add(new Observacion
                {
                    Id = Convert.ToInt32(row["id"]),
                    Id_Residente = Convert.ToInt32(row["id_residente"]),
                    observacion = row["observacion"].ToString()
                });
            }
        }
        return observations;
    }

    // You will likely have other methods like Get() or ObservacionPost class definition
    // For example:
    // public class ObservacionPost
    // {
    //     public int id_residente { get; set; }
    //     public string observacion { get; set; }
    // }
    // And MessageResponse / ObservacionListResponse classes
}
*/