// AppConfig.cs
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
using FirebaseAdmin.Auth;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using System.Threading.Tasks;

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

        services.AddScoped<AdminAuthFilter>();

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
            FirebaseToken decodedToken = await FirebaseAuth.DefaultInstance.VerifyIdTokenAsync(idToken);

            if (!decodedToken.Claims.ContainsKey("admin") || !(bool)decodedToken.Claims["admin"])
            {
                context.Result = new ForbidResult();
                return;
            }

            await next();
        }
        catch (FirebaseAuthException ex)
        {
            context.Result = new UnauthorizedObjectResult(new { message = $"Token de autenticación inválido: {ex.Message}" });
            return;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error inesperado en AdminAuthFilter: {ex.Message}");
            context.Result = new StatusCodeResult(500);
            return;
        }
    }
}