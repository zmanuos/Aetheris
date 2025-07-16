using System;
using System.Collections.Generic; // Asegúrate de incluirlo si NotificacionesCombinadasResponse está en el mismo archivo

public class NotificacionCombinada
{
    public string Tipo { get; set; } // "alerta" o "nota"
    public int IdReferencia { get; set; } // ID de la alerta o nota original
    public DateTime Fecha { get; set; }
    public string Descripcion { get; set; } // Contenido del mensaje o la nota

    // Campos específicos para Alerta
    public string TipoDetalleAlerta { get; set; } // Ej. "Crítica", "Media"
    public string ResidenteNombre { get; set; }
    public string ResidenteApellido { get; set; }
    public int? IdResidenteAsociado { get; set; } // <--- ¡Esta es la propiedad que falta y es necesaria!

    // Campos específicos para Nota
    public string FamiliarNombre { get; set; }
    public string FamiliarApellido { get; set; }
}

// Puedes anidar esta clase o dejarla separada en el mismo archivo o en su propio archivo
public class NotificacionesCombinadasResponse
{
    public List<NotificacionCombinada> Notificaciones { get; set; }

    public static NotificacionesCombinadasResponse GetResponse(List<NotificacionCombinada> notificaciones)
    {
        return new NotificacionesCombinadasResponse { Notificaciones = notificaciones };
    }
}