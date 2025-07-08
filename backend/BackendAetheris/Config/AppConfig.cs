using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.FileProviders;
using System.IO;
using Microsoft.AspNetCore.Http;
using Microsoft.OpenApi.Models;
using System;
using System.Reflection;

// --- NUEVAS IMPORTACIONES PARA FIREBASE ADMIN SDK Y AUTORIZACIÓN ---
using FirebaseAdmin.Auth;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using System.Threading.Tasks;
// --- FIN NUEVAS IMPORTACIONES ---

public static class AppConfig
{
    private static readonly string MyAllowAllOrigins = "_myAllowAllOrigins"; 

    public static void ConfigureServices(IServiceCollection services, IConfiguration configuration)
    {
        services.AddControllers();
        services.AddEndpointsApiExplorer();

        services.AddSwaggerGen(options =>
        {
            options.SwaggerDoc("v1", new OpenApiInfo { Title = "Aetheris API", Version = "v1" });
            options.MapType<IFormFile>(() => new OpenApiSchema {
                Type = "string",
                Format = "binary"
            });
            options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Name = "Authorization",
                Type = SecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "JWT",
                In = ParameterLocation.Header,
                Description = "Ingresa el token JWT de la siguiente manera: Bearer {tu token}",
            });
            options.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference
                        {
                            Type = ReferenceType.SecurityScheme,
                            Id = "Bearer"
                        }
                    },
                    Array.Empty<string>()
                }
            });
        });

        services.AddDbContext<AppDbContext>(options =>
            options.UseMySql(
                configuration.GetConnectionString("DefaultConnection"),
                new MySqlServerVersion(new Version(8, 0, 21))
            ));

        services.AddSingleton<SqlServerConnection>(sp => {
            var config = sp.GetRequiredService<IConfiguration>();
            SqlServerConnection.InitializeConfiguration(config);
            return new SqlServerConnection();
        });

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = configuration["Jwt:Issuer"],
                    ValidAudience = configuration["Jwt:Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(configuration["Jwt:Key"]))
                };
            });

        // --- SE HA ELIMINADO EL REGISTRO DEL FILTRO DE AUTORIZACIÓN DE ADMINISTRADOR DE FIREBASE ---
        services.AddScoped<AdminAuthFilter>();
        // --- FIN REGISTRO DEL FILTRO ---

        services.AddCors(options =>
        {
            options.AddPolicy(name: MyAllowAllOrigins, 
                              policy =>
                              {
                                  policy.AllowAnyOrigin() 
                                        .AllowAnyHeader()  
                                        .AllowAnyMethod(); 
                              });
        });
    }

    public static void ConfigurePipeline(WebApplication app)
    {
        var env = app.Environment;

        if (env.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI();
        }

        app.UseCors(MyAllowAllOrigins); 

        app.UseAuthentication();
        app.UseAuthorization();

        app.UseStaticFiles(new StaticFileOptions
        {
            FileProvider = new PhysicalFileProvider(
                Path.Combine(env.WebRootPath, "images")),
            RequestPath = "/images"
        });

        app.UseStaticFiles(new StaticFileOptions
        {
            FileProvider = new PhysicalFileProvider(
                Path.Combine(env.WebRootPath, "images", "residents")),
            RequestPath = "/images/residents"
        });

        app.MapControllers();
    }
}


// --- LA CLASE AdminAuthFilter PERMANECE, PERO YA NO ESTÁ REGISTRADA NI USADA ---
public class AdminAuthFilter : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var httpContext = context.HttpContext;
        string? idToken = httpContext.Request.Headers["Authorization"].FirstOrDefault()?.Split(" ").Last();

        if (string.IsNullOrEmpty(idToken))
        {
            context.Result = new UnauthorizedResult();
            return;
        }

        try
        {
            // Verifica el token de Firebase ID y sus claims
            // Asegúrate de que FirebaseApp.DefaultInstance esté inicializado en Program.cs
            FirebaseToken decodedToken = await FirebaseAuth.DefaultInstance.VerifyIdTokenAsync(idToken);

            // Verifica si el custom claim 'admin' es true
            if (!decodedToken.Claims.ContainsKey("admin") || !(bool)decodedToken.Claims["admin"])
            {
                context.Result = new ForbidResult(); // 403 Forbidden
                return;
            }

            // Si es administrador, continúa con la ejecución del controlador
            await next();
        }
        catch (FirebaseAuthException ex)
        {
            // Token inválido, expirado, etc.
            context.Result = new UnauthorizedObjectResult(new { message = $"Token de autenticación inválido: {ex.Message}" }); // 401 Unauthorized
            return;
        }
        catch (Exception ex)
        {
            // Error inesperado en la verificación (e.g., FirebaseApp no inicializado)
            Console.WriteLine($"Error inesperado en AdminAuthFilter: {ex.Message}"); // Log para depuración
            context.Result = new StatusCodeResult(500); // Internal Server Error
            return;
        }
    }
}
// --- FIN CLASE DE FILTRO ---