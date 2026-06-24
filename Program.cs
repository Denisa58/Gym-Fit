using GymFit.Data;
using GymFit.models;
using GymFit.services; // Adăugat pentru IEmailService
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.OData;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OData.ModelBuilder;
using Serilog;
using System.Text;
using System.IO;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);

// 1. CONFIGURARE LOG (Pentru Notepad++)
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .WriteTo.File("logs/gymfit_log.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

// 2. REPARARE CORS (Permite aplicației React să ceară date)
builder.Services.AddCors(options => {
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// 3. CONFIGURARE ODATA
var modelBuilder = new ODataConventionModelBuilder();
modelBuilder.EntitySet<Clients>("Clients");
modelBuilder.EntitySet<Admin>("Admins");
modelBuilder.EntitySet<Membership>("Memberships"); // 🎯 REPARAT: Expunem și tabela de abonamente prin OData!

builder.Services.AddControllers()
    .AddOData(options => options
        .Select().Filter().OrderBy().Expand().Count()
        .AddRouteComponents("odata", modelBuilder.GetEdmModel()));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<GymFitContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// ÎNREGISTRARE EMAIL SERVICE
builder.Services.AddTransient<IEmailService, EmailService>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
        };
    });

var app = builder.Build();

// 4. ACTIVARE ORDINE CORECTĂ (FOARTE IMPORTANT)
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// 🔥 SOLUȚIA RADICALĂ PENTRU STATICE: Găsim calea fizică exactă de pe disc către "wwwroot/uploads"
string absoluteUploadsPath = Path.Combine(app.Environment.ContentRootPath, "wwwroot", "uploads");

// Dacă din orice motiv folderul nu există pe disc, îl creăm acum
if (!Directory.Exists(absoluteUploadsPath))
{
    Directory.CreateDirectory(absoluteUploadsPath);
}

// Îi spunem .NET-ului să mapeze URL-ul "/uploads" DIRECT pe folderul fizic de pe disc
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(absoluteUploadsPath),
    RequestPath = "/uploads",
    OnPrepareResponse = ctx =>
    {
        // Forțăm permisiunile CORS globale pentru imagini
        ctx.Context.Response.Headers.Append("Access-Control-Allow-Origin", "*");
        ctx.Context.Response.Headers.Append("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    }
});

app.UseExceptionHandler(exceptionApp => exceptionApp.Run(async context =>
    await Results.Problem("A apărut o eroare la server.").ExecuteAsync(context)));

app.UseRouting();

// 🎯 REPARAT: Ordinea corectă a middleware-urilor pentru a nu bloca request-urile din React
app.UseCors();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.UseStaticFiles(); // Pentru fișierele statice implicite din wwwroot

app.Run();