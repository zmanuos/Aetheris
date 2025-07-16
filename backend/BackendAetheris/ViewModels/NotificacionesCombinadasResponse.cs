using MySql.Data.MySqlClient;
using System.Collections.Generic;
using System.Data; // Para DataTable
using System;

public class NotificacionesData
{
    public static List<NotificacionCombinada> GetLatestCombinedNotifications(int limit = 10)
    {
        List<NotificacionCombinada> combinedNotifications = new List<NotificacionCombinada>();

        // La consulta SQL combinada (ACTUALIZADA)
        string query = $@"
            (SELECT
                'alerta' AS Tipo,
                a.id_alerta AS IdReferencia,
                a.fecha AS Fecha,
                a.mensaje AS Descripcion,
                at.nombre AS TipoDetalleAlerta,
                r.nombre AS ResidenteNombre,
                r.apellido AS ResidenteApellido,
                r.id_residente AS IdResidenteAsociado, -- Añadido el ID del residente para alertas
                NULL AS FamiliarNombre,
                NULL AS FamiliarApellido
            FROM
                alerta a
            JOIN
                alerta_tipo at ON a.id_alerta_tipo = at.id_alerta_tipo
            JOIN
                residente r ON a.id_residente = r.id_residente
            WHERE
                r.activo = TRUE)
            UNION ALL
            (SELECT
                'nota' AS Tipo,
                n.id_notas AS IdReferencia,
                n.fecha AS Fecha,
                n.nota AS Descripcion,
                NULL AS TipoDetalleAlerta,
                res.nombre AS ResidenteNombre,
                res.apellido AS ResidenteApellido,
                res.id_residente AS IdResidenteAsociado, -- Añadido el ID del residente para notas
                f.nombre AS FamiliarNombre,
                f.apellido AS FamiliarApellido
            FROM
                notas n
            JOIN
                familiar f ON n.id_familiar = f.id_familiar
            JOIN
                residente res ON f.id_residente = res.id_residente
            WHERE
                n.activo = TRUE)
            ORDER BY
                Fecha DESC
            LIMIT {limit};";

        // Crea un MySqlCommand para pasarlo a SqlServerConnection
        MySqlCommand command = new MySqlCommand(query);

        // Ejecuta la consulta usando tu clase SqlServerConnection
        DataTable dt = SqlServerConnection.ExecuteQuery(command);

        // Mapea el DataTable a una lista de NotificacionCombinada
        foreach (DataRow row in dt.Rows)
        {
            combinedNotifications.Add(new NotificacionCombinada
            {
                Tipo = row["Tipo"].ToString(),
                IdReferencia = Convert.ToInt32(row["IdReferencia"]),
                Fecha = Convert.ToDateTime(row["Fecha"]),
                Descripcion = row["Descripcion"].ToString(),
                TipoDetalleAlerta = row["TipoDetalleAlerta"] is DBNull ? null : row["TipoDetalleAlerta"].ToString(),
                ResidenteNombre = row["ResidenteNombre"] is DBNull ? null : row["ResidenteNombre"].ToString(),
                ResidenteApellido = row["ResidenteApellido"] is DBNull ? null : row["ResidenteApellido"].ToString(),
                IdResidenteAsociado = row["IdResidenteAsociado"] is DBNull ? (int?)null : Convert.ToInt32(row["IdResidenteAsociado"]), // 
                FamiliarNombre = row["FamiliarNombre"] is DBNull ? null : row["FamiliarNombre"].ToString(),
                FamiliarApellido = row["FamiliarApellido"] is DBNull ? null : row["FamiliarApellido"].ToString()
            });
        }

        return combinedNotifications;
    }
}