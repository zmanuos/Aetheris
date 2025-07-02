// CommonApiResponse.cs
// Esta clase proporciona un formato estándar para las respuestas de la API,
// incluyendo un mensaje, tipo y datos opcionales.

using System;
// No se necesita el using para MessageType si está en el mismo namespace
// o es global, pero si está en un namespace diferente, podrías necesitarlo.
// Por ejemplo: using YourProject.Enums; si MessageType está en YourProject.Enums.

public class CommonApiResponse : JsonResponse
{
    public string Message { get; set; }
    public string Type { get; set; } // Para serializar el MessageType a string (Ej: "Success", "Error")
    public object Data { get; set; } // Propiedad genérica para datos adicionales (ej: el ID del residente)

    // Constructor privado para asegurar que solo se use el método estático GetResponse
    private CommonApiResponse() { }

    // Método estático para crear instancias de CommonApiResponse de forma consistente
    public static CommonApiResponse GetResponse(int status, string message, MessageType type, object data = null)
    {
        return new CommonApiResponse
        {
            Status = status,
            Message = message,
            Type = type.ToString(), // Asegúrate de que MessageType sea accesible aquí
            Data = data
        };
    }
}