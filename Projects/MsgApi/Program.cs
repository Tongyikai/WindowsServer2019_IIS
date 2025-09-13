using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowMsgSites", policy =>
        policy.WithOrigins("http://msg.r5599.xyz")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

var app = builder.Build();
app.UseCors("AllowMsgSites");   // ? ???? MapControllers ??
app.MapControllers();
app.Run();

