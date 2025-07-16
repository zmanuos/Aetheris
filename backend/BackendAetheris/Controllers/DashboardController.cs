using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using MySql.Data.MySqlClient;
using System.Data;
using MongoDB.Driver;
using MongoDB.Bson;

[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly IMongoCollection<ContinuaResidente> _lecturasContinuasCollection;
    private readonly IMongoCollection<LecturaAmbiental> _lecturasAmbientalesCollection;

    public DashboardController()
    {
        var dbContext = new MongoDbContext();
        _lecturasContinuasCollection = dbContext.GetCollection<ContinuaResidente>("lecturas_continuas_residente");
        _lecturasAmbientalesCollection = dbContext.GetCollection<LecturaAmbiental>("lecturas_ambientales");
    }

    [HttpGet]
    public ActionResult<DashboardDataDto> GetDashboardData()
    {
        // Fetch raw data
        var ritmoCardiacoData = GetRitmoCardiacoPromedioPorDiaSemanal();
        var ultimasAlertasData = GetUltimasAlertas(3);
        var ultimosChequeosData = GetUltimosChequeos(3);
        var residentesData = GetAllResidentDetails();
        var tiposAlertaMasComunesData = GetMostCommonAlertTypes();

        var cantidadResidentes = GetCantidadResidentesActivos();
        var cantidadEmpleados = GetCantidadEmpleadosActivos();
        var cantidadDispositivos = GetCantidadDispositivosDisponibles();
        var cantidadNotas = GetCantidadNotasActivas();
        var ultimaTemperatura = GetUltimaTemperaturaAsilo();

        // Apply status logic
        var dashboardData = new DashboardDataDto
        {
            RitmoCardiacoPromedioPorDia = ritmoCardiacoData.Select(item => new HeartRateDailyAverageDto
            {
                Fecha = item.Fecha,
                PromedioRitmoCardiaco = item.PromedioRitmoCardiaco,
                Status = GetRitmoCardiacoStatus(item.PromedioRitmoCardiaco)
            }).ToList(),
            UltimasAlertas = ultimasAlertasData,
            UltimosChequeos = ultimosChequeosData,
            Residentes = residentesData,
            TiposAlertaMasComunes = tiposAlertaMasComunesData,

            // Metrics with status
            CantidadResidentesActivos = new MetricStatus<int>(cantidadResidentes, GetResidentesActivosStatus(cantidadResidentes)),
            CantidadEmpleadosActivos = new MetricStatus<int>(cantidadEmpleados, GetEmpleadosActivosStatus(cantidadEmpleados)),
            CantidadDispositivosDisponibles = new MetricStatus<int>(cantidadDispositivos, GetDispositivosDisponiblesStatus(cantidadDispositivos)),
            CantidadNotasActivas = new MetricStatus<int>(cantidadNotas, GetNotasActivasStatus(cantidadNotas)),
            UltimaTemperaturaAsilo = new MetricStatus<double>(ultimaTemperatura, GetTemperaturaAsiloStatus(ultimaTemperatura))
        };

        return Ok(dashboardData);
    }

    private List<HeartRateDailyAverageDto> GetRitmoCardiacoPromedioPorDiaSemanal()
    {
        List<HeartRateDailyAverageDto> dailyAverages = new List<HeartRateDailyAverageDto>();

        DateTime sevenDaysAgo = DateTime.UtcNow.AddDays(-7).Date;
        // Ensure that the MongoDB query uses the correct Timestamp type from LecturasContinuasResidente
        var recentReadings = _lecturasContinuasCollection.Find(x => x.Timestamp >= sevenDaysAgo).ToList();

        // Initialize with 0 for the last 7 days
        for (int i = 0; i < 7; i++)
        {
            dailyAverages.Add(new HeartRateDailyAverageDto
            {
                Fecha = sevenDaysAgo.AddDays(i).Date,
                PromedioRitmoCardiaco = 0,
                Status = "ok" // Default status, will be updated later
            });
        }

        if (recentReadings.Any())
        {
            var groupedByDay = recentReadings
                .GroupBy(x => x.Timestamp.Date)
                .Select(g => new
                {
                    Fecha = g.Key,
                    AverageHeartRate = g.Average(x => x.RitmoCardiaco)
                })
                .ToList();

            foreach (var item in groupedByDay)
            {
                var existing = dailyAverages.FirstOrDefault(d => d.Fecha == item.Fecha);
                if (existing != null)
                {
                    existing.PromedioRitmoCardiaco = Math.Round(item.AverageHeartRate, 2);
                    // Status for each average will be applied after this method returns, in GetDashboardData
                }
            }
        }

        return dailyAverages.OrderBy(d => d.Fecha).ToList();
    }

    private List<RecentAlertDto> GetUltimasAlertas(int limit)
    {
        List<RecentAlertDto> ultimasAlertas = new List<RecentAlertDto>();

        string query = @"
            SELECT
                a.id_alerta,
                a.mensaje,
                a.fecha,
                r.nombre AS ResidenteNombre,
                r.apellido AS ResidenteApellido,
                alt.nombre AS TipoAlertaNombre
            FROM ALERTA a
            LEFT JOIN RESIDENTE r ON a.id_residente = r.id_residente
            LEFT JOIN ALERTA_TIPO alt ON a.id_alerta_tipo = alt.id_alerta_tipo
            ORDER BY a.fecha DESC
            LIMIT @limit;";

        MySqlCommand command = new MySqlCommand(query);
        command.Parameters.AddWithValue("@limit", limit);

        DataTable table = SqlServerConnection.ExecuteQuery(command);

        foreach (DataRow row in table.Rows)
        {
            ultimasAlertas.Add(new RecentAlertDto
            {
                Id = Convert.ToInt32(row["id_alerta"]),
                Mensaje = row["mensaje"].ToString(),
                Fecha = Convert.ToDateTime(row["fecha"]),
                ResidenteNombreCompleto = $"{row["ResidenteNombre"]} {row["ResidenteApellido"]}".Trim(),
                TipoAlertaNombre = row["TipoAlertaNombre"].ToString()
            });
        }

        return ultimasAlertas;
    }

    private List<RecentCheckupDto> GetUltimosChequeos(int limit)
    {
        List<RecentCheckupDto> ultimosChequeos = new List<RecentCheckupDto>();

        string query = @"
            SELECT
                c.id_chequeo,
                c.fecha,
                c.frecuencia_cardiaca,
                c.observaciones,
                r.nombre AS ResidenteNombre,
                r.apellido AS ResidenteApellido
            FROM CHEQUEO c
            JOIN RESIDENTE r ON c.id_residente = r.id_residente
            ORDER BY c.fecha DESC
            LIMIT @limit;";

        MySqlCommand command = new MySqlCommand(query);
        command.Parameters.AddWithValue("@limit", limit);

        DataTable table = SqlServerConnection.ExecuteQuery(command);

        foreach (DataRow row in table.Rows)
        {
            ultimosChequeos.Add(new RecentCheckupDto
            {
                Id = Convert.ToInt32(row["id_chequeo"]),
                Fecha = Convert.ToDateTime(row["fecha"]),
                FrecuenciaCardiaca = Convert.ToInt32(row["frecuencia_cardiaca"]),
                Observaciones = row["observaciones"].ToString(),
                ResidenteNombreCompleto = $"{row["ResidenteNombre"]} {row["ResidenteApellido"]}".Trim()
            });
        }

        return ultimosChequeos;
    }

    private List<ResidentDetailDto> GetAllResidentDetails()
    {
        List<ResidentDetailDto> residentDetails = new List<ResidentDetailDto>();

        string query = @"
            SELECT
                id_residente,
                nombre,
                apellido,
                fecha_nacimiento,
                genero,
                foto
            FROM RESIDENTE
            WHERE activo = TRUE
            ORDER BY nombre, apellido;";

        MySqlCommand command = new MySqlCommand(query);
        DataTable table = SqlServerConnection.ExecuteQuery(command);

        foreach (DataRow row in table.Rows)
        {
            residentDetails.Add(new ResidentDetailDto
            {
                Id = Convert.ToInt32(row["id_residente"]),
                NombreCompleto = $"{row["nombre"]} {row["apellido"]}".Trim(),
                FechaNacimiento = Convert.ToDateTime(row["fecha_nacimiento"]),
                Genero = row["genero"].ToString(),
                Foto = row["foto"].ToString()
            });
        }

        return residentDetails;
    }

    private List<AlertTypeTrendDto> GetMostCommonAlertTypes(int limit = 5)
    {
        List<AlertTypeTrendDto> commonAlertTypes = new List<AlertTypeTrendDto>();

        string query = @"
            SELECT
                alt.nombre AS TipoAlerta,
                COUNT(a.id_alerta) AS Cantidad
            FROM ALERTA a
            JOIN ALERTA_TIPO alt ON a.id_alerta_tipo = alt.id_alerta_tipo
            GROUP BY alt.nombre
            ORDER BY Cantidad DESC
            LIMIT @limit;";

        MySqlCommand command = new MySqlCommand(query);
        command.Parameters.AddWithValue("@limit", limit);

        DataTable table = SqlServerConnection.ExecuteQuery(command);

        foreach (DataRow row in table.Rows)
        {
            commonAlertTypes.Add(new AlertTypeTrendDto
            {
                TipoAlerta = row["TipoAlerta"].ToString(),
                Cantidad = Convert.ToInt32(row["Cantidad"])
            });
        }

        return commonAlertTypes;
    }

    private int GetCantidadResidentesActivos()
    {
        string query = "SELECT COUNT(*) FROM RESIDENTE WHERE activo = TRUE;";
        MySqlCommand command = new MySqlCommand(query);
        DataTable table = SqlServerConnection.ExecuteQuery(command);
        return table.Rows.Count > 0 ? Convert.ToInt32(table.Rows[0][0]) : 0;
    }

    private int GetCantidadEmpleadosActivos()
    {
        string query = "SELECT COUNT(*) FROM PERSONAL WHERE activo = TRUE;";
        MySqlCommand command = new MySqlCommand(query);
        DataTable table = SqlServerConnection.ExecuteQuery(command);
        return table.Rows.Count > 0 ? Convert.ToInt32(table.Rows[0][0]) : 0;
    }

    private int GetCantidadDispositivosDisponibles()
    {
        string query = @"
            SELECT COUNT(D.id_dispositivo)
            FROM DISPOSITIVO D
            LEFT JOIN RESIDENTE R ON D.id_dispositivo = R.dispositivo
            WHERE D.estado = TRUE AND R.dispositivo IS NULL;";
        MySqlCommand command = new MySqlCommand(query);
        DataTable table = SqlServerConnection.ExecuteQuery(command);
        return table.Rows.Count > 0 ? Convert.ToInt32(table.Rows[0][0]) : 0;
    }

    private int GetCantidadNotasActivas()
    {
        string query = "SELECT COUNT(*) FROM NOTAS WHERE activo = 1;";
        MySqlCommand command = new MySqlCommand(query);
        DataTable table = SqlServerConnection.ExecuteQuery(command);
        return table.Rows.Count > 0 ? Convert.ToInt32(table.Rows[0][0]) : 0;
    }

    private double GetUltimaTemperaturaAsilo()
    {
        var latestReading = _lecturasAmbientalesCollection.Find(new BsonDocument())
                                                          .SortByDescending(x => x.Timestamp)
                                                          .FirstOrDefault();

        return latestReading?.Temperatura ?? 0.0;
    }

    // --- Status Determination Logic ---

    private string GetResidentesActivosStatus(int count)
    {
        if (count < 5) return "critical";
        if (count >= 5 && count <= 9) return "warning";
        return "ok"; // count > 9
    }

    private string GetEmpleadosActivosStatus(int count)
    {
        if (count < 3) return "critical"; 
        if (count >= 3 && count <= 5) return "warning";
        return "ok"; // count > 5
    }

    private string GetDispositivosDisponiblesStatus(int count)
    {
        if (count == 0) return "critical";
        if (count >= 1 && count <= 2) return "warning";
        return "ok"; // count > 2
    }

    private string GetNotasActivasStatus(int count)
    {
        if (count > 10) return "critical"; // Too many active notes might indicate an issue
        if (count >= 6 && count <= 10) return "warning";
        return "ok"; // 0-5 notes are OK
    }

    private string GetTemperaturaAsiloStatus(double temperature)
    {
        if (temperature < 10 || temperature > 35) return "critical";
        if ((temperature >= 11 && temperature <= 16) || (temperature >= 30 && temperature <= 34)) return "warning";
        return "ok";
    }

    private string GetRitmoCardiacoStatus(double bpm)
    {
        if (bpm < 60 || bpm > 100) return "critical";
        if ((bpm >= 60 && bpm <= 70) || (bpm >= 90 && bpm <= 100)) return "warning";
        return "ok"; // 71-89 bpm is OK
    }
}