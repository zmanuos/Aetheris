using FirebaseAdmin;
using Google.Apis.Auth.OAuth2;
using Microsoft.Extensions.Configuration;
using System.IO;
using System;
using Microsoft.Extensions.DependencyInjection; 

var builder = WebApplication.CreateBuilder(args);

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

var app = builder.Build();


AppConfig.ConfigurePipeline(app);

app.Run();