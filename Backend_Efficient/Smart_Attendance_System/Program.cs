using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using Smart_Attendance_System.Data;

var builder = WebApplication.CreateBuilder(args);

// Load configuration
var config = builder.Configuration;

// Register DbContext with SQL Server
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(config.GetConnectionString("dbcs")));

// Add controllers
builder.Services.AddControllers();

// Enable CORS for any origin/method/header
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Register Swagger (No JWT)
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Smart Attendance System API",
        Version = "v1"
    });
});

var app = builder.Build();

// Enable Swagger in Development
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Redirect HTTP to HTTPS
app.UseHttpsRedirection();

// Enable CORS
app.UseCors("AllowAll");

// Map controller endpoints
app.MapControllers();

// Optional: Seed initial data if necessary

// Run the application
app.Run();
