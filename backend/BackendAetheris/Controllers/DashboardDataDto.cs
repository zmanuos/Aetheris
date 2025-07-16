using System;
using System.Collections.Generic;

// Generic class to encapsulate a metric's value and its status
public class MetricStatus<T>
{
    public T Value { get; set; }
    public string Status { get; set; } // "ok", "warning", "critical"

    public MetricStatus(T value, string status)
    {
        Value = value;
        Status = status;
    }
}

public class DashboardDataDto
{
    public List<HeartRateDailyAverageDto> RitmoCardiacoPromedioPorDia { get; set; }
    public List<RecentAlertDto> UltimasAlertas { get; set; }
    public List<RecentCheckupDto> UltimosChequeos { get; set; }
    public List<ResidentDetailDto> Residentes { get; set; }
    public List<AlertTypeTrendDto> TiposAlertaMasComunes { get; set; }

    // New properties using MetricStatus for value and status
    public MetricStatus<int> CantidadResidentesActivos { get; set; }
    public MetricStatus<int> CantidadEmpleadosActivos { get; set; }
    public MetricStatus<int> CantidadDispositivosDisponibles { get; set; }
    public MetricStatus<int> CantidadNotasActivas { get; set; }
    public MetricStatus<double> UltimaTemperaturaAsilo { get; set; }
}

public class HeartRateDailyAverageDto
{
    public DateTime Fecha { get; set; }
    public double PromedioRitmoCardiaco { get; set; }
    public string Status { get; set; } // Status for individual heart rate averages
}

public class AlertTypeTrendDto
{
    public string TipoAlerta { get; set; }
    public int Cantidad { get; set; }
}

public class RecentAlertDto
{
    public int Id { get; set; }
    public string Mensaje { get; set; }
    public DateTime Fecha { get; set; }
    public string ResidenteNombreCompleto { get; set; }
    public string TipoAlertaNombre { get; set; }
}

public class RecentCheckupDto
{
    public int Id { get; set; }
    public DateTime Fecha { get; set; }
    public int FrecuenciaCardiaca { get; set; }
    public string Observaciones { get; set; }
    public string ResidenteNombreCompleto { get; set; }
}

public class ResidentDetailDto
{
    public int Id { get; set; }
    public string NombreCompleto { get; set; }
    public DateTime FechaNacimiento { get; set; }
    public string Genero { get; set; }
    public string Foto { get; set; }
}