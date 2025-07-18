using FirebaseAdmin;
using Google.Apis.Auth.OAuth2;
using Microsoft.Extensions.Configuration;
using System.IO;
using System;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Builder; // Asegúrate de que este using esté presente si no lo está

var builder = WebApplication.CreateBuilder(args);

// --- MODIFICACIÓN CLAVE AQUÍ PARA ESCUCHAR EN TODAS LAS IPs ---
// Esto anulará las configuraciones de puertos en launchSettings.json y cualquier variable de entorno ASPNETCORE_URLS.
// Asegúrate de que los puertos 5213 y 7160 (o los que elijas) estén libres y permitidos por tu firewall.
builder.WebHost.UseUrls("http://0.0.0.0:5214", "https://0.0.0.0:7160");
// --- FIN MODIFICACIÓN ---


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

// Inicializa la configuración para SqlServerConnection
// Esto es necesario para que GetConnectionString() en SqlServerConnection funcione
SqlServerConnection.InitializeConfiguration(builder.Configuration);

AppConfig.ConfigureServices(builder.Services, builder.Configuration);

builder.Services.AddSingleton<IFirebaseAuthService, FirebaseAuthService>(); // Asegúrate de que IFirebaseAuthService y FirebaseAuthService estén definidos

var app = builder.Build();

AppConfig.ConfigurePipeline(app);

app.Run();