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

var app = builder.Build();

AppConfig.ConfigurePipeline(app);

app.UseWebSockets();

app.Use(async (context, next) =>
{
    if (context.Request.Path == "/ws/sensor_data")
    {
        if (context.WebSockets.IsWebSocketRequest)
        {
            using var webSocket = await context.WebSockets.AcceptWebSocketAsync();
            await app.Services.GetRequiredService<WebSocketHandler>().HandleWebSocketAsync(webSocket);
        }
        else
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
        }
    }
    else
    {
        await next();
    }
});

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

    public async Task HandleWebSocketAsync(WebSocket webSocket)
    {
        var socketId = Guid.NewGuid().ToString();
        _sockets.TryAdd(socketId, webSocket);

        Console.WriteLine($"WebSocket conectado: {socketId}");

        var buffer = new byte[1024 * 4];
        var receiveResult = await webSocket.ReceiveAsync(
            new ArraySegment<byte>(buffer), CancellationToken.None);

        while (!receiveResult.CloseStatus.HasValue)
        {
            receiveResult = await webSocket.ReceiveAsync(
                new ArraySegment<byte>(buffer), CancellationToken.None);
        }

        _sockets.TryRemove(socketId, out _);
        await webSocket.CloseAsync(
            receiveResult.CloseStatus.Value,
            receiveResult.CloseStatusDescription, CancellationToken.None);
        Console.WriteLine($"WebSocket desconectado: {socketId}");
    }

    public async Task SendMessageToAllAsync(string message)
    {
        var bytes = Encoding.UTF8.GetBytes(message);
        foreach (var pair in _sockets)
        {
            var webSocket = pair.Value;
            if (webSocket.State == WebSocketState.Open)
            {
                await webSocket.SendAsync(
                    new ArraySegment<byte>(bytes, 0, bytes.Length),
                    WebSocketMessageType.Text,
                    true,
                    CancellationToken.None);
            }
        }
    }
}