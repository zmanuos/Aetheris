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
using Microsoft.AspNetCore.WebSockets;
using Microsoft.Extensions.Logging; // Added for ILogger

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

// Ensure SqlServerConnection and AppConfig are properly defined or mocked if they are external
// For this example, I'm assuming they exist elsewhere or are simple placeholders.
// If they are not defined, this code will not compile without their definitions.
// public static class SqlServerConnection { public static void InitializeConfiguration(IConfiguration config) { /* ... */ } }
// public static class AppConfig { public static void ConfigureServices(IServiceCollection services, IConfiguration config) { /* ... */ } public static void ConfigurePipeline(IApplicationBuilder app) { /* ... */ } }

// Add logging to the service collection
builder.Services.AddLogging(configure => configure.AddConsole());

// Placeholder for AppConfig.ConfigureServices if not defined elsewhere
// If AppConfig is defined in a separate file, ensure it's correctly referenced.
// Otherwise, you might need to move its content here.
// For now, I'm assuming it's correctly handled.
// Example:
// builder.Services.AddControllers();
// builder.Services.AddEndpointsApiExplorer();
// builder.Services.AddSwaggerGen();
AppConfig.ConfigureServices(builder.Services, builder.Configuration);


builder.Services.AddSingleton<IFirebaseAuthService, FirebaseAuthService>();
builder.Services.AddWebSocketManager();

// Agrega servicios de WebSockets
builder.Services.AddWebSockets(options =>
{
    options.KeepAliveInterval = TimeSpan.FromMinutes(10);
});

var app = builder.Build();

// Placeholder for AppConfig.ConfigurePipeline if not defined elsewhere
// If AppConfig is defined in a separate file, ensure it's correctly referenced.
// Otherwise, you might need to move its content here.
// For now, I'm assuming it's correctly handled.
// Example:
// if (app.Environment.IsDevelopment()) { app.UseSwagger(); app.UseSwaggerUI(); }
// app.UseHttpsRedirection();
// app.UseAuthorization();
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

app.MapControllers(); // Ensure this is present if you have API controllers

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
    private readonly ConcurrentDictionary<string, WebSocket> _sockets = new ConcurrentDictionary<string, WebSocket>();
    private readonly ILogger<WebSocketHandler> _logger; // Inject ILogger

    public WebSocketHandler(ILogger<WebSocketHandler> logger) // Constructor to receive ILogger
    {
        _logger = logger;
    }

    public async Task HandleWebSocketAsync(WebSocket webSocket)
    {
        var socketId = Guid.NewGuid().ToString();
        _sockets.TryAdd(socketId, webSocket);
        _logger.LogInformation($"WebSocket conectado: {socketId}"); // Use logger

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
                    _logger.LogInformation($"Mensaje recibido de {socketId}: {message}"); // Use logger

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
            _logger.LogError(ex, $"Error en WebSocket {socketId}"); // Use logger for errors
        }
        finally
        {
            _sockets.TryRemove(socketId, out _);
            await webSocket.CloseAsync(
                WebSocketCloseStatus.NormalClosure,
                "Cierre normal",
                CancellationToken.None);
            _logger.LogInformation($"WebSocket desconectado: {socketId}"); // Use logger
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
