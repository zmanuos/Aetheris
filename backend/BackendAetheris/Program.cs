using FirebaseAdmin;
using Google.Apis.Auth.OAuth2;
using Microsoft.Extensions.Configuration;
using System.IO;
using System;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Builder;
using System.Net.WebSockets;
using System.Threading.Tasks;
using System.Collections.Concurrent;
using System.Threading;
using System.Text;
using Microsoft.AspNetCore.Http;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.UseUrls("http://0.0.0.0:5214", "https://0.0.0.0:7160");

var serviceAccountKeyPath = builder.Configuration.GetValue<string>("Firebase:ServiceAccountKeyPath");

if (string.IsNullOrEmpty(serviceAccountKeyPath) || !File.Exists(serviceAccountKeyPath))
{
    Console.WriteLine($"ADVERTENCIA: Archivo de credenciales de Firebase Admin SDK no encontrado en: {serviceAccountKeyPath}. Las operaciones de Firebase Admin pueden fallar.");
}
else
{
    if (FirebaseApp.DefaultInstance == null)
    {
        FirebaseApp.Create(new AppOptions()
        {
            Credential = GoogleCredential.FromFile(serviceAccountKeyPath),
        });
        Console.WriteLine("Firebase Admin SDK inicializado exitosamente.");
    }
    else
    {
        Console.WriteLine("Firebase Admin SDK ya estaba inicializado.");
    }
}

SqlServerConnection.InitializeConfiguration(builder.Configuration);

AppConfig.ConfigureServices(builder.Services, builder.Configuration);

builder.Services.AddSingleton<IFirebaseAuthService, FirebaseAuthService>();
builder.Services.AddWebSocketManager();

// Agrega servicios de WebSockets
builder.Services.AddWebSockets(options =>
{
    options.KeepAliveInterval = TimeSpan.FromMinutes(10);
});

var app = builder.Build();

AppConfig.ConfigurePipeline(app);

// Usa WebSockets. Esto debe ir antes del mapeo de controladores.
app.UseWebSockets();

// Mapea la ruta '/ws' al WebSocketHandler
app.Map("/ws", async context =>
{
    if (context.WebSockets.IsWebSocketRequest)
    {
        using var webSocket = await context.WebSockets.AcceptWebSocketAsync();
        var webSocketHandler = app.Services.GetRequiredService<WebSocketHandler>();
        await webSocketHandler.HandleWebSocketAsync(webSocket);
    }
    else
    {
        context.Response.StatusCode = StatusCodes.Status400BadRequest;
    }
});

// Mapea la ruta '/ws/sensor_data' al WebSocketHandler
app.Map("/ws/sensor_data", async context =>
{
    if (context.WebSockets.IsWebSocketRequest)
    {
        using var webSocket = await context.WebSockets.AcceptWebSocketAsync();
        var webSocketHandler = app.Services.GetRequiredService<WebSocketHandler>();
        await webSocketHandler.HandleWebSocketAsync(webSocket);
    }
    else
    {
        context.Response.StatusCode = StatusCodes.Status400BadRequest;
    }
});


app.MapControllers();

app.Run();

public static class WebSocketManagerExtensions
{
    public static IServiceCollection AddWebSocketManager(this IServiceCollection services)
    {
        services.AddSingleton<WebSocketHandler>();
        return services;
    }
}

public class WebSocketHandler
{
    private readonly ConcurrentDictionary<string, WebSocket> _sockets = new();
    private readonly ILogger<WebSocketHandler> _logger;

    public WebSocketHandler(ILogger<WebSocketHandler> logger)
    {
        _logger = logger;
    }

    public async Task HandleWebSocketAsync(WebSocket webSocket)
    {
        var socketId = Guid.NewGuid().ToString();
        _sockets.TryAdd(socketId, webSocket);
        _logger.LogInformation($"WebSocket conectado: {socketId}");

        var buffer = new byte[1024 * 4];
        
        try
        {
            var receiveResult = await webSocket.ReceiveAsync(
                new ArraySegment<byte>(buffer), CancellationToken.None);

            while (!receiveResult.CloseStatus.HasValue)
            {
                // Procesar mensaje recibido
                if (receiveResult.MessageType == WebSocketMessageType.Text)
                {
                    var message = Encoding.UTF8.GetString(buffer, 0, receiveResult.Count);
                    _logger.LogInformation($"Mensaje recibido de {socketId}: {message}");

                    // Enviar confirmación de recepción
                    var ackMessage = $"ACK: {DateTime.UtcNow:o}";
                    await SendMessageAsync(webSocket, ackMessage);
                    await SendMessageToAllAsync(message);
                }

                receiveResult = await webSocket.ReceiveAsync(
                    new ArraySegment<byte>(buffer), CancellationToken.None);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error en WebSocket {socketId}");
        }
        finally
        {
            _sockets.TryRemove(socketId, out _);
            await webSocket.CloseAsync(
                WebSocketCloseStatus.NormalClosure,
                "Cierre normal",
                CancellationToken.None);
            _logger.LogInformation($"WebSocket desconectado: {socketId}");
        }
    }

    private async Task SendMessageAsync(WebSocket socket, string message)
    {
        var bytes = Encoding.UTF8.GetBytes(message);
        await socket.SendAsync(
            new ArraySegment<byte>(bytes),
            WebSocketMessageType.Text,
            true,
            CancellationToken.None);
    }

    public async Task SendMessageToAllAsync(string message)
    {
        foreach (var pair in _sockets)
        {
            if (pair.Value.State == WebSocketState.Open)
            {
                await SendMessageAsync(pair.Value, message);
            }
        }
    }
}