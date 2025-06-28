
var builder = WebApplication.CreateBuilder(args);

AppConfig.ConfigureServices(builder.Services, builder.Configuration);

var app = builder.Build();

AppConfig.ConfigurePipeline(app);

SqlServerConnection.InitializeConfiguration(builder.Configuration);

app.Run();
